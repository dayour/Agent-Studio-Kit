import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { pacCli } from '../pac-wrapper';
import { setLastUsedProfile } from '../config';

export const authCommand = new Command('auth')
  .description('Manage Power Platform authentication')
  .addCommand(
    new Command('login')
      .description('Authenticate to a Power Platform environment')
      .option('-u, --url <url>', 'Environment URL')
      .option('-n, --name <name>', 'Profile name')
      .action(async (options) => {
        try {
          // Check if PAC CLI is installed
          const spinner = ora('Checking PAC CLI installation...').start();
          const isInstalled = await pacCli.isInstalled();
          
          if (!isInstalled) {
            spinner.fail('PAC CLI is not installed');
            console.log(chalk.yellow('\nPlease install PAC CLI first:'));
            console.log(chalk.cyan('https://learn.microsoft.com/power-platform/developer/cli/introduction'));
            process.exit(1);
          }
          
          const version = await pacCli.getVersion();
          spinner.succeed(`PAC CLI version: ${version}`);

          let url = options.url;
          let name = options.name;

          // If URL not provided, prompt for it
          if (!url) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'url',
                message: 'Enter your Power Platform environment URL:',
                validate: (input) => {
                  if (!input.startsWith('https://')) {
                    return 'URL must start with https://';
                  }
                  return true;
                }
              }
            ]);
            url = answers.url;
          }

          // If name not provided, prompt for it
          if (!name) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'name',
                message: 'Enter a name for this profile (optional):',
                default: 'default'
              }
            ]);
            name = answers.name;
          }

          const authSpinner = ora('Authenticating...').start();
          await pacCli.auth(url, name);
          authSpinner.succeed(`Successfully authenticated to ${url}`);
          
          setLastUsedProfile(name);
        } catch (error: any) {
          console.error(chalk.red('Authentication failed:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List authentication profiles')
      .action(async () => {
        try {
          const spinner = ora('Loading authentication profiles...').start();
          const profiles = await pacCli.listAuth();
          spinner.stop();

          if (profiles.length === 0) {
            console.log(chalk.yellow('No authentication profiles found'));
            console.log(chalk.cyan('Run "agent-studio auth login" to authenticate'));
            return;
          }

          console.log(chalk.bold('\nAuthentication Profiles:\n'));
          profiles.forEach((profile) => {
            const active = profile.isActive ? chalk.green('✓ (active)') : '';
            console.log(`${chalk.cyan(profile.name)} - ${profile.url} ${active}`);
          });
          console.log();
        } catch (error: any) {
          console.error(chalk.red('Error listing profiles:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('select')
      .description('Select an authentication profile')
      .argument('<name>', 'Profile name or index')
      .action(async (name) => {
        try {
          const spinner = ora('Selecting authentication profile...').start();
          await pacCli.selectAuth(name);
          spinner.succeed(`Selected profile: ${name}`);
          setLastUsedProfile(name);
        } catch (error: any) {
          console.error(chalk.red('Error selecting profile:'), error.message);
          process.exit(1);
        }
      })
  );
