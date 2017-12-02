import * as vscode from 'vscode';
import { TestCollectionAdapter } from './adapter/api';
import { TestCollectionNode } from './tree/testCollectionNode';
import { TreeNode } from './tree/treeNode';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './debouncer';
import { TestNode } from './tree/testNode';
import { TestRunScheduler } from './scheduler';

export class TestExplorer implements vscode.TreeDataProvider<TreeNode> {

	public readonly iconPaths: IconPaths;
	private readonly debouncer: TreeEventDebouncer;

	private readonly outputChannel: vscode.OutputChannel;

	private readonly treeDataChanged = new vscode.EventEmitter<TreeNode>();
	public readonly onDidChangeTreeData: vscode.Event<TreeNode>;

	private collections: TestCollectionNode[] = [];

	private scheduler = new TestRunScheduler(this);

	constructor(
		context: vscode.ExtensionContext
	) {

		this.iconPaths = new IconPaths(context);
		this.debouncer = new TreeEventDebouncer(this.treeDataChanged);

		this.outputChannel = vscode.window.createOutputChannel("Test Explorer");
		context.subscriptions.push(this.outputChannel);

		this.onDidChangeTreeData = this.treeDataChanged.event;
	}

	registerCollection(adapter: TestCollectionAdapter): void {
		this.collections.push(new TestCollectionNode(adapter, this));
	}

	unregisterCollection(adapter: TestCollectionAdapter): void {
		var index = this.collections.findIndex((collection) => (collection.adapter === adapter));
		if (index >= 0) {
			this.collections.splice(index, 1);
		}
	}

	getTreeItem(node: TreeNode): vscode.TreeItem {
		return node.getTreeItem();
	}

	getChildren(node?: TreeNode): vscode.ProviderResult<TreeNode[]> {

		if (node) {

			return node.children;

		} else {

			const nonEmptyCollections = this.collections.filter(
				(collection) => (collection.suite !== undefined));

			if (nonEmptyCollections.length === 0) {

				return [];

			} else if (nonEmptyCollections.length === 1) {

				return nonEmptyCollections[0].suite!.children;

			} else {

				return nonEmptyCollections.map((collection) => collection.suite!);

			}
		}
	}

	reload(): void {
		for (const collection of this.collections) {
			collection.adapter.reloadTests();
		}
	}

	start(node: TreeNode | undefined): void {
		if (node) {
			this.scheduler.schedule(node);
		} else {
			for (const collection of this.collections) {
				this.scheduler.schedule(collection);
			}
		}
	}

	async debug(node: TreeNode): Promise<void> {

		const testNodes = new Map<string, TestNode>();
		node.collectTestNodes(testNodes);

		if (testNodes.size === 0) return;

		await this.scheduler.cancel();
		
		node.collection.adapter.debugTests([...testNodes.keys()]);
	}

	cancel(): void {
		this.scheduler.cancel();
	}

	selected(node: TreeNode | undefined): void {

		if (!node) return;

		if (node.log) {

			this.outputChannel.clear();
			this.outputChannel.append(node.log);
			this.outputChannel.show(true);

		} else {

			this.outputChannel.hide();

		}
	}

	nodeChanged(node: TreeNode): void {
		this.debouncer.nodeChanged(node);
	}
}