#!/usr/bin/env node

/**
 * Generate complete schemas section for main.yaml
 * This ensures all device schemas are properly referenced in the bundled spec
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load devices config
const configPath = join(__dirname, 'devices-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));

// Get unique YAML files
const deviceYamlFiles = new Set(config.devices.map(d => d.yamlFile));

// Read each device YAML file to discover schema names
const schemaRefs = [];

deviceYamlFiles.forEach(yamlFile => {
  const fullPath = join(__dirname, '..', yamlFile);
  const content = readFileSync(fullPath, 'utf8');
  const parsed = YAML.parse(content);

  if (parsed && parsed.schemas) {
    const filename = yamlFile.split('/').pop();
    Object.keys(parsed.schemas).forEach(schemaName => {
      schemaRefs.push({
        name: schemaName,
        ref: `./components/schemas/devices/${filename}#/schemas/${schemaName}`
      });
    });
  }
});

// Generate YAML content for schemas section
const schemasYaml = schemaRefs.map(({ name, ref }) =>
  `    ${name}:\n      $ref: '${ref}'`
).join('\n');

// Read current main.yaml
const mainYamlPath = join(__dirname, '../src/main.yaml');
const mainContent = readFileSync(mainYamlPath, 'utf8');

// Replace schemas section
const updatedContent = mainContent.replace(
  /  schemas:\n.*?(\n\S|\n$)/s,
  `  schemas:
    # Common schemas
    BaseResponse:
      $ref: './components/schemas/common.yaml#/schemas/BaseResponse'
    ErrorResponse:
      $ref: './components/schemas/common.yaml#/schemas/ErrorResponse'
    DeviceBase:
      $ref: './components/schemas/common.yaml#/schemas/DeviceBase'

    # Device-specific schemas (auto-generated)
${schemasYaml}
`
);

writeFileSync(mainYamlPath, updatedContent, 'utf8');

console.log(`✅ Generated ${schemaRefs.length} schema references`);
console.log(`📝 Updated: ${mainYamlPath}`);
