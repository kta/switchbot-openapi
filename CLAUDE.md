# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project maintains an OpenAPI 3.1.0 specification for the SwitchBot API that automatically syncs with the official SwitchBot README when it's updated. The system uses LLMs to parse README changes and regenerate OpenAPI schemas for 70+ device types.

## Architecture

### Core Structure

The project follows a modular OpenAPI architecture:

- `src/main.yaml` - Main OpenAPI entry point with references to all paths and components
- `src/paths/` - Individual endpoint definitions (devices, scenes, webhook)
- `src/components/` - Reusable OpenAPI components
  - `securitySchemes.yaml` - Authentication (token, signature, timestamp, nonce)
  - `parameters.yaml` - Common path parameters (deviceId, sceneId)
  - `responses.yaml` - Standard success/error responses
  - `schemas/common.yaml` - Base response and error schemas
  - `schemas/devices/` - Per-device-type schemas (bot.yaml, lock.yaml, etc.)

### Device Schema Pattern

Each device YAML in `src/components/schemas/devices/` contains four key components:
1. **DeviceListResponse** - Schema for GET /devices response
2. **StatusResponse** - Schema for GET /devices/{id}/status
3. **CommandRequest** - Schema for POST /devices/{id}/commands
4. **WebhookEvent** - Webhook payload schema (if supported)

### Automation System

The auto-update pipeline:
1. `scripts/extract-sections.js` - Downloads official README, extracts device sections, computes SHA256 hashes
2. `scripts/hash-store.json` - Stores previous hashes for change detection
3. `scripts/devices-config.json` - Maps device types to YAML files and README sections
4. `scripts/update-device.js` - Calls LLM API to regenerate YAML from README changes
5. `scripts/bundle.js` - Uses @redocly/cli to bundle all YAMLs into single `openapi.yaml`

GitHub Actions workflow runs daily, detects changes, updates affected device schemas, and creates a PR.

## Development Commands

### Bundling and Validation
```bash
# Bundle all YAML files into single OpenAPI spec
npm run bundle

# Validate OpenAPI spec
npm run validate

# Bundle and validate together
npm run build
```

### Running Scripts
```bash
# Check for README changes (outputs changed sections)
node scripts/extract-sections.js

# Update a specific device (if changes detected)
node scripts/update-device.js bot

# Full update cycle (detect + update all changed devices)
npm run update
```

## Device Categories

Devices are organized by type:
- **Switch/Plug** - bot, plug, plug-mini-*, relay-switch-*
- **Curtain/Blind** - curtain, curtain3, blind-tilt, roller-shade
- **Lock** - lock, lock-pro, lock-ultra, lock-lite, keypad-*
- **Sensor** - meter-*, motion-sensor, contact-sensor, presence-sensor, water-leak-detector
- **Light** - color-bulb, strip-light-*, ceiling-light-*, floor-lamp, rgbic-*, candle-warmer-lamp
- **Hub** - hub, hub2, hub3, ai-hub
- **Robot Vacuum** - robot-vacuum-*, floor-cleaning-*
- **Climate** - humidifier-*, air-purifier-*, smart-radiator-thermostat
- **Fan** - battery-circulator-fan, circulator-fan, standing-circulator-fan
- **Camera** - indoor-cam, pan-tilt-cam-*, video-doorbell
- **Other** - remote, garage-door-opener, home-climate-panel, ai-art-frame, virtual-ir-remote

## Adding a New Device

1. Add device entry to `scripts/devices-config.json` with:
   - `deviceType` (API identifier)
   - `displayName` (human-readable name)
   - `yamlFile` (path in src/components/schemas/devices/)
   - `readmeHeaders` (array of section titles in official README)
   - Boolean flags: `hasStatus`, `hasCommands`, `hasWebhook`

2. Create YAML file in `src/components/schemas/devices/` following the four-component pattern

3. Add $ref to the device schema in appropriate path files

4. Run `npm run bundle` to regenerate combined spec

## Authentication

SwitchBot API uses four-header authentication:
- `Authorization` - Access token
- `sign` - HMAC-SHA256 signature
- `t` - Unix timestamp (milliseconds)
- `nonce` - Random UUID

All defined in `src/components/securitySchemes.yaml`.

## OpenAPI Version

This project uses **OpenAPI 3.1.0** (not 3.0.x) for enhanced JSON Schema compatibility. We use @redocly/cli for bundling and validation.

## GitHub Copilot Integration

The update scripts use **GitHub Models API** (GitHub Copilot with GPT-4o) to automatically generate device schemas:

### How It Works
1. `scripts/extract-sections.js` detects changes in the official README
2. `scripts/update-device.js` calls GitHub Models API with the changed sections
3. GPT-4o generates valid OpenAPI YAML schemas based on the prompt template
4. Generated schemas are validated and written to device YAML files

### No Configuration Required
- Uses built-in `GITHUB_TOKEN` in GitHub Actions
- No API keys or billing needed
- Free within rate limits (15 requests/minute)

### Local Testing
```bash
# Authenticate with GitHub CLI (one-time)
gh auth login

# Test the integration
npm run test:copilot

# Update a specific device (token auto-detected)
node scripts/update-device.js Bot
```

The scripts automatically detect and use your `gh` CLI authentication!

### API Details
- **Endpoint**: `https://models.inference.ai.azure.com/chat/completions`
- **Model**: `gpt-4o`
- **Temperature**: 0.3 (consistent output)
- **Max Tokens**: 4000

Prompt template is in `scripts/prompt-template.md`.
