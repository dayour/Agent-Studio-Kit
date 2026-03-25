# Agent Studio CLI

Command-line interface for Agent Studio Kit - manage Power Platform environments and Copilot Studio solutions.

## Prerequisites

- Node.js 20 or higher
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

### Schema Inspection

```bash
# List built-in schema definitions
agent-studio schema list

# Show a built-in schema definition
agent-studio schema show groundtruth-audit-config

# Validate a JSON file against a built-in schema
agent-studio schema validate groundtruth-audit-config ./groundtruth-audit.json
agent-studio schema validate copilot-studio-agent-definition ./normalized-agent.json
```

Built-in schemas currently cover:

- `groundtruth-audit-config`
- `copilot-studio-agent-definition`
- `copilot-studio-environment-summary`

The Copilot Studio schemas explicitly model evaluation concepts surfaced in the native UI, including:

- `csv-upload`
- `quick-question-set`
- `full-question-set`
- `test-chat-conversation`
- `manual-questions`

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

### Audit and Dataverse Mapping

```bash
# Write a sample audit config
agent-studio audit init-config -o ./groundtruth-audit.sample.json

# Validate an audit config
agent-studio audit validate-config ./groundtruth-audit.sample.json

# Normalize Dataverse or Copilot Studio payloads into the CLI agent definition
agent-studio audit map-agent --bot-file ./bot-create-payload.json
agent-studio audit map-agent --bot-file ./bot-create-payload.json --settings-file ./botcomponents-response.json --config ./groundtruth-audit.sample.json

# Run a local audit over mapped payloads
agent-studio audit run --bot-file ./bot-create-payload.json --settings-file ./botcomponents-response.json --config ./groundtruth-audit.sample.json
```

The audit flow is designed to bridge adjacent Copilot Studio artifacts into a normalized CLI definition. Supported inputs include:

- Dataverse bot records
- Bot create payload captures
- Botcomponents response captures
- Ground-truth audit config files used to enrich environment, direct-line, and studio metadata

## Aliases

The CLI supports short aliases for convenience:

- `agent-studio-cli` - Explicit package-style command alias
- `ast` - Short alias for `agent-studio`
- `env` / `environment` - Environment commands
- `sol` / `solution` - Solution commands

Example:

```bash
agent-studio-cli auth list
ast auth login
ast sol list
ast env list
```

## Configuration

The CLI stores configuration in your home directory. You can find it at:

- **Windows**: `%APPDATA%\agent-studio-cli\config.json`
- **macOS/Linux**: `~/.config/agent-studio-cli/config.json`

### LLM provider configuration

The `agent-studio spec` commands can use one of four LLM backends:

- GitHub Copilot SDK
- Direct Anthropic API access
- A generic chat-completions proxy URL
- A local `llm-lib` installation

Examples:

```bash
# GitHub Copilot SDK
agent-studio spec config --provider copilot-sdk --use-logged-in-user true --model gpt-4.1

# GitHub Copilot SDK with an explicit token
agent-studio spec config --provider copilot-sdk --github-token <GITHUB_TOKEN> --model gpt-4.1

# Anthropic
agent-studio spec config --provider anthropic --api-key <ANTHROPIC_API_KEY>

# Generic proxy
agent-studio spec config --provider proxy --proxy-url <LLM_PROXY_URL>

# Local llm-lib installation
agent-studio spec config --provider llm-lib --llm-lib-path E:\ag2\dayour\llm-lib --llm-lib-tool chat_model_router
```

The `copilot-sdk` provider uses the GitHub Copilot SDK package and requires GitHub Copilot authentication. If you are using your local logged-in account, run:

```bash
copilot auth login
```

If you need non-interactive auth, configure `--github-token` or set `COPILOT_SDK_GITHUB_TOKEN`.

When `llm-lib` is configured with a local path, the CLI will try to start its UI server automatically at `http://127.0.0.1:4300` if it is not already running. You can override that URL with:

```bash
agent-studio spec config --llm-lib-url http://127.0.0.1:4300
```

Environment variable equivalents are also supported:

- `LLM_PROVIDER`
- `COPILOT_SDK_GITHUB_TOKEN`
- `COPILOT_SDK_USE_LOGGED_IN_USER`
- `ANTHROPIC_API_KEY`
- `LLM_PROXY_URL`
- `LLM_LIB_PATH`
- `LLM_LIB_URL`
- `LLM_LIB_TOOL`

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

## GitHub Actions evaluation

`agent-studio-cli` now includes a manual GitHub Actions workflow at `.github/workflows/cli-agent-evaluation.yml` that runs the [Azure AI Agent Evaluation action](https://github.com/marketplace/actions/azure-ai-agent-evaluation) against one or more deployed Microsoft Foundry agents.

This workflow is intentionally separate from the normal CLI build pipeline because it requires Azure federated credentials and evaluates remote agents rather than the local TypeScript package itself.

### Required repository variables

Configure these repository variables before running the workflow:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_AI_PROJECT_ENDPOINT`
- `AZURE_AI_EVAL_DEPLOYMENT_NAME`
- `AZURE_AI_EVAL_AGENT_IDS`

Optional:

- `AZURE_AI_EVAL_BASELINE_AGENT_ID`

### Sample dataset

A starter dataset is checked in at `agent-studio-cli/evaluations/foundry-dataset.sample.json`.

Update that file or provide a different `data_path` when you trigger the workflow. The evaluator names in the dataset must exist in your Foundry project's evaluator catalog.

### Run the workflow

1. Configure Azure federated credentials for the repository so `azure/login@v2` can authenticate with the repository variables above.
2. Update `agent-studio-cli/evaluations/foundry-dataset.sample.json` or point the workflow at a different dataset file.
3. Open GitHub Actions and run `CLI Agent Evaluation`.
4. Optionally override the project endpoint, deployment name, agent IDs, baseline agent ID, or dataset path with workflow inputs at dispatch time.

## Integration with VSCode Extension

This CLI package is used by the Agent Studio Kit VSCode extension to provide Power Platform integration capabilities.

## Support

For issues and feature requests, please visit: https://github.com/dayour/Agent-Studio-Kit/issues

## License

MIT
