import * as vscode from 'vscode';

export class TestExplorer implements vscode.TreeDataProvider<vscode.TreeItem> {

	onDidChangeTreeData?: vscode.Event<vscode.TreeItem>;

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		return [
			{
				label: 'Test Explorer Root'
			}
		];
	}
}
