import * as vscode from 'vscode';
import { PacService } from '../services/PacService';

export class SolutionTreeProvider implements vscode.TreeDataProvider<SolutionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SolutionItem | undefined | null | void> = new vscode.EventEmitter<SolutionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SolutionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private pacService: PacService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SolutionItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SolutionItem): Promise<SolutionItem[]> {
        if (!element) {
            // Root level - list solutions
            const solutions = await this.pacService.listSolutions();
            
            if (solutions.length === 0) {
                return [new SolutionItem('No solutions found', '', vscode.TreeItemCollapsibleState.None)];
            }
            
            return solutions.map(solution => 
                new SolutionItem(
                    solution.uniqueName,
                    solution.friendlyName,
                    vscode.TreeItemCollapsibleState.None
                )
            );
        }
        
        return [];
    }
}

class SolutionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly friendlyName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        
        this.tooltip = friendlyName || label;
        this.description = friendlyName !== label ? friendlyName : '';
        this.iconPath = new vscode.ThemeIcon('package');
        this.contextValue = 'solution';
    }
}
