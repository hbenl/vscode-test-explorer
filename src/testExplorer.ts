import * as vscode from 'vscode';
import { TestController, TestAdapter } from 'vscode-test-adapter-api';
import { TestCollection } from './tree/testCollection';
import { TreeNode } from './tree/treeNode';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './treeEventDebouncer';
import { Decorator } from './decorator';
import { pickNode, findLineContaining, fileToUri, uriToFile } from './util';

export class TestExplorer implements TestController, vscode.TreeDataProvider<TreeNode>, vscode.CodeLensProvider {

	public readonly iconPaths: IconPaths;
	public readonly decorator: Decorator;
	public readonly treeEvents: TreeEventDebouncer;

	private readonly outputChannel: vscode.OutputChannel;

	private readonly treeDataChanged = new vscode.EventEmitter<TreeNode>();
	public readonly onDidChangeTreeData: vscode.Event<TreeNode>;

	public readonly codeLensesChanged = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void>;

	public readonly collections: TestCollection[] = [];

	constructor(
		context: vscode.ExtensionContext
	) {
		this.iconPaths = new IconPaths(context);
		this.decorator = new Decorator(context, this);
		this.treeEvents = new TreeEventDebouncer(this.collections, this.treeDataChanged);

		this.outputChannel = vscode.window.createOutputChannel("Test Explorer");
		context.subscriptions.push(this.outputChannel);

		this.onDidChangeTreeData = this.treeDataChanged.event;
		this.onDidChangeCodeLenses = this.codeLensesChanged.event;
	}

	registerTestAdapter(adapter: TestAdapter): void {
		this.collections.push(new TestCollection(adapter, this));
	}

	unregisterTestAdapter(adapter: TestAdapter): void {
		var index = this.collections.findIndex((collection) => (collection.adapter === adapter));
		if (index >= 0) {
			this.collections[index].dispose();
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
			node.collection.adapter.load();
		} else {
			for (const collection of this.collections) {
				collection.adapter.load();
			}
		}
	}

	async run(nodes?: TreeNode[]): Promise<void> {

		if (nodes) {

			const node = await pickNode(nodes);
			if (node) {
				node.collection.adapter.run(node.info);
			}

		} else {

			for (const collection of this.collections) {
				if (collection.suite) {
					collection.adapter.run(collection.suite.info);
				}
			}
		}
	}

	async debug(nodes: TreeNode[]): Promise<void> {

		const node = await pickNode(nodes);
		if (node) {
			try {

				await node.collection.adapter.debug(node.info);

			} catch(e) {
				vscode.window.showErrorMessage(`Error while debugging test: ${e}`);
				return;
			}
		}
	}

	cancel(): void {
		this.collections.forEach(collection => collection.adapter.cancel());
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

			const document = await vscode.workspace.openTextDocument(fileToUri(file));

			let line = node.info.line;
			if (line === undefined) {
				line = findLineContaining(node.info.label, document.getText());
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
		if (node) {
			node.collection.retireState(node);
		} else {
			for (const collection of this.collections) {
				collection.retireState();
			}
		}
	}

	resetState(node: TreeNode): void {
		if (node) {
			node.collection.resetState(node);
		} else {
			for (const collection of this.collections) {
				collection.resetState();
			}
		}
	}

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {

		const file = uriToFile(document.uri);
		const codeLenses = this.collections.map(collection => collection.getCodeLenses(file));

		return (<vscode.CodeLens[]>[]).concat(...codeLenses);
	}
}
