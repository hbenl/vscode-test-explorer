import * as vscode from 'vscode';
import { TestItem } from './adapter/api';

export class TestExplorerTree {

	constructor(
		public readonly root: TestExplorerItem,
		public readonly itemsById: Map<string, TestExplorerItem>
	) {}

	static from(testItem: TestItem, oldTree?: TestExplorerTree): TestExplorerTree {
		const itemsById = new Map<string, TestExplorerItem>();
		const oldItemsById = oldTree ? oldTree.itemsById : undefined;
		const root = transform(testItem, itemsById, oldItemsById);
		return new TestExplorerTree(root, itemsById);
	}
}

export class TestExplorerItem extends vscode.TreeItem {
	constructor(
		public readonly testItem: TestItem,
		public readonly children: TestExplorerItem[],
		collapsibleState?: vscode.TreeItemCollapsibleState
	) {
		super(testItem.label, collapsibleState);
	}
}

function transform(
	item: TestItem,
	itemsById: Map<string, TestExplorerItem>,
	oldItemsById?: Map<string, TestExplorerItem>
): TestExplorerItem {

	const oldItem = oldItemsById ? oldItemsById.get(item.id) : undefined;
	let result: TestExplorerItem;

	if (item.type === 'suite') {

		const children = item.children.map((child) => transform(child, itemsById, oldItemsById));
		const collapsibleState = oldItem ? oldItem.collapsibleState : vscode.TreeItemCollapsibleState.Collapsed;
		result = new TestExplorerItem(item, children, collapsibleState);

	} else {

		result = new TestExplorerItem(item, [], vscode.TreeItemCollapsibleState.None);
		
	}

	itemsById.set(item.id, result);

	return result;
}
