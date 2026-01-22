#!/usr/bin/env node

/**
 * Update a single device schema using LLM API
 * Usage: node scripts/update-device.js <deviceType>
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const CHANGED_SECTIONS_FILE = './scripts/changed-sections.json';
const PROMPT_TEMPLATE_FILE = './scripts/prompt-template.md';
const CONFIG_FILE = './scripts/devices-config.json';

/**
 * Load prompt template
 */
function loadPromptTemplate() {
  return readFileSync(PROMPT_TEMPLATE_FILE, 'utf-8');
}

/**
 * Generate prompt for device
 */
function generatePrompt(deviceType, readmeSection, existingSchema) {
  let template = loadPromptTemplate();

  template = template.replace('{DEVICE_TYPE}', deviceType);
  template = template.replace('{README_SECTION}', readmeSection);
  template = template.replace('{EXISTING_SCHEMA}', existingSchema || 'None');

  return template;
}

/**
 * Get GitHub token from environment or gh CLI
 */
async function getGitHubToken() {
  // Try environment variable first
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // Try to get token from gh CLI
  try {
    const { execSync } = await import('child_process');
    const token = execSync('gh auth token', { encoding: 'utf-8' }).trim();
    if (token) {
      console.log('ℹ️  Using GitHub token from gh CLI');
      return token;
    }
  } catch (error) {
    // gh CLI not available or not authenticated
  }

  console.error('❌ GitHub token not found');
  console.error('');
  console.error('Please authenticate with GitHub CLI:');
  console.error('  gh auth login');
  console.error('');
  console.error('Or set GITHUB_TOKEN environment variable:');
  console.error('  export GITHUB_TOKEN=$(gh auth token)');
  throw new Error('GITHUB_TOKEN not configured');
}

/**
 * Call GitHub Copilot API to generate schema
 * Uses GitHub Models API with GPT-4o
 */
async function callLLM(prompt) {
  const token = await getGitHubToken();

  console.log('🤖 Calling GitHub Copilot API...');

  try {
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in OpenAPI 3.1.0 specification. Generate only valid YAML content without any markdown formatting or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Remove markdown code blocks if present
    let yamlContent = generatedContent;
    if (yamlContent.includes('```yaml')) {
      yamlContent = yamlContent.replace(/```yaml\n?/g, '').replace(/```\n?/g, '');
    } else if (yamlContent.includes('```')) {
      yamlContent = yamlContent.replace(/```\n?/g, '');
    }

    return yamlContent.trim();

  } catch (error) {
    console.error('❌ Failed to call GitHub Copilot API:', error.message);
    throw error;
  }
}

/**
 * Validate YAML syntax
 */
function validateYAML(yamlContent) {
  try {
    // Basic validation - check if it starts with 'schemas:'
    if (!yamlContent.trim().startsWith('schemas:')) {
      throw new Error('YAML must start with "schemas:"');
    }
    return true;
  } catch (error) {
    console.error('❌ Invalid YAML:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const deviceType = process.argv[2];

  if (!deviceType) {
    console.error('Usage: node scripts/update-device.js <deviceType>');
    console.error('Example: node scripts/update-device.js Bot');
    process.exit(1);
  }

  // Load configuration
  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  const device = config.devices.find(d => d.deviceType === deviceType);

  if (!device) {
    console.error(`❌ Device type "${deviceType}" not found in configuration`);
    process.exit(1);
  }

  // Load changed sections
  if (!existsSync(CHANGED_SECTIONS_FILE)) {
    console.log('ℹ️  No changed sections found. Run extract-sections.js first.');
    process.exit(0);
  }

  const changedSections = JSON.parse(readFileSync(CHANGED_SECTIONS_FILE, 'utf-8'));
  const deviceSections = changedSections.filter(s => s.device === deviceType);

  if (deviceSections.length === 0) {
    console.log(`ℹ️  No changes detected for ${deviceType}`);
    process.exit(0);
  }

  console.log(`🔧 Updating schema for ${deviceType}...`);

  // Load existing schema if exists
  let existingSchema = '';
  if (existsSync(device.yamlFile)) {
    existingSchema = readFileSync(device.yamlFile, 'utf-8');
  }

  // Combine all sections for this device
  const readmeContent = deviceSections.map(s => s.section).join('\n\n---\n\n');

  // Generate prompt
  const prompt = generatePrompt(deviceType, readmeContent, existingSchema);

  try {
    // Call LLM API
    const generatedYAML = await callLLM(prompt);

    // Validate YAML
    if (!validateYAML(generatedYAML)) {
      throw new Error('Generated YAML is invalid');
    }

    // Write to file
    writeFileSync(device.yamlFile, generatedYAML);
    console.log(`✅ Schema updated: ${device.yamlFile}`);

  } catch (error) {
    console.error(`❌ Failed to update ${deviceType}:`, error.message);
    process.exit(1);
  }
}

main();
