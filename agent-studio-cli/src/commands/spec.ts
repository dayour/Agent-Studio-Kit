import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { generateAgentFromDescription, updateAgentInstructionsFromBrief } from '../spec/agent-creation';
import { classifyIntentWithLLM, classifyIntentLocally } from '../spec/intent-classification';
import { generateWorkflowNodes } from '../spec/workflow-generation';
import {
  setAnthropicApiKey,
  setCopilotSdkGithubToken,
  setCopilotSdkUseLoggedInUser,
  setDefaultModel,
  setLlmLibPath,
  setLlmLibTool,
  setLlmLibUrl,
  setLlmProvider,
  setLlmProxyUrl,
} from '../config';

function parseBooleanOption(optionName: string, value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  console.error(chalk.red(`Invalid value for ${optionName}: ${value}. Use true or false.`));
  process.exit(1);
}

function writeOutput(data: unknown, outputPath?: string): void {
  const json = JSON.stringify(data, null, 2);
  if (outputPath) {
    const resolved = path.resolve(outputPath);
    fs.outputFileSync(resolved, json);
    console.log(chalk.green(`Output written to: ${resolved}`));
  } else {
    console.log(json);
  }
}

export const specCommand = new Command('spec')
  .description('Generate agent specifications from natural language')
  .addCommand(
    new Command('generate')
      .description('Generate a full agent spec from a description')
      .argument('<description>', 'Natural language description of the agent')
      .option('-a, --audience <type>', 'Target audience: customers or employees')
      .option('-c, --channel <channels>', 'Deployment channels (comma-separated)')
      .option('-o, --output <path>', 'Write output to file instead of stdout')
      .action(async (description, options) => {
        try {
          const spinner = ora('Generating agent specification...').start();
          const channels = options.channel ? options.channel.split(',').map((c: string) => c.trim()) : null;

          const spec = await generateAgentFromDescription(
            description,
            options.audience || null,
            channels
          );

          spinner.succeed('Agent specification generated');
          writeOutput(spec, options.output);
        } catch (error: any) {
          console.error(chalk.red('Generation failed:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('classify')
      .description('Classify intent as agent or workflow')
      .argument('<description>', 'Description to classify')
      .option('--local', 'Use local heuristics instead of LLM')
      .option('-o, --output <path>', 'Write output to file')
      .action(async (description, options) => {
        try {
          let result;
          if (options.local) {
            result = classifyIntentLocally(description);
          } else {
            const spinner = ora('Classifying intent...').start();
            result = await classifyIntentWithLLM(description);
            spinner.succeed(`Classified as: ${result.type} (${result.confidence} confidence)`);
          }
          writeOutput(result, options.output);
        } catch (error: any) {
          console.error(chalk.red('Classification failed:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('workflow')
      .description('Generate workflow automation nodes')
      .argument('<description>', 'Description of the workflow')
      .option('-n, --name <name>', 'Workflow name', 'New Workflow')
      .option('-o, --output <path>', 'Write output to file')
      .action(async (description, options) => {
        try {
          const spinner = ora('Generating workflow nodes...').start();

          const nodes = await generateWorkflowNodes(description, options.name);

          spinner.succeed(`Generated ${nodes.length} workflow nodes`);
          writeOutput(nodes, options.output);
        } catch (error: any) {
          console.error(chalk.red('Workflow generation failed:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('init')
      .description('Interactive agent spec creation')
      .option('-o, --output <path>', 'Write output to file')
      .action(async (options) => {
        try {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'description',
              message: 'Describe your agent or workflow:',
              validate: (input: string) => input.length > 5 || 'Please provide a meaningful description'
            },
            {
              type: 'list',
              name: 'audience',
              message: 'Who will interact with this agent?',
              choices: [
                { name: 'Customers (external users)', value: 'customers' },
                { name: 'Employees (internal users)', value: 'employees' },
                { name: 'Not sure yet', value: null }
              ]
            },
            {
              type: 'checkbox',
              name: 'channels',
              message: 'Select deployment channels:',
              choices: [
                { name: 'Microsoft Teams / M365', value: 'teams' },
                { name: 'Website', value: 'website' },
                { name: 'Email / Outlook', value: 'outlook' },
                { name: 'Slack', value: 'slack' },
                { name: 'SharePoint', value: 'sharepoint' },
                { name: 'ServiceNow', value: 'servicenow' },
              ]
            }
          ]);

          const classifySpinner = ora('Analyzing intent...').start();
          const classification = await classifyIntentWithLLM(answers.description);
          classifySpinner.succeed(`Intent: ${classification.type} (${classification.confidence} confidence)`);

          if (classification.type === 'workflow') {
            const wfSpinner = ora('Generating workflow...').start();
            const name = classification.suggestedName || 'New Workflow';
            const nodes = await generateWorkflowNodes(answers.description, name);
            wfSpinner.succeed(`Generated ${nodes.length}-node workflow: ${name}`);

            const result = {
              type: 'workflow' as const,
              name,
              description: classification.suggestedDescription || answers.description,
              nodes,
              classification
            };
            writeOutput(result, options.output);
          } else {
            const genSpinner = ora('Generating agent specification...').start();
            const channels = answers.channels.length > 0 ? answers.channels : null;
            const spec = await generateAgentFromDescription(answers.description, answers.audience, channels);
            genSpinner.succeed(`Agent generated: ${spec.name}`);

            const result = { type: 'agent' as const, ...spec, classification };
            writeOutput(result, options.output);
          }
        } catch (error: any) {
          console.error(chalk.red('Interactive creation failed:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('config')
      .description('Configure LLM provider settings')
      .option('--provider <provider>', 'Set LLM provider: anthropic, proxy, llm-lib, or copilot-sdk')
      .option('--api-key <key>', 'Set Anthropic API key')
      .option('--proxy-url <url>', 'Set LLM proxy URL')
      .option('--llm-lib-path <path>', 'Set local llm-lib installation path')
      .option('--llm-lib-url <url>', 'Set llm-lib UI server URL')
      .option('--llm-lib-tool <tool>', 'Set llm-lib chat tool (default: chat_model_router)')
      .option('--github-token <token>', 'Set GitHub token for Copilot SDK authentication')
      .option('--use-logged-in-user <true|false>', 'Use the logged-in GitHub Copilot CLI account for Copilot SDK authentication')
      .option('--model <model>', 'Set default model')
      .action((options) => {
        let providerUpdated = false;

        if (options.provider) {
          const provider = String(options.provider).trim().toLowerCase();
          if (!['anthropic', 'proxy', 'llm-lib', 'copilot-sdk'].includes(provider)) {
            console.error(chalk.red(`Unsupported LLM provider: ${options.provider}`));
            process.exit(1);
          }
          setLlmProvider(provider as 'anthropic' | 'proxy' | 'llm-lib' | 'copilot-sdk');
          providerUpdated = true;
          console.log(chalk.green(`LLM provider set to: ${provider}`));
        }

        if (options.apiKey) {
          setAnthropicApiKey(options.apiKey);
          console.log(chalk.green('Anthropic API key saved'));
          if (!providerUpdated) {
            setLlmProvider('anthropic');
            providerUpdated = true;
            console.log(chalk.green('LLM provider set to: anthropic'));
          }
        }
        if (options.proxyUrl) {
          setLlmProxyUrl(options.proxyUrl);
          console.log(chalk.green(`LLM proxy URL set to: ${options.proxyUrl}`));
          if (!providerUpdated) {
            setLlmProvider('proxy');
            providerUpdated = true;
            console.log(chalk.green('LLM provider set to: proxy'));
          }
        }
        if (options.llmLibPath) {
          const resolvedPath = path.resolve(options.llmLibPath);
          setLlmLibPath(resolvedPath);
          console.log(chalk.green(`llm-lib path set to: ${resolvedPath}`));
          if (!providerUpdated) {
            setLlmProvider('llm-lib');
            providerUpdated = true;
            console.log(chalk.green('LLM provider set to: llm-lib'));
          }
        }
        if (options.llmLibUrl) {
          setLlmLibUrl(options.llmLibUrl);
          console.log(chalk.green(`llm-lib URL set to: ${options.llmLibUrl}`));
          if (!providerUpdated) {
            setLlmProvider('llm-lib');
            providerUpdated = true;
            console.log(chalk.green('LLM provider set to: llm-lib'));
          }
        }
        if (options.llmLibTool) {
          setLlmLibTool(options.llmLibTool);
          console.log(chalk.green(`llm-lib tool set to: ${options.llmLibTool}`));
          if (!providerUpdated) {
            setLlmProvider('llm-lib');
            providerUpdated = true;
            console.log(chalk.green('LLM provider set to: llm-lib'));
          }
        }
        if (options.githubToken) {
          setCopilotSdkGithubToken(options.githubToken);
          console.log(chalk.green('Copilot SDK GitHub token saved'));
          if (!providerUpdated) {
            setLlmProvider('copilot-sdk');
            providerUpdated = true;
            console.log(chalk.green('LLM provider set to: copilot-sdk'));
          }
        }
        if (options.useLoggedInUser !== undefined) {
          const useLoggedInUser = parseBooleanOption('--use-logged-in-user', String(options.useLoggedInUser));
          setCopilotSdkUseLoggedInUser(useLoggedInUser);
          console.log(chalk.green(`Copilot SDK logged-in user mode set to: ${useLoggedInUser}`));
          if (!providerUpdated) {
            setLlmProvider('copilot-sdk');
            providerUpdated = true;
            console.log(chalk.green('LLM provider set to: copilot-sdk'));
          }
        }
        if (options.model) {
          setDefaultModel(options.model);
          console.log(chalk.green(`Default model set to: ${options.model}`));
        }
        if (
          !options.provider &&
          !options.apiKey &&
          !options.proxyUrl &&
          !options.llmLibPath &&
          !options.llmLibUrl &&
          !options.llmLibTool &&
          !options.githubToken &&
          options.useLoggedInUser === undefined &&
          !options.model
        ) {
          console.log(chalk.yellow('Usage:'));
          console.log('  agent-studio spec config --provider anthropic --api-key <ANTHROPIC_API_KEY>');
          console.log('  agent-studio spec config --provider proxy --proxy-url <LLM_PROXY_URL>');
          console.log('  agent-studio spec config --provider llm-lib --llm-lib-path <LLM_LIB_PATH>');
          console.log('  agent-studio spec config --provider copilot-sdk --use-logged-in-user true --model gpt-4.1');
          console.log('  agent-studio spec config --provider copilot-sdk --github-token <GITHUB_TOKEN> --model gpt-4.1');
          console.log('  agent-studio spec config --llm-lib-url <LLM_LIB_URL> --llm-lib-tool <TOOL_NAME>');
          console.log('  agent-studio spec config --model <MODEL_NAME>');
        }
      })
  );
