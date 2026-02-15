import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { pacCli } from '../pac-wrapper';
import { addRecentSolution } from '../config';

export const solutionCommand = new Command('solution')
  .description('Manage Power Platform solutions')
  .alias('sol')
  .addCommand(
    new Command('list')
      .description('List solutions in current environment')
      .action(async () => {
        try {
          const spinner = ora('Loading solutions...').start();
          const solutions = await pacCli.listSolutions();
          spinner.stop();

          if (solutions.length === 0) {
            console.log(chalk.yellow('No solutions found in current environment'));
            return;
          }

          console.log(chalk.bold('\nAvailable Solutions:\n'));
          solutions.forEach((sol: any) => {
            console.log(`${chalk.cyan(sol.UniqueName || sol.name)} - ${sol.FriendlyName || sol.displayName}`);
          });
          console.log();
        } catch (error: any) {
          console.error(chalk.red('Error listing solutions:'), error.message);
          console.log(chalk.yellow('\nMake sure you are authenticated with "agent-studio auth login"'));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('export')
      .description('Export a solution')
      .argument('<name>', 'Solution unique name')
      .option('-o, --output <path>', 'Output file path', './solution.zip')
      .option('-m, --managed', 'Export as managed solution', false)
      .action(async (name, options) => {
        try {
          const outputPath = path.resolve(options.output);
          const spinner = ora(`Exporting solution "${name}"...`).start();
          
          await pacCli.exportSolution(name, outputPath, options.managed);
          
          spinner.succeed(`Solution exported to: ${outputPath}`);
          addRecentSolution(name);
        } catch (error: any) {
          console.error(chalk.red('Export failed:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('import')
      .description('Import a solution')
      .argument('<path>', 'Path to solution zip file')
      .option('--no-activate', 'Do not activate plugins after import')
      .action(async (solutionPath, options) => {
        try {
          const resolvedPath = path.resolve(solutionPath);
          const spinner = ora(`Importing solution from "${resolvedPath}"...`).start();
          
          await pacCli.importSolution(resolvedPath, options.activate);
          
          spinner.succeed('Solution imported successfully');
        } catch (error: any) {
          console.error(chalk.red('Import failed:'), error.message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('clone')
      .description('Clone a solution to local directory')
      .argument('<name>', 'Solution unique name')
      .option('-o, --output <path>', 'Output directory', './')
      .action(async (name, options) => {
        try {
          const outputPath = path.resolve(options.output);
          const spinner = ora(`Cloning solution "${name}"...`).start();
          
          await pacCli.cloneSolution(name, outputPath);
          
          spinner.succeed(`Solution cloned to: ${outputPath}`);
          addRecentSolution(name);
        } catch (error: any) {
          console.error(chalk.red('Clone failed:'), error.message);
          process.exit(1);
        }
      })
  );
