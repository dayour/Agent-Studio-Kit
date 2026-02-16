# Agent Studio CLI

Command-line interface for Agent Studio Kit - manage Power Platform environments and Copilot Studio solutions.

## Prerequisites

- Node.js 16 or higher
- [PAC CLI](https://learn.microsoft.com/power-platform/developer/cli/introduction) (Power Platform CLI) installed and configured

## Installation

### Global Installation (NPM)

```bash
npm install -g @agent-studio/cli
```

### Using NPX (No Installation Required)

```bash
npx @agent-studio/cli [command]
```

## Usage

The CLI provides several commands for working with Power Platform and Copilot Studio:

### Authentication

```bash
# Login to Power Platform environment
agent-studio auth login
agent-studio auth login -u https://yourorg.crm.dynamics.com -n my-profile

# List authentication profiles
agent-studio auth list

# Select an authentication profile
agent-studio auth select my-profile
```

### Environment Management

```bash
# List available environments
agent-studio env list
```

### Solution Management

```bash
# List solutions in current environment
agent-studio solution list

# Export a solution
agent-studio solution export MySolution
agent-studio solution export MySolution -o ./MySolution.zip --managed

# Import a solution
agent-studio solution import ./MySolution.zip

# Clone a solution to local directory
agent-studio solution clone MySolution -o ./MySolutionFolder
```

## Aliases

The CLI supports short aliases for convenience:

- `ast` - Short alias for `agent-studio`
- `env` / `environment` - Environment commands
- `sol` / `solution` - Solution commands

Example:

```bash
ast auth login
ast sol list
ast env list
```

## Configuration

The CLI stores configuration in your home directory. You can find it at:

- **Windows**: `%APPDATA%\agent-studio-cli\config.json`
- **macOS/Linux**: `~/.config/agent-studio-cli/config.json`

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

## Integration with VSCode Extension

This CLI package is used by the Agent Studio Kit VSCode extension to provide Power Platform integration capabilities.

## Support

For issues and feature requests, please visit: https://github.com/dayour/Agent-Studio-Kit/issues

## License

MIT
