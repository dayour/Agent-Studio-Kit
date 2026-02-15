# Agent Studio Kit Packages

Agent Studio Kit is available in multiple package formats to support different development workflows and environments. Choose the package that best fits your needs.

## 📦 Available Packages

### 1. NPM/NPX CLI Package (`@agent-studio/cli`)

Command-line interface for managing Power Platform environments and Copilot Studio solutions.

#### Installation

**Using NPX (Recommended - No Installation Required)**
```bash
npx @agent-studio/cli auth login
npx @agent-studio/cli solution list
npx @agent-studio/cli solution clone MySolution
```

**Global Installation via NPM**
```bash
npm install -g @agent-studio/cli

# Use with short command
agent-studio auth login
agent-studio solution export MySolution
ast sol list  # Short alias
```

#### Key Features
- ✅ Environment authentication and management
- ✅ Solution export/import/clone operations
- ✅ PAC CLI wrapper with friendly interface
- ✅ Configuration management
- ✅ Recent solutions tracking

#### Use Cases
- Automated CI/CD pipelines
- Batch solution operations
- Environment management scripts
- Developer workflows

📖 **[Full CLI Documentation](./agent-studio-cli/README.md)**

---

### 2. VSCode Extension (`agent-studio-vscode`)

Visual Studio Code extension for seamless Power Platform integration directly in your editor.

#### Installation

**From VS Code Marketplace** (Coming Soon)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Agent Studio Kit"
4. Click Install

**From VSIX File**
```bash
code --install-extension agent-studio-vscode-1.0.0.vsix
```

#### Key Features
- ✅ Environment connection UI
- ✅ Solution tree view
- ✅ One-click solution cloning
- ✅ Export/Import solutions
- ✅ Integrated output panel
- ✅ Command palette integration
- ✅ Status bar indicators

#### Use Cases
- Development in VS Code
- Quick solution browsing
- Workspace solution management
- Integrated Power Platform workflows

📖 **[Full Extension Documentation](./agent-studio-vscode/README.md)**

---

### 3. NuGet Package (`AgentStudioKit.PackageDeployer`)

.NET package deployer for automated solution deployment to Power Platform environments.

#### Installation

**Via NuGet Package Manager**
```powershell
Install-Package AgentStudioKit.PackageDeployer
```

**Via .NET CLI**
```bash
dotnet add package AgentStudioKit.PackageDeployer
```

**Via PackageReference**
```xml
<PackageReference Include="AgentStudioKit.PackageDeployer" Version="1.0.0" />
```

#### Key Features
- ✅ Automated solution deployment
- ✅ Configuration import
- ✅ Environment variable management
- ✅ Connection reference setup
- ✅ Pre-configured scripts

#### Use Cases
- Enterprise deployment automation
- .NET-based deployment pipelines
- Package deployer customization
- Managed solution distribution

📖 **[Full NuGet Documentation](./PowerCAT.PackageDeployer.Package/README.md)**

---

## 🔄 Package Comparison

| Feature | CLI | VSCode Extension | NuGet |
|---------|-----|------------------|-------|
| Environment Auth | ✅ | ✅ | ✅ |
| Solution Export | ✅ | ✅ | ✅ |
| Solution Import | ✅ | ✅ | ✅ |
| Solution Clone | ✅ | ✅ | ❌ |
| Visual UI | ❌ | ✅ | ❌ |
| CI/CD Ready | ✅ | ❌ | ✅ |
| Script Automation | ✅ | ⚠️ | ✅ |
| IDE Integration | ❌ | ✅ | ⚠️ |
| Cross-Platform | ✅ | ✅ | ⚠️ |
| Package Deployment | ❌ | ❌ | ✅ |

Legend: ✅ Full Support | ⚠️ Partial Support | ❌ Not Supported

---

## 🚀 Getting Started

### For Developers
Start with the **CLI package** for command-line workflows or the **VSCode extension** for IDE integration.

```bash
# Quick start with CLI
npx @agent-studio/cli auth login
npx @agent-studio/cli solution list

# Or install VSCode extension for visual interface
```

### For DevOps/CI-CD
Use the **CLI package** in your automation scripts or the **NuGet package** for .NET-based deployments.

```yaml
# Example: GitHub Actions with CLI
- name: Export Solution
  run: npx @agent-studio/cli solution export ${{ env.SOLUTION_NAME }}
```

### For Deployment
Use the **NuGet package** for enterprise-grade solution deployment with custom package deployer logic.

```bash
# Build and deploy via NuGet
dotnet pack
dotnet nuget push
```

---

## 📋 Prerequisites

All packages require:
- **PAC CLI** (Power Platform CLI) installed and configured
- **Power Platform environment** with appropriate permissions
- **Node.js 16+** (for CLI and VSCode extension)
- **.NET Framework 4.7.2+** or **.NET 8+** (for NuGet package)

### Installing PAC CLI

**Windows (PowerShell)**
```powershell
Install-Module -Name Microsoft.PowerApps.CLI.Installer -Force -Scope CurrentUser
Install-PowerAppsCLI
```

**macOS/Linux**
```bash
# Download from Microsoft Learn
# https://learn.microsoft.com/power-platform/developer/cli/introduction
```

---

## 🔧 Integration Examples

### CLI in CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Solution
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Export Solution
        run: |
          npx @agent-studio/cli auth login -u ${{ secrets.ENV_URL }}
          npx @agent-studio/cli solution export MySolution -o ./solution.zip
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: solution
          path: solution.zip
```

### VSCode Extension Workflow

1. Open VS Code
2. Click Agent Studio icon in Activity Bar
3. Connect to environment via command palette
4. Browse solutions in tree view
5. Right-click solution → Clone/Export

### NuGet Package in .NET App

```csharp
using PowerCAT.PackageDeployer.Package;

// Use package deployer APIs
var deployer = new PackageImportExtension();
deployer.ImportPackage();
```

---

## 🤝 Package Interoperability

All packages work together seamlessly:

1. **Develop in VSCode** → Clone solutions to workspace
2. **Build with CLI** → Export/import in automation
3. **Deploy with NuGet** → Package deployer for production

Example workflow:
```bash
# 1. Clone solution in VSCode (UI)
# 2. Make changes locally
# 3. Export via CLI
npx @agent-studio/cli solution export MyCustomSolution

# 4. Deploy via NuGet in production pipeline
dotnet pack
dotnet nuget push
```

---

## 📚 Additional Resources

- **Main Repository**: [github.com/dayour/Agent-Studio-Kit](https://github.com/dayour/Agent-Studio-Kit)
- **Documentation**: [Agent Studio Kit Docs](https://github.com/dayour/Agent-Studio-Kit#readme)
- **Issues**: [Report Issues](https://github.com/dayour/Agent-Studio-Kit/issues)
- **PAC CLI Docs**: [Microsoft Learn](https://learn.microsoft.com/power-platform/developer/cli/introduction)
- **Copilot Studio**: [Microsoft Copilot Studio](https://aka.ms/CopilotStudio)

---

## 🆘 Support

For support and questions:
- 📝 **GitHub Issues**: [Create an issue](https://github.com/dayour/Agent-Studio-Kit/issues)
- 📖 **Documentation**: See individual package READMEs
- 🔍 **Search**: Check existing issues and discussions

---

## 📄 License

All Agent Studio Kit packages are released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.

---

## 🙏 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

To contribute to specific packages:
- **CLI**: Submit PRs to `agent-studio-cli/`
- **VSCode**: Submit PRs to `agent-studio-vscode/`
- **NuGet**: Submit PRs to `PowerCAT.PackageDeployer.Package/`
