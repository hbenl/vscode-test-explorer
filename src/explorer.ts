import * as vscode from 'vscode';
import * as RegExpEscape from 'escape-string-regexp';
import { TestCollectionAdapter } from './adapter/api';
import { TestCollection } from './tree/testCollection';
import { TreeNode } from './tree/treeNode';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './debouncer';
import { TestRunScheduler } from './scheduler';

export class TestExplorer implements vscode.TreeDataProvider<TreeNode> {

	public readonly iconPaths: IconPaths;
	private readonly debouncer: TreeEventDebouncer;

	private readonly outputChannel: vscode.OutputChannel;

	private readonly treeDataChanged = new vscode.EventEmitter<TreeNode>();
	public readonly onDidChangeTreeData: vscode.Event<TreeNode>;

	private readonly collections: TestCollection[] = [];

	private scheduler = new TestRunScheduler(this);

	constructor(
		context: vscode.ExtensionContext
	) {

		this.iconPaths = new IconPaths(context);
		this.debouncer = new TreeEventDebouncer(this.collections, this.treeDataChanged);

		this.outputChannel = vscode.window.createOutputChannel("Test Explorer");
		context.subscriptions.push(this.outputChannel);

		this.onDidChangeTreeData = this.treeDataChanged.event;
	}

	registerCollection(adapter: TestCollectionAdapter): void {
		this.collections.push(new TestCollection(adapter, this));
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
				return nonEmptyCollections.map(collection => collection.suite!);
			}
		}
	}

	reload(collection?: TestCollection): void {
		if (collection) {
			collection.adapter.reloadTests();
		} else {
			for (const collection of this.collections) {
				collection.adapter.reloadTests();
			}
		}
	}

	start(node: TreeNode | undefined): void {
		if (node) {
			this.scheduler.schedule(node);
		} else {
			for (const collection of this.collections) {
				if (collection.suite) {
					this.scheduler.schedule(collection.suite);
				}
			}
		}
	}

	async debug(node: TreeNode): Promise<void> {

		await this.scheduler.cancel();

		node.collection.adapter.debugTests(node.getPath());
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

	async showSource(node: TreeNode): Promise<void> {

		const file = node.info.file;
		if (file) {

			const document = await vscode.workspace.openTextDocument(file);

			let line = node.info.line;
			if (line === undefined) {
				line = this.findLineContaining(node.info.label, document.getText());
				node.info.line = line;
			}

			const options = (line !== undefined) ? { selection: new vscode.Range(line, 0, line, 0) } : undefined;
			await vscode.window.showTextDocument(document, options);
		}
	}

	setAutorun(node: TreeNode): void {
		node.collection.setAutorun(node);
	}

	clearAutorun(collection: TestCollection): void {
		collection.setAutorun(undefined);
	}

	outdateState(node: TreeNode): void {
		node.collection.outdateState(node);
	}

	resetState(node: TreeNode): void {
		node.collection.resetState(node);
	}

	sendNodeChangedEvents(immediately: boolean): void {
		this.debouncer.sendNodeChangedEvents(immediately);
	}

	sendTreeChangedEvent(): void {
		this.debouncer.sendTreeChangedEvent();
	}

	private findLineContaining(needle: string, haystack: string | undefined): number | undefined {

		if (!haystack) return undefined;
	
		const index = haystack.search(RegExpEscape(needle));
		if (index < 0) return undefined;
	
		return haystack.substr(0, index).split('\n').length - 1;
	}
}
