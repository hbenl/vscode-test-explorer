import * as vscode from 'vscode';
import { TestCollection } from './testCollection';
import { TestAdapterDelegate } from '../hub/testAdapterDelegate';

export class ErrorNode {

	constructor(
		public readonly collection: TestCollection,
		public readonly id: string,
		public readonly errorMessage: string
	) {}

	getTreeItem(): vscode.TreeItem {

		const adapterDelegate = this.collection.adapter as TestAdapterDelegate;
		let label = adapterDelegate.adapter.constructor.name.replace (/(.*)Adapter/, "$1");
		if (this.collection.adapter.workspaceFolder && vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1)) {
			label = `${this.collection.adapter.workspaceFolder.name} - ${label}`;
		}
		label += ': Error';

		const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
		treeItem.id = this.id;
		treeItem.iconPath = this.collection.explorer.iconPaths.errored;
		treeItem.contextValue = 'error';
		treeItem.command = {
			title: '',
			command: 'test-explorer.show-error',
			arguments: [ this.errorMessage ]
		};
		treeItem.tooltip = 'Error while loading tests - click to show';

		return treeItem;
	}

	get children() { return []; }
}
