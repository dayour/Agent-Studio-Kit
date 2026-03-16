# Action Catalog

Available connector actions that can be created via `/add-action`. Each entry maps to a verified sample YAML in `templates/actions/samples/`.

## Available Actions

| Action Name | Connector | Sample File | Description | API Name |
|-------------|-----------|-------------|-------------|----------|
| Post message in a chat or channel | Microsoft Teams | `teams-post-message.yml` | Posts a message to a Teams chat or channel | `shared_teams` |
| Create calendar event | Outlook | `outlook-create-event.yml` | Creates a new event in the user's Outlook calendar | `shared_office365` |

## Connector Reference

Each connector has a standard API name used in connection references and connector IDs.

| Connector | API Name | ConnectorId |
|-----------|----------|-------------|
| Microsoft Teams | `shared_teams` | `/providers/Microsoft.PowerApps/apis/shared_teams` |
| Outlook (Office 365) | `shared_office365` | `/providers/Microsoft.PowerApps/apis/shared_office365` |

## How to Add a New Action

Adding a new action to the catalog is a two-step process. No changes to SKILL.md are required.

### Step 1: Create the sample YAML file

1. Get a working action YAML from a Copilot Studio agent (clone an agent that has the action)
2. Save it as `templates/actions/samples/<connector>-<operation>.yml`
3. Replace the `connectionReference` value with `_CONNECTION_REFERENCE_`
4. Ensure the first line is `# Name: <Action Name>` (matching the real file format)

### Step 2: Add a row to this catalog

1. Add a row to the **Available Actions** table above
2. If the connector is new (not already in the Connector Reference table), add a row there too
