import * as vscode from 'vscode';
import { TestRunnerAdapter } from './adapter/api';
import { TestExplorerTree, TreeItem } from './tree';
import { IconPaths } from './iconPaths';

export class TestExplorer implements vscode.TreeDataProvider<TreeItem> {

	private tree?: TestExplorerTree;
	private readonly treeDataChanged = new vscode.EventEmitter<TreeItem>();
	public readonly onDidChangeTreeData: vscode.Event<TreeItem>;

	constructor(
		context: vscode.ExtensionContext,
		private readonly adapter: TestRunnerAdapter
	) {
		this.onDidChangeTreeData = this.treeDataChanged.event;

		this.adapter.tests.subscribe((suite) => {

			this.tree = TestExplorerTree.from(
				suite, this.tree, this.treeDataChanged, new IconPaths(context));

			this.treeDataChanged.fire();
		});

		this.adapter.testStates.subscribe((testStateMessage) => {

			if (!this.tree) return;
			const item = this.tree.itemsById.get(testStateMessage.testId);
			if (!item) return;

			item.setCurrentState(testStateMessage.state);
		});

		this.adapter.reloadTests();
	}

	getTreeItem(item: TreeItem): vscode.TreeItem {
		return item;
	}

	getChildren(item?: TreeItem): vscode.ProviderResult<TreeItem[]> {
		const parent = item || (this.tree ? this.tree.root : undefined);
		return parent ? parent.children : [];
	}

	reload(): void {
		this.adapter.reloadTests();
	}

	start(item: TreeItem | undefined): void {

		if (!this.tree) return;

		let testIds: string[] = [];
		if (item) {
			testIds = item.collectTestIds();
		} else {
			testIds = this.tree.root.collectTestIds();
		}

		if (testIds.length === 0) return;

		this.tree.root.shiftState();

		this.adapter.startTests(testIds);
	}
}
