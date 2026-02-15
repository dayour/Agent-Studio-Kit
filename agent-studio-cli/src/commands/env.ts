import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { pacCli } from '../pac-wrapper';

export const envCommand = new Command('env')
  .description('Manage Power Platform environments')
  .alias('environment')
  .addCommand(
    new Command('list')
      .description('List available environments')
      .action(async () => {
        try {
          const spinner = ora('Loading environments...').start();
          const environments = await pacCli.listEnvironments();
          spinner.stop();

          if (environments.length === 0) {
            console.log(chalk.yellow('No environments found'));
            console.log(chalk.cyan('Make sure you are authenticated with "agent-studio auth login"'));
            return;
          }

          console.log(chalk.bold('\nAvailable Environments:\n'));
          environments.forEach((env: any) => {
            console.log(`${chalk.cyan(env.DisplayName || env.name)} - ${env.Url || env.url}`);
          });
          console.log();
        } catch (error: any) {
          console.error(chalk.red('Error listing environments:'), error.message);
          console.log(chalk.yellow('\nMake sure you are authenticated with "agent-studio auth login"'));
          process.exit(1);
        }
      })
  );
