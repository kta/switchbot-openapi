#!/usr/bin/env node

/**
 * Custom MCP Generator for SwitchBot API
 *
 * Generates comprehensive MCP (Model Context Protocol) server configuration
 * from OpenAPI specification, including all device-specific commands and parameters.
 */

import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// File paths
const OPENAPI_FILE = path.join(__dirname, '../dist/openapi.yaml');
const OUTPUT_FILE = path.join(__dirname, '../dist/mcp-server.yaml');
const DEVICES_CONFIG_FILE = path.join(__dirname, 'devices-config.json');

/**
 * Parse OpenAPI specification
 */
function parseOpenAPI() {
  const content = fs.readFileSync(OPENAPI_FILE, 'utf8');
  return YAML.parse(content);
}

/**
 * Load devices configuration
 */
function loadDevicesConfig() {
  const content = fs.readFileSync(DEVICES_CONFIG_FILE, 'utf8');
  return JSON.parse(content);
}

/**
 * Normalize device type for schema matching
 */
function normalizeDeviceType(deviceType) {
  return deviceType
    .replace(/\s+/g, '')
    .replace(/[()-]/g, '')
    .toLowerCase();
}

/**
 * Find schema by device type (fuzzy matching)
 */
function findSchema(schemas, deviceType, suffix) {
  const normalized = normalizeDeviceType(deviceType);

  // Try exact match first
  for (const key of Object.keys(schemas)) {
    if (key.toLowerCase() === normalized + suffix.toLowerCase()) {
      return { key, schema: schemas[key] };
    }
  }

  // Try partial match
  for (const key of Object.keys(schemas)) {
    const keyNorm = normalizeDeviceType(key.replace(suffix, ''));
    if (keyNorm === normalized || keyNorm.includes(normalized) || normalized.includes(keyNorm)) {
      if (key.endsWith(suffix)) {
        return { key, schema: schemas[key] };
      }
    }
  }

  return null;
}

/**
 * Extract device commands from schema
 */
function extractDeviceCommands(schema, deviceType) {
  if (!schema || !schema.properties) return null;

  const commands = [];
  const commandProp = schema.properties.command;

  if (commandProp && commandProp.enum) {
    for (const cmd of commandProp.enum) {
      commands.push({
        command: cmd,
        description: extractCommandDescription(schema, cmd, deviceType)
      });
    }
  }

  return {
    commands,
    parameters: extractParameters(schema),
    required: schema.required || []
  };
}

/**
 * Extract command description from schema
 */
function extractCommandDescription(schema, command, deviceType) {
  const commandProp = schema.properties?.command;

  if (commandProp?.description) {
    const lines = commandProp.description.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(command.toLowerCase())) {
        return line.replace(/^[-*]\s*/, '').replace(/^[^:]+:\s*/, '').trim();
      }
    }
  }

  // Default descriptions
  const defaults = {
    turnOn: 'Turn on the device',
    turnOff: 'Turn off the device',
    toggle: 'Toggle device power state',
    lock: 'Lock the device',
    unlock: 'Unlock the device',
    open: 'Open the device',
    close: 'Close the device',
    pause: 'Pause operation',
    start: 'Start operation',
    stop: 'Stop operation',
    dock: 'Return to dock',
    setPosition: 'Set position',
    setBrightness: 'Set brightness level',
    setColor: 'Set color',
    setColorTemperature: 'Set color temperature',
    setMode: 'Set operation mode',
    setFanSpeed: 'Set fan speed',
    setTemperature: 'Set target temperature',
    setHumidity: 'Set target humidity'
  };

  return defaults[command] || `Execute ${command} command`;
}

/**
 * Extract parameters from schema
 */
function extractParameters(schema) {
  if (!schema || !schema.properties) return {};

  const params = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key === 'commandType' || key === 'command') continue;

    params[key] = {
      type: prop.type || 'string',
      description: prop.description || `${key} parameter`,
      ...(prop.enum && { enum: prop.enum }),
      ...(prop.minimum !== undefined && { minimum: prop.minimum }),
      ...(prop.maximum !== undefined && { maximum: prop.maximum }),
      ...(prop.pattern && { pattern: prop.pattern }),
      ...(prop.example !== undefined && { example: prop.example })
    };
  }

  return params;
}

