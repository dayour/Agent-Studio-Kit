#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { envCommand } from './commands/env';
import { solutionCommand } from './commands/solution';
import { authCommand } from './commands/auth';

const program = new Command();

program
  .name('agent-studio')
  .description('CLI tool for Agent Studio Kit - manage Power Platform environments and Copilot Studio solutions')
  .version('1.0.0');

// Add commands
program.addCommand(authCommand);
program.addCommand(envCommand);
program.addCommand(solutionCommand);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
