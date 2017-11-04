import * as vscode from 'vscode';
import { TestRunnerAdapter } from './adapter/api';
import { TestExplorerTree, TestExplorerItem } from './tree';

export class TestExplorer implements vscode.TreeDataProvider<TestExplorerItem> {

	private tree?: TestExplorerTree;
	private readonly treeDataChanged = new vscode.EventEmitter<TestExplorerItem>();
	public readonly onDidChangeTreeData: vscode.Event<TestExplorerItem>;

	constructor(
		context: vscode.ExtensionContext,
		private readonly adapter: TestRunnerAdapter
	) {
		this.onDidChangeTreeData = this.treeDataChanged.event;

		this.adapter.tests.subscribe((suite) => {
			this.tree = TestExplorerTree.from(suite, this.tree, context.asAbsolutePath('icons/pending.svg'));
			this.treeDataChanged.fire();
		});

		this.adapter.testStates.subscribe((testState) => {

			if (!this.tree) return;
			const item = this.tree.itemsById.get(testState.testId);
			if (!item) return;

			switch(testState.state) {
				case 'running':
					item.iconPath = context.asAbsolutePath('icons/running.svg');
					break;

				case 'success':
					item.iconPath = context.asAbsolutePath('icons/success.svg');
					break;

				case 'error':
					item.iconPath = context.asAbsolutePath('icons/error.svg');
					break;
			}

			this.treeDataChanged.fire();
		});

		this.adapter.reloadTests();
	}

	getTreeItem(item: TestExplorerItem): vscode.TreeItem {
		return item;
	}

	getChildren(item?: TestExplorerItem): vscode.ProviderResult<TestExplorerItem[]> {
		const parent = item || (this.tree ? this.tree.root : undefined);
		return parent ? parent.children : [];
	}

	reload(): void {
		this.adapter.reloadTests();
	}

	start(item: TestExplorerItem | undefined): void {

		let testIds: string[] = [];

		if (item) {
			testIds = item.collectTestIds();
		} else {
			if (this.tree) {
				testIds = this.tree.root.collectTestIds();
			}
		}

		if (testIds.length === 0) return;

		this.adapter.startTests(testIds);
	}
}