/**
 * Extract device status fields from schema
 */
function extractStatusFields(schema) {
  if (!schema || !schema.properties) return {};

  const fields = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (key === 'deviceId' || key === 'deviceType') continue;

    fields[key] = {
      type: prop.type || 'string',
      description: prop.description || key,
      ...(prop.enum && { enum: prop.enum }),
      ...(prop.example !== undefined && { example: prop.example })
    };
  }

  return fields;
}

/**
 * Determine if parameter is needed for command
 */
function needsParameter(command, paramDef) {
  const cmdLower = command.toLowerCase();

  // Commands that typically need parameters
  const paramCommands = [
    'set', 'position', 'brightness', 'color', 'temperature',
    'mode', 'speed', 'humidity', 'level', 'volume'
  ];

  for (const keyword of paramCommands) {
    if (cmdLower.includes(keyword)) return true;
  }

  // If parameter has multiple enum values (not just "default")
  if (paramDef.enum && paramDef.enum.length > 1) return true;
  if (paramDef.enum && paramDef.enum.length === 1 && paramDef.enum[0] !== 'default') return true;

  return false;
}

/**
 * Generate MCP tools from OpenAPI specification
 */
function generateMCPTools(openapi, devicesConfig) {
  const tools = [];
  const schemas = openapi.components?.schemas || {};
  const devices = devicesConfig.devices || [];

  console.log(`\n🔍 Processing ${devices.length} device types...`);

  // Add base device management tool
  tools.push({
    name: 'getDevices',
    description: 'Get list of all devices associated with your SwitchBot account',
    category: 'Device Management',
    endpoint: {
      method: 'GET',
      path: '/devices'
    },
    parameters: [],
    response: {
      description: 'Returns list of physical devices and infrared remote devices',
      schema: {
        deviceList: 'array',
        infraredRemoteList: 'array'
      }
    }
  });

  let processedDevices = 0;
  let skippedDevices = 0;

  // Process each device type
  for (const device of devices) {
    const deviceType = device.deviceType;
    const displayName = device.displayName;

    // Find command schema
    const commandResult = findSchema(schemas, deviceType, 'Command');
    const statusResult = findSchema(schemas, deviceType, 'Status');

    let hasTools = false;

    // Add status tool if available
    if (device.hasStatus && statusResult) {
      const statusFields = extractStatusFields(statusResult.schema);

      tools.push({
        name: `get${deviceType.replace(/\s+/g, '')}Status`,
        description: `Get current status of ${displayName} device`,
        category: displayName,
        endpoint: {
          method: 'GET',
          path: '/devices/{deviceId}/status'
        },
        parameters: [
          {
            name: 'deviceId',
            type: 'string',
            required: true,
            description: `Device ID of the ${displayName}`,
            in: 'path'
          }
        ],
        response: {
          description: `Current status of ${displayName}`,
          schema: statusFields
        }
      });
      hasTools = true;
    }

    // Add command tools if available
    if (device.hasCommands && commandResult) {
      const commandInfo = extractDeviceCommands(commandResult.schema, deviceType);

      if (commandInfo && commandInfo.commands.length > 0) {
        // Create a tool for each command
        for (const cmd of commandInfo.commands) {
          const toolParams = [
            {
              name: 'deviceId',
              type: 'string',
              required: true,
              description: `Device ID of the ${displayName}`,
              in: 'path'
            }
          ];

          // Add parameter field if needed
          if (commandInfo.parameters.parameter) {
            const paramDef = commandInfo.parameters.parameter;

            if (needsParameter(cmd.command, paramDef)) {
              toolParams.push({
                name: 'parameter',
                type: paramDef.type,
                required: true,
                description: paramDef.description,
                ...(paramDef.enum && { enum: paramDef.enum }),
                ...(paramDef.minimum !== undefined && { minimum: paramDef.minimum }),
                ...(paramDef.maximum !== undefined && { maximum: paramDef.maximum }),
                ...(paramDef.example !== undefined && { example: paramDef.example }),
                in: 'body'
              });
            }
          }

          // Add other command-specific parameters
          for (const [paramName, paramDef] of Object.entries(commandInfo.parameters)) {
            if (paramName === 'parameter') continue;

            toolParams.push({
              name: paramName,
              type: paramDef.type,
              required: commandInfo.required.includes(paramName),
              description: paramDef.description,
              ...(paramDef.enum && { enum: paramDef.enum }),
              ...(paramDef.minimum !== undefined && { minimum: paramDef.minimum }),
              ...(paramDef.maximum !== undefined && { maximum: paramDef.maximum }),
              ...(paramDef.example !== undefined && { example: paramDef.example }),
              in: 'body'
            });
          }

          tools.push({
            name: `${deviceType.replace(/\s+/g, '')}_${cmd.command}`,
            description: `${cmd.description} - ${displayName}`,
            category: displayName,
            endpoint: {
              method: 'POST',
              path: '/devices/{deviceId}/commands'
            },
            command: {
              commandType: 'command',
              command: cmd.command
            },
            parameters: toolParams
          });
          hasTools = true;
        }
      }
    }

    if (hasTools) {
      processedDevices++;
    } else {
      skippedDevices++;
      console.log(`   ⚠️  Skipped ${deviceType} (no command/status schema found)`);
    }
  }

  console.log(`   ✓ Processed ${processedDevices} devices`);
  if (skippedDevices > 0) {
    console.log(`   ⚠️  Skipped ${skippedDevices} devices`);
  }

  // Add scene tools
  tools.push({
    name: 'getScenes',
    description: 'Get list of all manual scenes',
    category: 'Scene Management',
    endpoint: {
      method: 'GET',
      path: '/scenes'
    },
    parameters: [],
    response: {
      description: 'Returns list of manual scenes'
    }
  });

  tools.push({
    name: 'executeScene',
    description: 'Execute a manual scene by its sceneId',
    category: 'Scene Management',
    endpoint: {
      method: 'POST',
      path: '/scenes/{sceneId}/execute'
    },
    parameters: [
      {
        name: 'sceneId',
        type: 'string',
        required: true,
        description: 'Unique scene identifier',
        in: 'path'
      }
    ]
  });

  // Add webhook tools
  const webhookTools = [
    {
      name: 'setupWebhook',
      description: 'Configure webhook URL to receive device status notifications',
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'Webhook endpoint URL (must be HTTPS)', in: 'body' },
        { name: 'deviceList', type: 'string', required: false, description: 'Comma-separated device IDs or "ALL"', in: 'body' }
      ]
    },
    {
      name: 'queryWebhook',
      description: 'Query current webhook configuration',
      parameters: []
    },
    {
      name: 'updateWebhook',
      description: 'Update existing webhook configuration',
      parameters: [
        { name: 'url', type: 'string', required: false, description: 'New webhook URL', in: 'body' },
        { name: 'deviceList', type: 'string', required: false, description: 'Updated device list', in: 'body' }
      ]
    },
    {
      name: 'deleteWebhook',
      description: 'Delete configured webhook',
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'Webhook URL to delete', in: 'body' }
      ]
    }
  ];

  for (const wh of webhookTools) {
    tools.push({
      name: wh.name,
      description: wh.description,
      category: 'Webhook Management',
      endpoint: {
        method: 'POST',
        path: `/webhook/${wh.name}`
      },
      parameters: wh.parameters
    });
  }

  return tools;
}

