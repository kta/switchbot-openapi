#!/usr/bin/env node

/**
 * Generate schema references for all device types
 * This ensures all device schemas are included in the bundled OpenAPI spec
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load devices config
const configPath = join(__dirname, 'devices-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));

// Get unique YAML files
const uniqueYamlFiles = [...new Set(config.devices.map(d => d.yamlFile))];

// Generate schema references
const schemaRefs = uniqueYamlFiles.map(yamlFile => {
  // Extract filename without path and extension
  const filename = yamlFile.split('/').pop().replace('.yaml', '');
  return `    $ref: './devices/${filename}.yaml#/schemas'`;
}).join('\n');

// Create common.yaml content
const commonYaml = `schemas:
  BaseResponse:
    type: object
    required:
      - statusCode
      - message
    properties:
      statusCode:
        type: integer
        description: Response status code (100 for success)
        example: 100
      message:
        type: string
        description: Response message
        example: "success"
      body:
        description: Response payload (structure varies by endpoint)
        oneOf:
          - type: object
          - type: array

  ErrorResponse:
    type: object
    required:
      - statusCode
      - message
    properties:
      statusCode:
        type: integer
        description: |
          Error code indicating the type of failure:
          - 100: Signature verification failed
          - 151: Device not found
          - 152: Device type not supported
          - 160: Command not supported
          - 161: Device offline
          - 162: Device internal error
          - 169: Too many requests
          - 171: System error
          - 190: Unauthorized / Invalid token
        enum:
          - 100
          - 151
          - 152
          - 160
          - 161
          - 162
          - 169
          - 171
          - 190
        example: 190
      message:
        type: string
        description: Human-readable error message
        example: "Unauthorized"

  DeviceBase:
    type: object
    description: Common properties for all devices
    required:
      - deviceId
      - deviceName
      - deviceType
      - hubDeviceId
    properties:
      deviceId:
        type: string
        description: Unique device identifier
        example: "C271111EC0AB"
      deviceName:
        type: string
        description: User-defined device name
        example: "Living Room Bot"
      deviceType:
        type: string
        description: Device type identifier
        example: "Bot"
      hubDeviceId:
        type: string
        description: Parent Hub device ID (empty string for Hub devices)
        example: "FA7310762361"
      enableCloudService:
        type: boolean
        description: Whether cloud service is enabled for this device
        example: true

# Device-specific schemas (imported for bundling)
  # These schemas are defined in separate files and imported here
  # to ensure they are included in the bundled OpenAPI specification
${schemaRefs}
`;

// Write to common.yaml
const commonYamlPath = join(__dirname, '../src/components/schemas/common.yaml');
writeFileSync(commonYamlPath, commonYaml, 'utf8');

console.log(`✅ Generated schema references for ${uniqueYamlFiles.length} device types`);
console.log(`📝 Updated: ${commonYamlPath}`);
