# SwitchBot OpenAPI Specification

![Validate](https://github.com/YOUR_USERNAME/switchbot-openapi/workflows/Validate%20OpenAPI/badge.svg)

Auto-updating OpenAPI 3.1.0 specification for the [SwitchBot API](https://github.com/OpenWonderLabs/SwitchBotAPI).

## Overview

This project maintains an OpenAPI specification that automatically syncs with the official SwitchBot API documentation. When the official README is updated, this repository detects changes and uses GitHub Copilot to generate updated OpenAPI schemas.

## Features

- **OpenAPI 3.1.0** compliant specification
- **AI-powered automation** using GitHub Copilot (GPT-4o)
- **Automatic synchronization** with upstream SwitchBot API documentation
- **70+ device types** supported
- **Modular structure** with separate schema files per device type
- **GitHub Actions** for automated updates and validation
- **Ready for code generation** - use with any OpenAPI client generator
- **Free to run** - no API keys or billing required

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

# Build (bundle + validate)
npm run build
```

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
│   │       └── devices/             # Device-specific schemas
│   │           ├── bot.yaml
│   │           ├── curtain.yaml
│   │           ├── lock.yaml
│   │           └── ...
│   └── paths/
│       ├── devices.yaml             # GET /devices
│       ├── devices-status.yaml      # GET /devices/{id}/status
│       ├── devices-commands.yaml    # POST /devices/{id}/commands
│       ├── scenes.yaml              # Scene endpoints
│       └── webhook.yaml             # Webhook endpoints
├── scripts/
│   ├── devices-config.json          # Device type mappings
│   ├── extract-sections.js          # README change detection
│   ├── update-device.js             # LLM-based schema generation
│   ├── bundle.js                    # Bundle script
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

1. Add device configuration to `scripts/devices-config.json`
2. Create schema file in `src/components/schemas/devices/`
3. Follow the four-component pattern: Device, Status, Command, WebhookEvent
4. Run `npm run build` to test

## License

MIT

## Related Projects

- [Official SwitchBot API Documentation](https://github.com/OpenWonderLabs/SwitchBotAPI)
- [SwitchBot](https://www.switchbot.jp/)

## Disclaimer

This is an unofficial OpenAPI specification. Always refer to the [official SwitchBot API documentation](https://github.com/OpenWonderLabs/SwitchBotAPI) for the most accurate and up-to-date information.