/**
 * Convert tools to MCP YAML format
 */
function convertToMCPFormat(tools, openapi) {
  const baseUrl = openapi.servers?.[0]?.url || 'https://api.switch-bot.com/v1.1';

  const mcp = {
    name: 'SwitchBot MCP Server',
    version: openapi.info?.version || '1.0.0',
    description: openapi.info?.description || 'SwitchBot API MCP Server with comprehensive device support',
    server: {
      baseUrl,
      authentication: {
        type: 'custom',
        description: 'SwitchBot API requires four headers: Authorization (token), sign (HMAC-SHA256), t (timestamp), nonce (UUID)',
        headers: [
          { name: 'Authorization', description: 'Access token', required: true },
          { name: 'sign', description: 'HMAC-SHA256 signature', required: true },
          { name: 't', description: 'Unix timestamp in milliseconds', required: true },
          { name: 'nonce', description: 'Random UUID', required: true }
        ]
      }
    },
    tools: []
  };

  // Group tools by category
  const categories = {};
  for (const tool of tools) {
    const category = tool.category || 'General';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(tool);
  }

  // Convert each tool
  for (const [category, categoryTools] of Object.entries(categories).sort()) {
    for (const tool of categoryTools) {
      const mcpTool = {
        name: tool.name,
        description: tool.description,
        category,
        input: {
          type: 'object',
          properties: {},
          required: []
        },
        endpoint: {
          method: tool.endpoint.method,
          path: tool.endpoint.path,
          ...(tool.command && {
            body: {
              commandType: tool.command.commandType,
              command: tool.command.command,
              ...(tool.parameters.some(p => p.name === 'parameter') && { parameter: '{parameter}' })
            }
          })
        }
      };

      // Add parameters
      for (const param of tool.parameters || []) {
        mcpTool.input.properties[param.name] = {
          type: param.type,
          description: param.description,
          ...(param.enum && { enum: param.enum }),
          ...(param.minimum !== undefined && { minimum: param.minimum }),
          ...(param.maximum !== undefined && { maximum: param.maximum }),
          ...(param.pattern && { pattern: param.pattern }),
          ...(param.example !== undefined && { example: param.example })
        };

        if (param.required) {
          mcpTool.input.required.push(param.name);
        }
      }

      // Add response schema if available
      if (tool.response) {
        mcpTool.output = {
          description: tool.response.description,
          ...(tool.response.schema && { schema: tool.response.schema })
        };
      }

      mcp.tools.push(mcpTool);
    }
  }

  // Add metadata
  const deviceCategories = Object.keys(categories).filter(c =>
    !['Device Management', 'Scene Management', 'Webhook Management'].includes(c)
  );

  mcp.metadata = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'SwitchBot Custom MCP Generator v2.0',
    deviceCount: deviceCategories.length,
    totalTools: mcp.tools.length,
    categories: Object.keys(categories).sort()
  };

  return mcp;
}

