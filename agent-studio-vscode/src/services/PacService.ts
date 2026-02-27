import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { OutputChannelService } from './OutputChannelService';

const execAsync = promisify(exec);

export class PacService {
    private outputService: OutputChannelService;

    constructor(outputService: OutputChannelService) {
        this.outputService = outputService;
    }

    async isPacCliInstalled(): Promise<boolean> {
        try {
            await execAsync('pac --version');
            return true;
        } catch {
            return false;
        }
    }

    async authenticate(url: string, name: string): Promise<void> {
        this.outputService.log(`Authenticating to ${url}...`);
        // Sanitize inputs to prevent shell injection
        const safeUrl = url.replace(/[;&|`$"\\]/g, '');
        const safeName = name.replace(/[;&|`$"\\]/g, '');
        const command = `pac auth create --url "${safeUrl}" --name "${safeName}"`;
        
        try {
            const { stdout, stderr } = await execAsync(command);
            this.outputService.log(stdout);
            if (stderr) {
                this.outputService.log(stderr);
            }
        } catch (error: any) {
            this.outputService.log(`Error: ${error.message}`);
            throw error;
        }
    }

    async listAuthProfiles(): Promise<any[]> {
        try {
            const { stdout } = await execAsync('pac auth list');
            this.outputService.log(stdout);
            
            const profiles: any[] = [];
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                if (line.includes('https://')) {
                    const parts = line.trim().split(/\s+/);
                    const isActive = line.includes('*');
                    const url = parts.find(p => p.startsWith('https://'));
                    const name = parts[0].replace('*', '').trim();
                    
                    if (url) {
                        profiles.push({ name, url, isActive });
                    }
                }
            }
            
            return profiles;
        } catch (error: any) {
            this.outputService.log(`Error listing profiles: ${error.message}`);
            return [];
        }
    }

    async listSolutions(): Promise<any[]> {
        try {
            const { stdout } = await execAsync('pac solution list');
            this.outputService.log(stdout);
            
            // Parse the output
            const solutions: any[] = [];
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                if (line.trim() && !line.includes('Solution Name')) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        solutions.push({
                            uniqueName: parts[0],
                            friendlyName: parts.slice(1).join(' ')
                        });
                    }
                }
            }
            
            return solutions;
        } catch (error: any) {
            this.outputService.log(`Error listing solutions: ${error.message}`);
            return [];
        }
    }

    async cloneSolution(name: string, outputPath: string): Promise<void> {
        this.outputService.log(`Cloning solution ${name}...`);
        const safeName = name.replace(/[;&|`$"\\]/g, '');
        const safePath = outputPath.replace(/[;&|`$"\\]/g, '');
        const command = `pac solution clone --name "${safeName}" --outputDirectory "${safePath}"`;
        
        try {
            const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            this.outputService.log(stdout);
            if (stderr) {
                this.outputService.log(stderr);
            }
        } catch (error: any) {
            this.outputService.log(`Error: ${error.message}`);
            throw error;
        }
    }

    async exportSolution(name: string, outputPath: string, managed = false): Promise<void> {
        this.outputService.log(`Exporting solution ${name}...`);
        const safeName = name.replace(/[;&|`$"\\]/g, '');
        const safePath = outputPath.replace(/[;&|`$"\\]/g, '');
        const managedFlag = managed ? '--managed true' : '';
        const command = `pac solution export --name "${safeName}" --path "${safePath}" ${managedFlag}`;
        
        try {
            const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            this.outputService.log(stdout);
            if (stderr) {
                this.outputService.log(stderr);
            }
        } catch (error: any) {
            this.outputService.log(`Error: ${error.message}`);
            throw error;
        }
    }

    async importSolution(path: string): Promise<void> {
        this.outputService.log(`Importing solution from ${path}...`);
        const safePath = path.replace(/[;&|`$"\\]/g, '');
        const command = `pac solution import --path "${safePath}" --activate-plugins`;
        
        try {
            const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            this.outputService.log(stdout);
            if (stderr) {
                this.outputService.log(stderr);
            }
        } catch (error: any) {
            this.outputService.log(`Error: ${error.message}`);
            throw error;
        }
    }
}
