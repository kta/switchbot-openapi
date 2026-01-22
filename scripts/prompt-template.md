# OpenAPI Schema Generation Prompt

You are an expert in OpenAPI 3.1.0 specification and the SwitchBot API.

## Your Task

Generate a complete OpenAPI schema YAML file for the {DEVICE_TYPE} device based on the official SwitchBot README documentation provided below.

## Input Data

### README Section
```markdown
{README_SECTION}
```

### Existing Schema (if any)
```yaml
{EXISTING_SCHEMA}
```

## Output Requirements

1. **Format**: Output MUST be valid YAML only. No explanations, no markdown code blocks, just pure YAML.

2. **Structure**: The YAML file must contain a `schemas` object with the following components:

   ```yaml
   schemas:
     {DeviceType}Device:
       # Device list response schema (extends DeviceBase)

     {DeviceType}Status:
       # Status response schema

     {DeviceType}Command:
       # Command request schema

     {DeviceType}WebhookEvent:
       # Webhook event schema (if applicable)
   ```

3. **Device Schema Pattern**:
   - `{DeviceType}Device`: Use `allOf` to extend `../common.yaml#/schemas/DeviceBase`
   - `{DeviceType}Status`: Include all status fields from README with proper types and descriptions
   - `{DeviceType}Command`: Define all available commands with their parameters
   - `{DeviceType}WebhookEvent`: Define webhook payload structure (only if device supports webhooks)

4. **OpenAPI Best Practices**:
   - Use proper data types (string, integer, boolean, number)
   - Add `description` fields for all properties
   - Use `enum` for fields with fixed values
   - Add `example` values where helpful
   - Set `minimum`/`maximum` for numeric fields where applicable
   - Mark `required` fields appropriately

5. **Accuracy**:
   - Extract ALL fields mentioned in the README section
   - Preserve exact field names (case-sensitive)
   - Use correct enum values from documentation
   - Include all available commands and their parameters

## Examples

### Example Status Schema
```yaml
BotStatus:
  type: object
  required:
    - deviceId
    - deviceType
    - power
  properties:
    deviceId:
      type: string
      example: "210"
    deviceType:
      type: string
      enum:
        - Bot
    power:
      type: string
      enum:
        - "on"
        - "off"
    battery:
      type: integer
      minimum: 0
      maximum: 100
```

### Example Command Schema
```yaml
BotCommand:
  type: object
  required:
    - commandType
    - command
  properties:
    commandType:
      type: string
      enum:
        - command
    command:
      type: string
      enum:
        - turnOn
        - turnOff
    parameter:
      type: string
      enum:
        - default
```

## Important Notes

- If the device does not support commands, omit the `{DeviceType}Command` schema
- If the device does not support webhooks, omit the `{DeviceType}WebhookEvent` schema
- Maintain consistency with existing schema if provided
- Output ONLY the YAML content, nothing else
