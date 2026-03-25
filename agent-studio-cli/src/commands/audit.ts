import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  groundTruthAuditSampleConfig,
} from '../copilot-studio/schemas';
import { mapDataverseAgentInputs } from '../copilot-studio/dataverse-mapper';
import { runLocalAgentAudit } from '../copilot-studio/audit';
import { validateGroundTruthAuditConfig } from '../copilot-studio/validators';
import { GroundTruthAuditConfig } from '../copilot-studio/types';
import { readJsonInput, writeJsonOutput } from '../utils/io';

async function maybeLoadAuditConfig(configPath?: string): Promise<{
  config?: GroundTruthAuditConfig;
  validation?: ReturnType<typeof validateGroundTruthAuditConfig>;
}> {
  if (!configPath) {
    return {};
  }

  const configData = await readJsonInput(configPath);
  const validation = validateGroundTruthAuditConfig(configData);
  if (!validation.valid) {
    return { validation };
  }

  return {
    config: validation.value,
    validation,
  };
}

export const auditCommand = new Command('audit')
  .description('Validate audit configs and run local Copilot Studio payload audits')
  .addCommand(
    new Command('init-config')
      .description('Write a sample ground-truth audit config')
      .option('-o, --output <path>', 'Output file path', './groundtruth-audit.sample.json')
      .action((options) => {
        writeJsonOutput(groundTruthAuditSampleConfig, options.output);
      }),
  )
  .addCommand(
    new Command('validate-config')
      .description('Validate a ground-truth audit config file')
      .argument('<input>', 'Path to the audit config JSON file')
      .option('-o, --output <path>', 'Write validation result to file')
      .action(async (input, options) => {
        try {
          const spinner = ora(`Validating audit config ${input}...`).start();
          const data = await readJsonInput(input);
          const result = validateGroundTruthAuditConfig(data);
          spinner.stop();

          writeJsonOutput(result, options.output);
          if (!result.valid) {
            process.exit(1);
          }
        } catch (error: any) {
          console.error(chalk.red('Audit config validation failed:'), error.message);
          process.exit(1);
        }
      }),
  )
  .addCommand(
    new Command('map-agent')
      .description('Normalize Dataverse or Copilot Studio payloads into the CLI agent definition')
      .requiredOption('--bot-file <path>', 'Path to a Dataverse bot payload, create payload, or botcomponents capture')
      .option('--settings-file <path>', 'Optional second JSON payload used to enrich state and settings')
      .option('--config <path>', 'Optional audit config file used to map environment and agent metadata')
      .option('-o, --output <path>', 'Write output to file instead of stdout')
      .action(async (options) => {
        try {
          const spinner = ora('Mapping Dataverse agent payloads...').start();
          const botInput = await readJsonInput(options.botFile);
          const settingsInput = options.settingsFile ? await readJsonInput(options.settingsFile) : undefined;
          const configResult = await maybeLoadAuditConfig(options.config);
          if (configResult.validation && !configResult.validation.valid) {
            spinner.fail('Audit config validation failed');
            writeJsonOutput(configResult.validation, options.output);
            process.exit(1);
          }

          const mapped = mapDataverseAgentInputs(botInput, settingsInput, configResult.config);
          spinner.succeed('Mapped agent payload successfully');
          writeJsonOutput(mapped, options.output);
        } catch (error: any) {
          console.error(chalk.red('Agent mapping failed:'), error.message);
          process.exit(1);
        }
      }),
  )
  .addCommand(
    new Command('run')
      .description('Run a local audit over mapped Dataverse or Copilot Studio payloads')
      .requiredOption('--bot-file <path>', 'Path to a Dataverse bot payload, create payload, or botcomponents capture')
      .option('--settings-file <path>', 'Optional second JSON payload used to enrich state and settings')
      .option('--config <path>', 'Optional audit config file used to validate and enrich agent mapping')
      .option('-o, --output <path>', 'Write output to file instead of stdout')
      .action(async (options) => {
        try {
          const spinner = ora('Running local Copilot Studio audit...').start();
          const botInput = await readJsonInput(options.botFile);
          const settingsInput = options.settingsFile ? await readJsonInput(options.settingsFile) : undefined;
          const configResult = await maybeLoadAuditConfig(options.config);
          const mapped = mapDataverseAgentInputs(botInput, settingsInput, configResult.config);
          const report = runLocalAgentAudit(mapped, configResult.validation);
          spinner.stop();

          writeJsonOutput(report, options.output);
          if (report.summary.overallSeverity === 'fail') {
            process.exit(1);
          }
        } catch (error: any) {
          console.error(chalk.red('Audit execution failed:'), error.message);
          process.exit(1);
        }
      }),
  );
