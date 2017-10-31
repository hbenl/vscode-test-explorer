import * as vscode from 'vscode';
import { TestItem } from './adapter/api';

export class TestExplorerTree {

	constructor(
		public readonly root: TestExplorerItem,
		public readonly itemsById: Map<string, TestExplorerItem>
	) {}

	static from(testItem: TestItem): TestExplorerTree {
		const itemsById = new Map<string, TestExplorerItem>();
		const root = transform(testItem, itemsById);
		return new TestExplorerTree(root, itemsById);
	}
}

export class TestExplorerItem extends vscode.TreeItem {
	constructor(
		public readonly testItem: TestItem,
		public readonly children: TestExplorerItem[],
		collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(testItem.label, collapsibleState);
	}
}

function transform(item: TestItem, itemsById: Map<string, TestExplorerItem>): TestExplorerItem {

	let result: TestExplorerItem;
	if (item.type === 'suite') {

		var children = item.children.map((child) => transform(child, itemsById));
		result = new TestExplorerItem(item, children, vscode.TreeItemCollapsibleState.Collapsed);

	} else {

		result = new TestExplorerItem(item, [], vscode.TreeItemCollapsibleState.None);
		
	}

	itemsById.set(item.id, result);

	return result;
}
