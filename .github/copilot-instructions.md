# GitHub Copilot Instructions for Agent Studio Kit

## Repository Overview

This is the **Agent Studio Kit** repository - a comprehensive toolkit for Microsoft Copilot Studio that enables makers to develop, govern, and test custom agents. The kit provides advanced capabilities including AI-powered testing, compliance management, performance analytics, and agent governance.

## Technology Stack

- **Microsoft Copilot Studio**: Primary platform for building conversational AI agents
- **Microsoft Power Platform**: Power Apps, Power Automate, and Dataverse
- **PAC CLI** (Power Platform CLI): Command-line interface for Power Platform management and automation
- **Dataverse MCP** (Model Context Protocol): Advanced data operations and agent management layer
- **AI Builder**: Low-code AI capabilities for business applications
- **Azure OpenAI**: Advanced AI features for prompt engineering and generative testing
- **.NET**: Package deployment tooling
- **SharePoint**: Content synchronization integration

## Repository Structure

### Main Components

- **CopilotStudioAccelerator/**: Core solution package containing Power Platform components (flows, apps, tables)
- **AgentReviewTool/**: Solution analysis tool for reviewing agents for issues and anti-patterns
- **RubricRefinement/**: Documentation for evaluation standards refinement features
- **PowerCAT.PackageDeployer.Package/**: .NET project for managing solution deployments
- **CopilotstudioAcceleratorResources/**: Release collateral and resources
- **docs/**: GitHub Pages documentation website

### Documentation Files

The repository contains extensive markdown documentation at the root level:
- `INSTALLATION_INSTRUCTIONS.md`: Setup and installation guide
- `TESTING_CAPABILITIES.md`: Testing features documentation
- `COMPLIANCE_HUB.md`: Governance and compliance features
- `CONFIGURE_COPILOTS.md`, `CONFIGURE_TESTS.md`: Configuration guides
- `TROUBLESHOOT.md`: Troubleshooting and support

## Key Features

1. **Advanced Testing**: Batch testing with response match, topic match, multi-turn, and AI-powered generative answer analysis
2. **Compliance Hub**: Governance policies with automated evaluation and SLA-driven lifecycle
3. **Conversation KPIs**: Performance tracking with aggregated Dataverse data
4. **Prompt Advisor**: AI-powered prompt analysis and refinement suggestions
5. **Rubrics Refinement**: Iterative evaluation standards creation and testing
6. **Agent Inventory**: Tenant-wide visibility of all Copilot Studio agents
7. **SharePoint Synchronization**: Periodic content sync to agent knowledge bases
8. **Webchat Playground**: Customization tool for webchat appearance
9. **Adaptive Cards Gallery**: Built-in templates with dynamic data binding

## Development Guidelines

### When Working with Power Platform Solutions

1. **Use PAC CLI** for Power Platform operations:
   ```bash
   pac solution list
   pac solution export
   pac solution import
   pac connector create
   ```

2. **Dataverse MCP Integration**: When working with Dataverse tables and data operations, leverage the Model Context Protocol for consistent data management patterns

3. **Power Platform Pipelines**: The kit supports CI/CD through Power Platform Pipelines - maintain compatibility with automated testing workflows

### Code Style and Conventions

- Follow Microsoft Power Platform best practices
- Use descriptive names for flows, apps, and tables
- Document all custom connectors and actions
- Maintain backwards compatibility with existing installations

### Testing

- Run existing tests before making changes
- Add tests for new features using the kit's testing framework
- Validate against multiple agent configurations
- Test compliance rules with various scenarios

### Documentation

- Update relevant markdown files when adding features
- Keep README.md synchronized with major changes
- Document PAC CLI commands for new operations
- Include Dataverse MCP integration patterns

## Important Paths

- Solution files: `CopilotStudioAccelerator/`
- .NET deployment: `PowerCAT.PackageDeployer.Package/`
- Documentation: Root level `.md` files and `docs/` folder
- Media assets: `media/` folder
- Issue templates: `.github/ISSUE_TEMPLATE/`

## Power Platform CLI (PAC CLI) Usage

The PAC CLI is essential for:
- Solution management and deployment
- Connector and plugin registration
- Environment management
- Dataverse operations
- CI/CD pipeline integration

Example commands commonly used:
```bash
# Authentication
pac auth create --url https://yourorg.crm.dynamics.com

# Solution operations
pac solution export --path ./solution.zip --name AgentStudioKit
pac solution import --path ./solution.zip

# Connector management
pac connector list
pac connector create --settings-file connector.json

# Dataverse operations via MCP
pac data export --environment prod --table copilot_tests
```

## Dataverse MCP (Model Context Protocol)

Dataverse MCP provides a standardized way to:
- Query and manipulate Dataverse tables
- Manage agent configurations and metadata
- Execute batch operations on test data
- Synchronize data between environments
- Access compliance and KPI data

Key tables to be aware of:
- Agent configurations
- Test runs and results
- Compliance cases
- Conversation KPIs
- Rubric definitions

## Contributing

1. Follow existing patterns and conventions
2. Test thoroughly with PAC CLI and Dataverse operations
3. Update documentation for user-facing changes
4. Ensure compatibility with Microsoft Copilot Studio
5. Validate Power Platform Pipeline integration

## Security Considerations

- Never commit credentials or API keys
- Use connection references and environment variables
- Follow Microsoft security best practices
- Validate all user inputs in flows and apps
- Implement proper error handling

## Related Resources

- [Microsoft Copilot Studio Documentation](https://aka.ms/CopilotStudio)
- [Power Platform CLI Documentation](https://learn.microsoft.com/power-platform/developer/cli/introduction)
- [Dataverse Documentation](https://learn.microsoft.com/power-apps/developer/data-platform/)
- [Power Automate Best Practices](https://learn.microsoft.com/power-automate/guidance/planning/best-practices)
