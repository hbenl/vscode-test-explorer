import * as vscode from 'vscode';
import { TestCollection } from './testCollection';

export class ErrorNode {

	constructor(
		public readonly collection: TestCollection,
		public readonly id: string,
		public readonly errorMessage: string
	) {}

	getTreeItem(): vscode.TreeItem {

		const treeItem = new vscode.TreeItem('Error while loading tests - click to show', vscode.TreeItemCollapsibleState.None);
		treeItem.id = this.id;
		treeItem.iconPath = this.collection.explorer.iconPaths.errored;
		treeItem.contextValue = 'error';
		treeItem.command = {
			title: '',
			command: 'test-explorer.show-error',
			arguments: [ this.errorMessage ]
		};

		return treeItem;
	}

	get children() { return []; }
}
