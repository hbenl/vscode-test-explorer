import * as vscode from 'vscode';
import { TestRunnerAdapter } from './adapter/api';
import { TestExplorerTree, TreeNode } from './tree/tree';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './debouncer';

export class TestExplorer implements vscode.TreeDataProvider<TreeNode> {

	private tree?: TestExplorerTree;
	private debouncer: TreeEventDebouncer;
	private readonly treeDataChanged = new vscode.EventEmitter<TreeNode>();
	public readonly onDidChangeTreeData: vscode.Event<TreeNode>;
	
	constructor(
		context: vscode.ExtensionContext,
		private readonly adapter: TestRunnerAdapter
	) {
		this.debouncer = new TreeEventDebouncer(this.treeDataChanged);
		this.onDidChangeTreeData = this.treeDataChanged.event;

		const iconPaths = new IconPaths(context);

		this.adapter.tests((suite) => {

			this.tree = TestExplorerTree.from(
				suite, this.tree, this.debouncer, iconPaths);

			this.debouncer.nodeChanged(this.tree.root);
		});

		this.adapter.testStates((testStateMessage) => {

			if (!this.tree) return;
			const node = this.tree.nodesById.get(testStateMessage.testId);
			if (!node) return;

			node.setCurrentState(testStateMessage.state);
		});

		this.adapter.reloadTests();
	}

	getTreeItem(node: TreeNode): vscode.TreeItem {
		return node.getTreeItem();
	}

	getChildren(node?: TreeNode): vscode.ProviderResult<TreeNode[]> {
		const parent = node || (this.tree ? this.tree.root : undefined);
		return parent ? parent.children : [];
	}

	reload(): void {
		this.adapter.reloadTests();
	}

	start(node: TreeNode | undefined): void {

		if (!this.tree) return;

		let testIds: string[] = [];
		if (node) {
			testIds = node.collectTestIds();
		} else {
			testIds = this.tree.root.collectTestIds();
		}

		if (testIds.length === 0) return;

		this.tree.root.deprecateState();
		for (const testId of testIds) {
			const testNode = this.tree.nodesById.get(testId);
			if (testNode) {
				testNode.setCurrentState('scheduled');
			}
		}
		this.debouncer.nodeChanged(this.tree.root);

		this.adapter.startTests(testIds);
	}
}
