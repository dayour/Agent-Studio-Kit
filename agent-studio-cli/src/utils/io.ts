import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function readJsonInput(inputPath: string): Promise<unknown> {
  const resolvedPath = path.resolve(inputPath);
  return fs.readJson(resolvedPath);
}

export function writeJsonOutput(data: unknown, outputPath?: string): void {
  const json = JSON.stringify(data, null, 2);
  if (outputPath) {
    const resolvedPath = path.resolve(outputPath);
    fs.outputFileSync(resolvedPath, json);
    console.log(chalk.green(`Output written to: ${resolvedPath}`));
    return;
  }

  console.log(json);
}
