import * as vscode from 'vscode';
import { TestController, TestAdapter } from 'vscode-test-adapter-api';
import { TestCollection } from './tree/testCollection';
import { TreeNode } from './tree/treeNode';
import { ErrorNode } from './tree/errorNode';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './treeEventDebouncer';
import { Decorator } from './decorator';
import { pickNode, findLineContaining } from './util';
import { SortSetting } from './tree/sort';

export class TestExplorer implements TestController, vscode.TreeDataProvider<TreeNode | ErrorNode>, vscode.CodeLensProvider, vscode.HoverProvider {

	public readonly iconPaths: IconPaths;
	public readonly decorator: Decorator;
	public readonly treeEvents: TreeEventDebouncer;

	private readonly outputChannel: vscode.OutputChannel;

	private readonly treeDataChanged = new vscode.EventEmitter<TreeNode>();
	public readonly onDidChangeTreeData: vscode.Event<TreeNode>;

	public readonly codeLensesChanged = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void>;

	public readonly collections = new Map<TestAdapter, TestCollection>();
	// the number of adapters that are in the process of loading their test definitions
	private loadingCount = 0;
	// the number of adapters that are running tests
	private runningCount = 0;

	private lastTestRun?: [ TestCollection, string[] ];

	constructor(
		public readonly context: vscode.ExtensionContext
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
		this.collections.set(adapter, new TestCollection(adapter, this));
	}

	unregisterTestAdapter(adapter: TestAdapter): void {
		const collection = this.collections.get(adapter);
		if (collection) {
			collection.dispose();
			this.collections.delete(adapter);
		}
	}

	getTreeItem(node: TreeNode | ErrorNode): vscode.TreeItem {
		return node.getTreeItem();
	}

	getChildren(node?: TreeNode | ErrorNode): (TreeNode | ErrorNode)[] {

		if (node) {

			return node.children;

		} else {

			const nonEmptyCollections = [ ...this.collections.values() ].filter(
				(collection) => ((collection.suite !== undefined) || (collection.error !== undefined)));

			if (nonEmptyCollections.length === 0) {

				return [];

			} else if (nonEmptyCollections.length === 1) {

				const collection = nonEmptyCollections[0];
				if (collection.suite) {
					return collection.suite.children;
				} else { // collection.error !== undefined
					return [ collection.error! ];
				}

			} else {

				return nonEmptyCollections.map(collection => (collection.suite || collection.error)!);

			}
		}
	}

	getParent(node: TreeNode | ErrorNode): TreeNode | undefined {
		return (<any>node).parent;
	}

	reload(node?: TreeNode | ErrorNode): void {
		if (node) {
			node.collection.adapter.load();
		} else {
			for (const adapter of this.collections.keys()) {
				try {
					adapter.load();
				} catch (err) {}
			}
		}
	}

	async run(nodes?: TreeNode[]): Promise<void> {

		this.lastTestRun = undefined;

		if (nodes) {

			const node = await pickNode(nodes);
			if (node) {
				this.lastTestRun = [ node.collection, [ node.info.id ] ];
				node.collection.adapter.run([ node.info.id ]);
			}

		} else {

			for (const collection of this.collections.values()) {
				if (collection.suite) {
					try {
						collection.adapter.run([ collection.suite.info.id ]);
					} catch (err) {}
				}
			}
		}
	}

	rerun(): Promise<void> {

		if (this.lastTestRun) {
			const collection = this.lastTestRun[0];
			const testIds = this.lastTestRun[1];
			return collection.adapter.run(testIds);
		}

		return Promise.resolve();
	}

	async debug(nodes: TreeNode[]): Promise<void> {

		this.lastTestRun = undefined;

		const node = await pickNode(nodes);
		if (node && node.collection.adapter.debug) {
			try {

				this.lastTestRun = [ node.collection, [ node.info.id ] ];
				await node.collection.adapter.debug([ node.info.id ]);

			} catch(e) {
				vscode.window.showErrorMessage(`Error while debugging test: ${e}`);
				return;
			}
		}
	}

	redebug(): Promise<void> {

		if (this.lastTestRun) {
			const collection = this.lastTestRun[0];
			const testIds = this.lastTestRun[1];
			return collection.adapter.debug!(testIds);
		}

		return Promise.resolve();
	}

	cancel(): void {
		for (const adapter of this.collections.keys()) {
			try {
				adapter.cancel();
			} catch (err) {}
		};
	}

	showError(message: string | undefined): void {

		if (message) {

			this.outputChannel.clear();
			this.outputChannel.append(message);
			this.outputChannel.show(true);

		} else {

			this.outputChannel.hide();

		}
	}

	async showSource(node: TreeNode): Promise<void> {

		const fileUri = node.fileUri;
		if (fileUri) {

			const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(fileUri));

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
			for (const collection of this.collections.values()) {
				collection.setAutorun(collection.suite);
			}
		}
	}

	clearAutorun(node?: TreeNode): void {
		if (node) {
			node.collection.setAutorun(undefined);
		} else {
			for (const collection of this.collections.values()) {
				collection.setAutorun(undefined);
			}
		}
	}

	retireState(node: TreeNode): void {
		if (node) {
			node.collection.retireState(node);
		} else {
			for (const collection of this.collections.values()) {
				collection.retireState();
			}
		}
	}

	resetState(node: TreeNode): void {
		if (node) {
			node.collection.resetState(node);
		} else {
			for (const collection of this.collections.values()) {
				collection.resetState();
			}
		}
	}

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {

		const fileUri = document.uri.toString();
		let codeLenses: vscode.CodeLens[] = [];
		for (const collection of this.collections.values()) {
			codeLenses = codeLenses.concat(collection.getCodeLenses(fileUri));
		}

		return codeLenses;
	}

	provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {

		for (const collection of this.collections.values()) {
			var hover = collection.getHover(document, position);
			if (hover) {
				return hover;
			}
		}

		return undefined;
	}

	async setSortBy(sortBy: SortSetting | null): Promise<void> {
		for (const collection of this.collections.values()) {
			await collection.setSortBy(sortBy, true);
		}
	}

	testLoadStarted(): void {
		this.loadingCount++;
		vscode.commands.executeCommand('setContext', 'testsLoading', true);
	}

	testLoadFinished(): void {
		this.loadingCount--;
		if (this.loadingCount === 0) {
			vscode.commands.executeCommand('setContext', 'testsLoading', false);
		}
	}

	testRunStarted(): void {
		this.runningCount++;
		vscode.commands.executeCommand('setContext', 'testsRunning', true);
	}

	testRunFinished(): void {
		this.runningCount--;
		if (this.runningCount === 0) {
			vscode.commands.executeCommand('setContext', 'testsRunning', false);
		}
	}
}
