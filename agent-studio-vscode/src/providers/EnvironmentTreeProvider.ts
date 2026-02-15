import * as vscode from 'vscode';
import { PacService } from '../services/PacService';

export class EnvironmentTreeProvider implements vscode.TreeDataProvider<EnvironmentItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EnvironmentItem | undefined | null | void> = new vscode.EventEmitter<EnvironmentItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<EnvironmentItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private pacService: PacService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: EnvironmentItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: EnvironmentItem): Promise<EnvironmentItem[]> {
        if (!element) {
            // Root level - list authentication profiles
            const profiles = await this.pacService.listAuthProfiles();
            
            if (profiles.length === 0) {
                return [new EnvironmentItem('No environments connected', '', vscode.TreeItemCollapsibleState.None, false)];
            }
            
            return profiles.map(profile => 
                new EnvironmentItem(
                    profile.name,
                    profile.url,
                    vscode.TreeItemCollapsibleState.None,
                    profile.isActive
                )
            );
        }
        
        return [];
    }
}

class EnvironmentItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly url: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly isActive: boolean
    ) {
        super(label, collapsibleState);
        
        this.tooltip = url || label;
        this.description = url ? `${isActive ? '• ' : ''}${url}` : '';
        this.iconPath = new vscode.ThemeIcon(isActive ? 'vm-active' : 'vm-outline');
        this.contextValue = 'environment';
    }
}
