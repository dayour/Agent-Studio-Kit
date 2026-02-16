# Agent Studio Kit Package Deployer

NuGet package for deploying Agent Studio Kit solutions to Power Platform environments.

## Overview

This package provides deployment tools and utilities for Agent Studio Kit, a comprehensive toolkit for Microsoft Copilot Studio. It enables automated deployment of solutions containing testing capabilities, compliance management, analytics, and governance features.

## Features

- Automated solution deployment to Power Platform
- Configuration import and setup
- Environment variable management
- Connection reference configuration
- Pre-configured deployment scripts

## Prerequisites

- .NET Framework 4.7.2 or higher
- Power Platform environment
- Appropriate security roles and permissions
- PAC CLI (Power Platform CLI) for advanced scenarios

## Installation

### Via NuGet Package Manager

```powershell
Install-Package AgentStudioKit.PackageDeployer
```

### Via .NET CLI

```bash
dotnet add package AgentStudioKit.PackageDeployer
```

### Via Package Manager Console

```powershell
PM> Install-Package AgentStudioKit.PackageDeployer
```

## Usage

### Basic Deployment

```csharp
// Import the package deployer
using PowerCAT.PackageDeployer.Package;

// Use the package deployer to deploy solutions
// See PackageImportExtension.cs for customization options
```

### PowerShell Deployment

```powershell
# Using Package Deployer tool
.\PackageDeployer.exe
```

## Configuration

The package includes:

- **PowerCAT.Package.Settings.json**: Configuration settings for deployment
- **PkgAssets**: Solution files and dependencies
- **Resources**: Additional deployment resources

## Integration with PAC CLI

This package works seamlessly with PAC CLI for advanced deployment scenarios:

```bash
# Authenticate to your environment
pac auth create --url https://yourorg.crm.dynamics.com

# Deploy using PAC CLI
pac package deploy --package-name AgentStudioKit.PackageDeployer
```

## Components Included

- Agent testing framework
- Compliance Hub
- Conversation KPIs
- Prompt Advisor
- SharePoint synchronization
- Agent Inventory
- Webchat Playground
- Adaptive Cards Gallery

## Support

For issues, feature requests, and documentation, visit:
- **GitHub**: https://github.com/dayour/Agent-Studio-Kit
- **Issues**: https://github.com/dayour/Agent-Studio-Kit/issues
- **Documentation**: https://github.com/dayour/Agent-Studio-Kit#readme

## License

MIT License - See LICENSE.txt for details

## Related Packages

- **@agent-studio/cli**: Command-line interface for Agent Studio Kit
- **agent-studio-vscode**: Visual Studio Code extension for Agent Studio Kit

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.
