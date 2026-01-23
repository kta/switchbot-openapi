# SwitchBot OpenAPI Specification

<!-- Replace YOUR_USERNAME with your GitHub username to enable badge -->
<!-- ![Validate](https://github.com/YOUR_USERNAME/switchbot-openapi/workflows/Validate%20OpenAPI/badge.svg) -->

Auto-updating OpenAPI 3.1.0 specification for the [SwitchBot API](https://github.com/OpenWonderLabs/SwitchBotAPI).

## Overview

This project maintains a comprehensive OpenAPI specification that automatically syncs with the official SwitchBot API documentation. When the official README is updated, this repository detects changes and uses GitHub Copilot to generate updated OpenAPI schemas.

WebSiteLink: https://switchbot-openapi.vercel.app/

**Status: ✅ Complete** - All 63 device types have been fully defined with comprehensive OpenAPI schemas.

## Features

- **OpenAPI 3.1.0** compliant specification
- **MCP Server Support** - Auto-generated Model Context Protocol configuration for AI assistants
- **AI-powered automation** using GitHub Copilot (GPT-4o)
- **Automatic synchronization** with upstream SwitchBot API documentation
- **63 device types** fully supported across 28 schema files
- **Modular structure** with separate schema files per device category
- **GitHub Actions** for automated updates and validation
- **Ready for code generation** - use with any OpenAPI client generator
- **Free to run** - no API keys or billing required
- **Complete coverage** - all device Status, Commands, and Webhook events defined

## Quick Start

### Install Dependencies

```bash
npm install
```

### Build OpenAPI Specification

```bash
# Bundle all YAML files into single openapi.yaml
npm run bundle

# Validate the specification
npm run validate

# Build everything (bundle + validate + generate MCP server)
npm run build
```

### Generate MCP Server Configuration

This project features a **custom-built MCP generator** that creates comprehensive tool definitions for all SwitchBot devices, going far beyond basic endpoint mapping.

```bash
# Generate MCP server configuration
npm run build:mcp

# Output: dist/mcp-server.yaml (183+ tools across 51+ device types)
```

The MCP server configuration is automatically generated as part of the build process and can be used with AI tools like Claude Desktop, Cursor, or other MCP-compatible clients.

**What makes this MCP configuration special:**

Unlike generic OpenAPI-to-MCP converters that only extract basic endpoints, our custom generator:

✅ **Device-Specific Commands** - Each device type gets dedicated tools
  - `Bot_turnOn`, `Bot_turnOff` - Physical button control
  - `SmartLock_lock`, `SmartLock_unlock` - Lock control
  - `ColorBulb_setBrightness`, `ColorBulb_setColor`, `ColorBulb_setColorTemperature` - Light control
  - `Humidifier_setMode` with auto/low/medium/high options
  - And 170+ more device-specific commands!

✅ **Detailed Parameter Definitions**
  - RGB color codes for lights (e.g., `"FF6347"`)
  - Position values for curtains/blinds (0-100)
  - Temperature ranges for climate devices
  - Mode enumerations for each device type

✅ **Complete Coverage**
  - **183 tools** across **51 device types**
  - Status retrieval for all devices
  - Command execution for all controllable devices
  - Scene management and webhook configuration

**Generated Tool Categories:**
- Smart Locks (4 variants: Standard, Pro, Ultra, Lite)
- Lights (Color Bulb, Strip Light, Ceiling Light, Floor Lamp, RGBIC variants)
- Climate Control (Humidifier, Air Purifier, Radiator Thermostat, Circulator Fan)
- Curtains & Blinds (Curtain, Blind Tilt, Roller Shade)
- Robot Vacuums (S1, S1 Plus)
- Sensors (Meter, Motion, Contact, Presence, Water Leak)
- And many more...

**Using with Claude Desktop:**
Add the MCP server configuration to your Claude Desktop settings to give Claude direct control over all your SwitchBot devices with full parameter awareness.

### Use the Specification

The bundled `openapi.yaml` file can be used with any OpenAPI-compatible tool:

```bash
# Generate TypeScript client with openapi-generator
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/typescript

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python
```

## Supported Devices

All 63 SwitchBot device types are fully supported:

- **Switch/Plug** (4): Bot, Plug, Plug Mini (US/JP/EU), Relay Switch (1/1PM/2PM)
- **Curtain/Blind** (4): Curtain, Curtain 3, Blind Tilt, Roller Shade
- **Lock** (6): Smart Lock, Lock Pro, Lock Ultra, Lock Lite, Keypad, Keypad Touch, Keypad Vision, Keypad Vision Pro
- **Sensor** (8): Meter, Meter Plus, Meter Pro, Meter Pro CO2, Outdoor Meter, Motion Sensor, Contact Sensor, Presence Sensor, Water Leak Detector
- **Light** (11): Color Bulb, Strip Light, Strip Light 3, Ceiling Light, Ceiling Light Pro, Floor Lamp, RGBICWW Strip/Floor Lamp, RGBIC Neon Wire/Rope Light, Candle Warmer Lamp
- **Hub** (5): Hub Mini, Hub Plus, Hub 2, Hub 3, AI Hub
- **Robot Vacuum** (9): S1/S1 Plus, K10+/Pro/Pro Combo, K11+, K20+ Pro, Floor Cleaning S10/S20
- **Climate** (7): Humidifier, Evaporative Humidifier, Air Purifier VOC/PM2.5, Smart Radiator Thermostat
- **Fan** (3): Battery Circulator Fan, Circulator Fan, Standing Circulator Fan
- **Camera** (6): Indoor Cam, Pan/Tilt Cam variants, Video Doorbell
- **Other** (4): Remote, Garage Door Opener, Home Climate Panel, AI Art Frame, Virtual IR Remote

## Project Structure

```
.
├── src/
│   ├── main.yaml                    # OpenAPI entry point
│   ├── components/
│   │   ├── securitySchemes.yaml     # Authentication definitions
│   │   ├── parameters.yaml          # Reusable parameters
│   │   ├── responses.yaml           # Common response schemas
│   │   └── schemas/
│   │       ├── common.yaml          # Base schemas
│   │       └── devices/             # 28 device schema files
│   │           ├── bot.yaml
│   │           ├── curtain.yaml
│   │           ├── lock.yaml
│   │           ├── camera.yaml
│   │           ├── robot-vacuum.yaml
│   │           └── ... (23 more)
│   └── paths/
│       ├── devices.yaml             # GET /devices
│       ├── devices-status.yaml      # GET /devices/{id}/status
│       ├── devices-commands.yaml    # POST /devices/{id}/commands
│       ├── scenes.yaml              # Scene endpoints
│       └── webhook.yaml             # Webhook endpoints
├── dist/
│   ├── index.html                   # API documentation
│   ├── openapi.yaml                 # Bundled OpenAPI spec
│   └── mcp-server.yaml              # MCP server configuration
├── scripts/
│   ├── devices-config.json          # 63 device type mappings
│   ├── extract-sections.js          # README change detection
│   ├── update-device.js             # LLM-based schema generation
│   ├── hash-store.json              # Change detection cache
│   └── prompt-template.md           # LLM prompt template
└── openapi.yaml                     # Generated bundled spec
```

## Automation

### Change Detection

The system monitors the official SwitchBot README for changes:

```bash
npm run extract
```

This script:
1. Downloads the latest README from GitHub
2. Extracts device documentation sections
3. Computes SHA256 hashes
4. Compares with previous hashes
5. Outputs changed sections to `scripts/changed-sections.json`

### Schema Generation

The system uses **GitHub Models API** (powered by GitHub Copilot) to automatically generate device schemas from README documentation.

When changes are detected, schemas are regenerated using:

```bash
# Authenticate with GitHub CLI (one-time setup)
gh auth login

# Update a specific device (token auto-detected from gh CLI)
node scripts/update-device.js <deviceType>
```

The script automatically uses your GitHub CLI authentication - no manual token setup required!

The script uses GPT-4o via GitHub Models API to:
- Parse unstructured README sections
- Extract device capabilities, status fields, and commands
- Generate valid OpenAPI 3.1.0 YAML schemas
- Ensure consistency with existing patterns

**No API keys or billing required!** GitHub Models API is free within rate limits.

### GitHub Actions

Two workflows are configured:

1. **Update OpenAPI** (`.github/workflows/update-api.yml`)
   - Runs daily at 2:00 AM UTC
   - Checks for README changes
   - Uses GitHub Copilot (GPT-4o) to generate schemas
   - Creates PR with updated schemas
   - **No secrets required!** Uses built-in `GITHUB_TOKEN`

2. **Validate** (`.github/workflows/validate.yml`)
   - Runs on PRs and commits
   - Validates OpenAPI spec
   - Uploads bundled spec as artifact

## Authentication

The SwitchBot API requires four headers for authentication:

```
Authorization: <your_token>
sign: <HMAC-SHA256 signature>
t: <timestamp in milliseconds>
nonce: <random UUID>
```

See the [official documentation](https://github.com/OpenWonderLabs/SwitchBotAPI#authentication) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to validate
5. Submit a pull request

### Adding a New Device

See [CLAUDE.md](./CLAUDE.md) for detailed instructions on adding new devices.

Quick steps:
1. Add device configuration to `scripts/devices-config.json`
2. Create schema file in `src/components/schemas/devices/`
3. Follow the four-component pattern: Device, Status, Command, WebhookEvent
4. Run `npm run build` to validate

## License

MIT

## Related Projects

- [Official SwitchBot API Documentation](https://github.com/OpenWonderLabs/SwitchBotAPI)
- [SwitchBot](https://www.switchbot.jp/)

## Disclaimer

This is an unofficial OpenAPI specification. Always refer to the [official SwitchBot API documentation](https://github.com/OpenWonderLabs/SwitchBotAPI) for the most accurate and up-to-date information.
