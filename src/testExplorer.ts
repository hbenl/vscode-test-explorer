import * as vscode from 'vscode';
import * as RegExpEscape from 'escape-string-regexp';
import { TestAdapter } from 'vscode-test-adapter-api';
import { TestCollection } from './tree/testCollection';
import { TreeNode } from './tree/treeNode';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './treeEventDebouncer';
import { TestRunScheduler } from './testRunScheduler';

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

	registerAdapter(adapter: TestAdapter): void {
		this.collections.push(new TestCollection(adapter, this));
	}

	unregisterAdapter(adapter: TestAdapter): void {
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

	reload(node?: TreeNode): void {
		if (node) {
			node.collection.loadTests();
		} else {
			for (const collection of this.collections) {
				collection.loadTests();
			}
		}
	}

	run(node?: TreeNode): void {
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

		try {
			await node.collection.adapter.debug(node.info);
		} catch(e) {
			vscode.window.showErrorMessage(`Error while debugging test: ${e}`);
			return;
		}
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

	setAutorun(node?: TreeNode): void {
		if (node) {
			node.collection.setAutorun(node);
		} else {
			for (const collection of this.collections) {
				collection.setAutorun(collection.suite);
			}
		}
	}

	clearAutorun(node?: TreeNode): void {
		if (node) {
			node.collection.setAutorun(undefined);
		} else {
			for (const collection of this.collections) {
				collection.setAutorun(undefined);
			}
		}
	}

	retireState(node: TreeNode): void {
		node.collection.retireState(node);
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
