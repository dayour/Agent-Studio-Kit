# Agent Studio Kit VSCode Extension

Visual Studio Code extension for Agent Studio Kit - Manage Microsoft Copilot Studio agents and Power Platform solutions directly from VS Code.

## Features

- **Environment Management**: Connect to Power Platform environments with ease
- **Solution Explorer**: Browse and manage solutions in your environments
- **Solution Cloning**: Clone solutions directly to your local workspace
- **Export/Import**: Export solutions as managed or unmanaged packages
- **PAC CLI Integration**: Seamless integration with Power Platform CLI
- **Tree View**: Organized view of environments and solutions

## Prerequisites

- Visual Studio Code 1.85.0 or higher
- [PAC CLI](https://learn.microsoft.com/power-platform/developer/cli/introduction) (Power Platform CLI) installed
- Power Platform environment with appropriate permissions

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Agent Studio Kit"
4. Click Install

### From VSIX Package

```bash
code --install-extension agent-studio-vscode-1.0.0.vsix
```

## Getting Started

1. **Open Agent Studio View**: Click the Agent Studio icon in the Activity Bar
2. **Connect to Environment**: Click the plug icon or use Command Palette > "Agent Studio: Connect to Environment"
3. **Enter Environment URL**: Provide your Power Platform environment URL (e.g., https://yourorg.crm.dynamics.com)
4. **Browse Solutions**: View all solutions in the Solutions panel
5. **Clone/Export Solutions**: Right-click on any solution to clone or export it

## Commands

Access these commands via Command Palette (Ctrl+Shift+P):

- **Agent Studio: Connect to Environment** - Authenticate to a Power Platform environment
- **Agent Studio: Disconnect from Environment** - Disconnect from current environment
- **Agent Studio: Refresh Environments** - Reload environments list
- **Agent Studio: Refresh Solutions** - Reload solutions list
- **Agent Studio: Clone Solution** - Clone a solution to local workspace
- **Agent Studio: Export Solution** - Export a solution as ZIP file
- **Agent Studio: Import Solution** - Import a solution from ZIP file
- **Agent Studio: Show Output** - Show Agent Studio output panel

## Views

### Environments Panel

Shows all authenticated Power Platform environments with active status indicator.

### Solutions Panel

Displays all solutions in the currently selected environment with:
- Solution unique name
- Friendly name
- Quick actions for clone and export

## Configuration

Configure the extension via VS Code settings:

```json
{
  "agentStudio.defaultEnvironment": "",
  "agentStudio.pacCliPath": "pac",
  "agentStudio.autoRefresh": true,
  "agentStudio.showNotifications": true
}
```

### Settings

- **agentStudio.defaultEnvironment**: Default Power Platform environment URL
- **agentStudio.pacCliPath**: Custom path to PAC CLI executable (default: "pac")
- **agentStudio.autoRefresh**: Automatically refresh views on connect (default: true)
- **agentStudio.showNotifications**: Show operation notifications (default: true)

## Usage Examples

### Clone a Solution

1. Connect to your environment
2. Navigate to Solutions panel
3. Right-click on desired solution
4. Select "Clone Solution"
5. Choose output directory

### Export a Solution

1. Ensure you're connected
2. Right-click solution in Solutions panel
3. Select "Export Solution"
4. Choose output path and filename
5. Wait for export to complete

## Integration with CLI

This extension uses the Agent Studio CLI (`@agent-studio/cli`) under the hood and can work alongside command-line workflows.

## Troubleshooting

### PAC CLI Not Found

If you get a "PAC CLI not installed" error:
1. Install PAC CLI from [Microsoft Learn](https://learn.microsoft.com/power-platform/developer/cli/introduction)
2. Ensure `pac` command is in your PATH
3. Restart VS Code

### Authentication Issues

If authentication fails:
1. Check your environment URL is correct
2. Verify you have permissions to access the environment
3. Try authenticating via PAC CLI first: `pac auth create`

### Solution List Empty

If no solutions appear:
1. Verify you're connected (check Environments panel)
2. Ensure you have permissions to view solutions
3. Click refresh button in Solutions panel

## Support

For issues and feature requests:
- **GitHub Issues**: https://github.com/dayour/Agent-Studio-Kit/issues
- **Documentation**: https://github.com/dayour/Agent-Studio-Kit#readme

## Related Packages

- **@agent-studio/cli**: Command-line interface
- **AgentStudioKit.PackageDeployer**: NuGet package deployer

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE.txt](../../LICENSE.txt)

## Changelog

### 1.0.0

- Initial release
- Environment management
- Solution browsing
- Clone, export, and import capabilities
- PAC CLI integration
- Tree view interface
