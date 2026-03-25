import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getRegisteredSchema, listRegisteredSchemas } from '../copilot-studio/schema-registry';
import { readJsonInput, writeJsonOutput } from '../utils/io';

export const schemaCommand = new Command('schema')
  .description('Inspect and validate built-in Agent Studio Copilot Studio schemas')
  .addCommand(
    new Command('list')
      .description('List built-in schema definitions')
      .action(() => {
        console.log(chalk.bold('\nBuilt-in Schemas:\n'));
        listRegisteredSchemas().forEach((schema) => {
          console.log(`${chalk.cyan(schema.name)} - ${schema.description}`);
        });
        console.log();
      }),
  )
  .addCommand(
    new Command('show')
      .description('Show a built-in schema definition')
      .argument('<name>', 'Built-in schema name')
      .option('-o, --output <path>', 'Write output to file instead of stdout')
      .action((name, options) => {
        const schema = getRegisteredSchema(name);
        if (!schema) {
          console.error(chalk.red(`Unknown schema: ${name}`));
          console.log(chalk.yellow('Run "agent-studio schema list" to see available schema names.'));
          process.exit(1);
        }

        writeJsonOutput(schema.jsonSchema, options.output);
      }),
  )
  .addCommand(
    new Command('validate')
      .description('Validate a JSON file against a built-in schema')
      .argument('<name>', 'Built-in schema name')
      .argument('<input>', 'Path to a JSON file')
      .option('-o, --output <path>', 'Write validation result to file')
      .action(async (name, input, options) => {
        const schema = getRegisteredSchema(name);
        if (!schema) {
          console.error(chalk.red(`Unknown schema: ${name}`));
          console.log(chalk.yellow('Run "agent-studio schema list" to see available schema names.'));
          process.exit(1);
        }

        try {
          const spinner = ora(`Validating ${input} against ${name}...`).start();
          const data = await readJsonInput(input);
          const result = schema.validate(data);
          spinner.stop();

          writeJsonOutput(result, options.output);
          if (!result.valid) {
            process.exit(1);
          }
        } catch (error: any) {
          console.error(chalk.red('Schema validation failed:'), error.message);
          process.exit(1);
        }
      }),
  );
