#!/usr/bin/env node

/**
 * Extract device sections from SwitchBot README and detect changes
 * Outputs changed sections and updates hash store
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

const CONFIG_FILE = './scripts/devices-config.json';
const HASH_STORE_FILE = './scripts/hash-store.json';

/**
 * Fetch README from GitHub
 */
async function fetchReadme(url) {
  console.log(`📥 Fetching README from ${url}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    console.log(`✅ README fetched (${text.length} characters)`);
    return text;
  } catch (error) {
    console.error('❌ Failed to fetch README:', error.message);
    process.exit(1);
  }
}

/**
 * Extract a section from markdown by header name
 */
function extractSection(markdown, headerName) {
  // Escape special regex characters in headerName
  const escapedHeaderName = headerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match the header (## to ####) and capture content until next header of same or higher level
  const headerRegex = new RegExp(`^(#{2,4})\\s+${escapedHeaderName}\\s*$`, 'mi');
  const match = markdown.match(headerRegex);

  if (!match) {
    return null;
  }

  const headerLevel = match[1].length;
  const startIndex = match.index;

  // Find next header of same or higher level
  const nextHeaderRegex = new RegExp(`^#{1,${headerLevel}}\\s+`, 'gm');
  nextHeaderRegex.lastIndex = startIndex + match[0].length;

  const nextMatch = nextHeaderRegex.exec(markdown);
  const endIndex = nextMatch ? nextMatch.index : markdown.length;

  const section = markdown.substring(startIndex, endIndex).trim();
  return section;
}

/**
 * Calculate SHA256 hash of content
 */
function calculateHash(content) {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Load hash store
 */
function loadHashStore() {
  if (!existsSync(HASH_STORE_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(HASH_STORE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️  Could not load hash store, starting fresh');
    return {};
  }
}

/**
 * Save hash store
 */
function saveHashStore(hashes) {
  writeFileSync(HASH_STORE_FILE, JSON.stringify(hashes, null, 2));
  console.log(`💾 Hash store updated: ${HASH_STORE_FILE}`);
}

/**
 * Main execution
 */
async function main() {
  // Load configuration
  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  const readme = await fetchReadme(config.readme.url);

  // Load previous hashes
  const previousHashes = loadHashStore();
  const currentHashes = {};
  const changedSections = [];

  console.log('\n🔍 Analyzing sections...\n');

  // Process each device
  for (const device of config.devices) {
    for (const headerName of device.readmeHeaders) {
      const sectionKey = `${device.deviceType}::${headerName}`;
      const section = extractSection(readme, headerName);

      if (!section) {
        console.log(`⚠️  Section not found: ${headerName} (${device.deviceType})`);
        continue;
      }

      const currentHash = calculateHash(section);
      currentHashes[sectionKey] = currentHash;

      const previousHash = previousHashes[sectionKey];

      if (!previousHash) {
        console.log(`🆕 NEW: ${headerName} (${device.deviceType})`);
        changedSections.push({
          device: device.deviceType,
          header: headerName,
          section,
          reason: 'new'
        });
      } else if (previousHash !== currentHash) {
        console.log(`🔄 CHANGED: ${headerName} (${device.deviceType})`);
        changedSections.push({
          device: device.deviceType,
          header: headerName,
          section,
          reason: 'modified'
        });
      } else {
        console.log(`✓ No change: ${headerName} (${device.deviceType})`);
      }
    }
  }

  // Save current hashes
  saveHashStore(currentHashes);

  // Output summary
  console.log(`\n📊 Summary:`);
  console.log(`   Total sections: ${Object.keys(currentHashes).length}`);
  console.log(`   Changed: ${changedSections.length}`);

  if (changedSections.length > 0) {
    console.log('\n📝 Changed sections:');
    changedSections.forEach(({ device, header, reason }) => {
      console.log(`   - ${device} / ${header} (${reason})`);
    });

    // Write changed sections to file for processing
    writeFileSync(
      './scripts/changed-sections.json',
      JSON.stringify(changedSections, null, 2)
    );
    console.log('\n💾 Changed sections saved to: scripts/changed-sections.json');
  }

  process.exit(changedSections.length > 0 ? 0 : 1);
}

main();
