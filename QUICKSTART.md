# Quick Start Guide - Agent Studio Kit Packages

Get up and running with Agent Studio Kit packages in minutes!

## 🎯 Choose Your Package

### For Command-Line Users → **CLI Package**
Best for automation, scripts, and CI/CD pipelines.

### For VS Code Users → **VSCode Extension**
Best for visual interface and IDE integration.

### For .NET Developers → **NuGet Package**
Best for enterprise deployment and package deployer customization.

---

## 🚀 5-Minute Quick Start

### Option 1: CLI Package (Fastest)

No installation required with NPX!

```bash
# 1. Authenticate to Power Platform
npx @agent-studio/cli auth login

# Follow prompts:
# - Enter environment URL: https://yourorg.crm.dynamics.com
# - Enter profile name: default

# 2. List solutions in your environment
npx @agent-studio/cli solution list

# 3. Clone a solution
npx @agent-studio/cli solution clone YourSolutionName -o ./MySolution

# 4. Export a solution
npx @agent-studio/cli solution export YourSolutionName -o ./solution.zip
```

**That's it!** You're ready to manage Power Platform solutions from the command line.

---

### Option 2: VSCode Extension

1. **Install Extension**
   - Open VS Code
   - Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
   - Search for "Agent Studio Kit"
   - Click Install

2. **Connect to Environment**
   - Click the Agent Studio icon in Activity Bar (left sidebar)
   - Click the plug icon or press `Ctrl+Shift+P` and type "Agent Studio: Connect"
   - Enter your environment URL: `https://yourorg.crm.dynamics.com`

3. **Browse and Manage Solutions**
   - View all solutions in the Solutions panel
   - Right-click any solution to:
     - Clone to workspace
     - Export as ZIP
     - View details

**That's it!** You're ready to manage solutions visually in VS Code.

---

### Option 3: NuGet Package

1. **Install Package**
   ```bash
   dotnet add package AgentStudioKit.PackageDeployer
   ```

2. **Use in Your .NET Application**
   ```csharp
   using PowerCAT.PackageDeployer.Package;
   
   // Initialize and use package deployer
   var deployer = new PackageImportExtension();
   ```

3. **Deploy Solutions**
   ```bash
   # Build and package
   dotnet pack --configuration Release
   
   # Deploy (when ready)
   dotnet nuget push ./nupkg/*.nupkg
   ```

**That's it!** You can now automate solution deployment in .NET.

---

## 📋 Prerequisites Checklist

Before using any package, make sure you have:

- [ ] **PAC CLI installed** - [Download here](https://learn.microsoft.com/power-platform/developer/cli/introduction)
- [ ] **Power Platform environment** with admin access
- [ ] **Node.js 16+** (for CLI and VSCode)
- [ ] **.NET 8+** (for NuGet package)

### Quick PAC CLI Check

```bash
# Check if PAC CLI is installed
pac --version

# If not installed, download from:
# https://learn.microsoft.com/power-platform/developer/cli/introduction
```

---

## 🎓 Common Tasks

### Task 1: Export a Solution

**CLI:**
```bash
npx @agent-studio/cli solution export MySolution -o ./MySolution.zip
```

**VSCode:**
1. Open Agent Studio view
2. Right-click solution
3. Select "Export Solution"

### Task 2: Clone a Solution

**CLI:**
```bash
npx @agent-studio/cli solution clone MySolution -o ./workspace
```

**VSCode:**
1. Right-click solution
2. Select "Clone Solution"
3. Choose output directory

### Task 3: Import a Solution

**CLI:**
```bash
npx @agent-studio/cli solution import ./MySolution.zip
```

**VSCode:**
1. Use Command Palette
2. Type "Agent Studio: Import Solution"
3. Select ZIP file

### Task 4: List Environments

**CLI:**
```bash
npx @agent-studio/cli env list
```

**VSCode:**
- View in Environments panel

---

## 🔧 Configuration

### CLI Configuration

Configuration is stored automatically at:
- **Windows**: `%APPDATA%\agent-studio-cli\config.json`
- **macOS/Linux**: `~/.config/agent-studio-cli/config.json`

### VSCode Configuration

Settings available in VS Code preferences:

```json
{
  "agentStudio.defaultEnvironment": "https://yourorg.crm.dynamics.com",
  "agentStudio.pacCliPath": "pac",
  "agentStudio.autoRefresh": true,
  "agentStudio.showNotifications": true
}
```

---

## 💡 Tips & Tricks

### CLI Tips

**Use Aliases for Speed:**
```bash
# Instead of:
npx @agent-studio/cli solution list

# Use:
npx @agent-studio/cli sol list
# or even shorter:
npx ast sol list
```

**Install Globally for Faster Access:**
```bash
npm install -g @agent-studio/cli
agent-studio sol list  # Much faster!
```

### VSCode Tips

**Keyboard Shortcuts:**
- `Ctrl+Shift+P` → "Agent Studio: Connect" (Quick connect)
- `Ctrl+Shift+P` → "Agent Studio: Show Output" (View logs)

**Quick Refresh:**
- Click refresh icon in panel headers
- Auto-refresh on connect (if enabled)

---

## 🐛 Troubleshooting

### PAC CLI Not Found

**Solution:**
```bash
# Verify PAC CLI installation
pac --version

# If not found, install from:
# https://learn.microsoft.com/power-platform/developer/cli/introduction

# Add to PATH if needed
```

### Authentication Failed

**Solution:**
```bash
# Try authenticating directly with PAC CLI first
pac auth create --url https://yourorg.crm.dynamics.com

# Then use Agent Studio CLI
npx @agent-studio/cli auth list
```

### No Solutions Visible

**Solution:**
1. Verify you're connected (check Environments panel)
2. Ensure you have permissions
3. Click refresh button
4. Check output panel for errors

---

## 📚 Next Steps

Now that you're set up, explore:

1. **[Complete CLI Documentation](./agent-studio-cli/README.md)** - All CLI commands and options
2. **[VSCode Extension Guide](./agent-studio-vscode/README.md)** - Full extension features
3. **[NuGet Package Docs](./PowerCAT.PackageDeployer.Package/README.md)** - .NET integration
4. **[Package Comparison](./PACKAGES.md)** - Choose the right package for your needs

---

## 🤝 Get Help

- **Issues**: [GitHub Issues](https://github.com/dayour/Agent-Studio-Kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dayour/Agent-Studio-Kit/discussions)
- **Documentation**: [Main README](./README.md)

---

## ⚡ Quick Reference

| Task | CLI Command | VSCode Action |
|------|-------------|---------------|
| Connect | `ast auth login` | Click plug icon |
| List Solutions | `ast sol list` | View Solutions panel |
| Clone Solution | `ast sol clone NAME` | Right-click → Clone |
| Export Solution | `ast sol export NAME` | Right-click → Export |
| Import Solution | `ast sol import PATH` | Cmd Palette → Import |

---

**Ready to go?** Pick your package and start managing Power Platform solutions like a pro! 🚀
