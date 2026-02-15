import * as vscode from 'vscode';
import { EnvironmentTreeProvider } from './providers/EnvironmentTreeProvider';
import { SolutionTreeProvider } from './providers/SolutionTreeProvider';
import { PacService } from './services/PacService';
import { OutputChannelService } from './services/OutputChannelService';

let pacService: PacService;
let outputService: OutputChannelService;

export function activate(context: vscode.ExtensionContext) {
    console.log('Agent Studio Kit extension is now active');

    // Initialize services
    outputService = new OutputChannelService();
    pacService = new PacService(outputService);

    // Initialize tree providers
    const environmentProvider = new EnvironmentTreeProvider(pacService);
    const solutionProvider = new SolutionTreeProvider(pacService);

    // Register tree views
    vscode.window.registerTreeDataProvider('agentStudioEnvironments', environmentProvider);
    vscode.window.registerTreeDataProvider('agentStudioSolutions', solutionProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.connect', async () => {
            const url = await vscode.window.showInputBox({
                prompt: 'Enter Power Platform environment URL',
                placeHolder: 'https://yourorg.crm.dynamics.com',
                validateInput: (value) => {
                    if (!value.startsWith('https://')) {
                        return 'URL must start with https://';
                    }
                    return null;
                }
            });

            if (url) {
                const name = await vscode.window.showInputBox({
                    prompt: 'Enter a name for this profile',
                    placeHolder: 'default',
                    value: 'default'
                });

                try {
                    await pacService.authenticate(url, name || 'default');
                    vscode.window.showInformationMessage(`Connected to ${url}`);
                    vscode.commands.executeCommand('setContext', 'agent-studio.connected', true);
                    
                    // Refresh views
                    environmentProvider.refresh();
                    solutionProvider.refresh();
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Connection failed: ${error.message}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.disconnect', async () => {
            vscode.commands.executeCommand('setContext', 'agent-studio.connected', false);
            vscode.window.showInformationMessage('Disconnected from environment');
            solutionProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.refreshEnvironments', () => {
            environmentProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.refreshSolutions', () => {
            solutionProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.cloneSolution', async (item: any) => {
            const solutionName = item?.label || await vscode.window.showInputBox({
                prompt: 'Enter solution name to clone',
                placeHolder: 'MySolution'
            });

            if (solutionName) {
                const uri = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: 'Select output folder'
                });

                if (uri && uri[0]) {
                    try {
                        await pacService.cloneSolution(solutionName, uri[0].fsPath);
                        vscode.window.showInformationMessage(`Solution ${solutionName} cloned successfully`);
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Clone failed: ${error.message}`);
                    }
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.exportSolution', async (item: any) => {
            const solutionName = item?.label || await vscode.window.showInputBox({
                prompt: 'Enter solution name to export',
                placeHolder: 'MySolution'
            });

            if (solutionName) {
                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(`${solutionName}.zip`),
                    filters: {
                        'ZIP files': ['zip']
                    }
                });

                if (uri) {
                    try {
                        await pacService.exportSolution(solutionName, uri.fsPath);
                        vscode.window.showInformationMessage(`Solution ${solutionName} exported successfully`);
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Export failed: ${error.message}`);
                    }
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.importSolution', async () => {
            const uri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'ZIP files': ['zip']
                },
                openLabel: 'Select solution file'
            });

            if (uri && uri[0]) {
                try {
                    await pacService.importSolution(uri[0].fsPath);
                    vscode.window.showInformationMessage('Solution imported successfully');
                    solutionProvider.refresh();
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Import failed: ${error.message}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('agent-studio.showOutput', () => {
            outputService.show();
        })
    );

    // Check if PAC CLI is installed
    checkPacCliInstallation();
}

async function checkPacCliInstallation() {
    const isInstalled = await pacService.isPacCliInstalled();
    if (!isInstalled) {
        const install = await vscode.window.showWarningMessage(
            'PAC CLI is not installed. Would you like to install it?',
            'Install',
            'Later'
        );
        
        if (install === 'Install') {
            vscode.env.openExternal(vscode.Uri.parse('https://learn.microsoft.com/power-platform/developer/cli/introduction'));
        }
    }
}

export function deactivate() {
    if (outputService) {
        outputService.dispose();
    }
}
