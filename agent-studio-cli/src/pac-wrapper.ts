import { execa } from 'execa';
import chalk from 'chalk';

export interface PacAuthProfile {
  name: string;
  url: string;
  isActive: boolean;
  kind: string;
}

export class PacCli {
  /**
   * Check if PAC CLI is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      await execa('pac', ['--version']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get PAC CLI version
   */
  async getVersion(): Promise<string> {
    const { stdout } = await execa('pac', ['--version']);
    return stdout.trim();
  }

  /**
   * Authenticate to Power Platform
   */
  async auth(url: string, name?: string): Promise<void> {
    const args = ['auth', 'create', '--url', url];
    if (name) {
      args.push('--name', name);
    }
    await execa('pac', args, { stdio: 'inherit' });
  }

  /**
   * List authentication profiles
   */
  async listAuth(): Promise<PacAuthProfile[]> {
    try {
      const { stdout } = await execa('pac', ['auth', 'list']);
      const profiles: PacAuthProfile[] = [];
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('https://')) {
          const parts = line.trim().split(/\s+/);
          const isActive = line.includes('*');
          const url = parts.find(p => p.startsWith('https://'));
          const name = parts[0].replace('*', '').trim();
          
          if (url) {
            profiles.push({
              name,
              url,
              isActive,
              kind: 'PowerPlatform'
            });
          }
        }
      }
      
      return profiles;
    } catch (error) {
      console.error(chalk.red('Error listing authentication profiles'));
      return [];
    }
  }

  /**
   * Select an authentication profile
   */
  async selectAuth(nameOrIndex: string): Promise<void> {
    await execa('pac', ['auth', 'select', '--name', nameOrIndex], { stdio: 'inherit' });
  }

  /**
   * List environments
   */
  async listEnvironments(): Promise<any[]> {
    const { stdout } = await execa('pac', ['admin', 'list']);
    // Parse the output and return environments
    return JSON.parse(stdout || '[]');
  }

  /**
   * Export solution
   */
  async exportSolution(name: string, outputPath: string, managed = false): Promise<void> {
    const args = ['solution', 'export', '--name', name, '--path', outputPath];
    if (managed) {
      args.push('--managed', 'true');
    }
    await execa('pac', args, { stdio: 'inherit' });
  }

  /**
   * Import solution
   */
  async importSolution(path: string, activate = true): Promise<void> {
    const args = ['solution', 'import', '--path', path];
    if (activate) {
      args.push('--activate-plugins');
    }
    await execa('pac', args, { stdio: 'inherit' });
  }

  /**
   * Clone solution
   */
  async cloneSolution(name: string, outputPath: string): Promise<void> {
    // Sanitize inputs to prevent command injection via argument values
    const safeName = name.replace(/[;&|`$]/g, '');
    const safePath = outputPath.replace(/[;&|`$]/g, '');
    await execa('pac', ['solution', 'clone', '--name', safeName, '--outputDirectory', safePath], { 
      stdio: 'inherit' 
    });
  }

  /**
   * List solutions in current environment
   */
  async listSolutions(): Promise<any[]> {
    try {
      const { stdout } = await execa('pac', ['solution', 'list']);
      return JSON.parse(stdout || '[]');
    } catch {
      // If JSON parsing fails, return empty array
      return [];
    }
  }
}

export const pacCli = new PacCli();