/**
 * Main function
 */
function main() {
  try {
    console.log('🚀 SwitchBot Custom MCP Generator v2.0\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Parse OpenAPI
    console.log('📖 Parsing OpenAPI specification...');
    const openapi = parseOpenAPI();
    console.log(`   ✓ Found ${Object.keys(openapi.components?.schemas || {}).length} schemas`);

    // Load devices config
    console.log('📋 Loading devices configuration...');
    const devicesConfig = loadDevicesConfig();
    console.log(`   ✓ Found ${devicesConfig.devices?.length || 0} device types`);

    // Generate tools
    console.log('\n🔧 Generating MCP tools...');
    const tools = generateMCPTools(openapi, devicesConfig);
    console.log(`   ✓ Generated ${tools.length} tools`);

    // Convert to MCP format
    console.log('\n📝 Converting to MCP format...');
    const mcp = convertToMCPFormat(tools, openapi);

    // Count by category
    const categoryCounts = {};
    for (const tool of mcp.tools) {
      categoryCounts[tool.category] = (categoryCounts[tool.category] || 0) + 1;
    }

    console.log('\n📊 Tool Distribution:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const [category, count] of Object.entries(categoryCounts).sort()) {
      console.log(`   ${category.padEnd(35)} ${count.toString().padStart(3)} tools`);
    }

    // Write output
    console.log('\n💾 Writing MCP configuration...');
    const yamlContent = YAML.stringify(mcp, {
      indent: 2,
      lineWidth: 0,
      minContentWidth: 0
    });

    fs.writeFileSync(OUTPUT_FILE, yamlContent, 'utf8');
    console.log(`   ✓ Written to: ${OUTPUT_FILE}`);

    // Final statistics
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Generation Complete!\n');
    console.log(`   📦 Total Tools:      ${mcp.tools.length}`);
    console.log(`   🎯 Device Types:     ${mcp.metadata.deviceCount}`);
    console.log(`   📂 Categories:       ${mcp.metadata.categories.length}`);
    console.log(`   🔗 Base URL:         ${mcp.server.baseUrl}`);
    console.log(`   📅 Generated:        ${new Date().toLocaleString()}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error generating MCP configuration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();
