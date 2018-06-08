import * as vscode from 'vscode';
import { TestSuiteNode } from './testSuiteNode';
import { TestAdapter, TestSuiteInfo } from 'vscode-test-adapter-api';
import { TestNode } from './testNode';
import { TestExplorer } from '../testExplorer';
import { TreeNode } from './treeNode';

export class TestCollection {

	private rootSuite: TestSuiteNode | undefined;
	private runningSuite: TestSuiteNode | undefined;
	private _autorunNode: TreeNode | undefined;
	private readonly locatedNodes = new Map<string, Map<number, TreeNode[]>>();
	private readonly codeLenses = new Map<string, vscode.CodeLens[]>();

	get suite() { return this.rootSuite; }
	get iconPaths() { return this.explorer.iconPaths; }
	get autorunNode() { return this._autorunNode; }

	constructor(
		public readonly adapter: TestAdapter,
		public readonly explorer: TestExplorer
	) {

		adapter.testStates((testStateMessage) => {
			if (this.rootSuite === undefined) return;

			if (testStateMessage.type === 'suite') {

				const suiteId = (typeof testStateMessage.suite === 'string') ? testStateMessage.suite : testStateMessage.suite.id;

				if (testStateMessage.state === 'running') {

					if (this.runningSuite === undefined) {

						if (suiteId === this.rootSuite.info.id) {
							this.runningSuite = this.rootSuite;
						}

					} else {

						let testSuiteNode = this.runningSuite.findChildTestSuiteNode(suiteId);
						if (testSuiteNode === undefined) {
							if (typeof testStateMessage.suite === 'object') {
								this.runningSuite.info.children.push(testStateMessage.suite);
								testSuiteNode = new TestSuiteNode(this, testStateMessage.suite, this.runningSuite);
								this.runningSuite.children.push(testSuiteNode);
								this.runningSuite.neededUpdates = 'recalc';
							}
						}

						if (testSuiteNode) {
							this.runningSuite = testSuiteNode;
						}

					}

				} else { // testStateMessage.state === 'completed'

					if (this.runningSuite) {
						this.runningSuite = this.runningSuite.parent;
					}

				}

			} else { // testStateMessage.type === 'test'

				if (this.runningSuite) {

					const testId = (typeof testStateMessage.test === 'string') ? testStateMessage.test : testStateMessage.test.id;
					let testNode = this.runningSuite.findChildTestNode(testId);

					if (testNode === undefined) {
						if (typeof testStateMessage.test === 'object') {
							this.runningSuite.info.children.push(testStateMessage.test);
							testNode = new TestNode(this, testStateMessage.test, this.runningSuite);
							this.runningSuite.children.push(testNode);
							this.runningSuite.neededUpdates = 'recalc';
						}
					}

					if (testNode) {
						testNode.setCurrentState(testStateMessage.state, testStateMessage.message);
					}
				}
			}

			this.sendNodeChangedEvents();
		});

		if (adapter.reload) {
			adapter.reload(() => this.loadTests());
		}

		if (adapter.autorun) {
			adapter.autorun(() => {
				if (this._autorunNode) {
					this.explorer.run(this._autorunNode);
				}
			});
		}

		this.loadTests();
	}

	async loadTests(): Promise<void> {

		let testSuiteInfo: TestSuiteInfo | undefined;
		try {
			testSuiteInfo = await this.adapter.load();
		} catch(e) {
			vscode.window.showErrorMessage(`Error while loading tests: ${e}`);
			return;
		}

		if (testSuiteInfo) {

			this.rootSuite = new TestSuiteNode(this, testSuiteInfo, undefined, this.rootSuite);

			if (this.shouldRetireStateOnReload()) {
				this.rootSuite.retireState();
			} else if (this.shouldResetStateOnReload()) {
				this.rootSuite.resetState();
			}

		} else {

			this.rootSuite = undefined;

		}

		this.runningSuite = undefined;
		this._autorunNode = undefined;

		this.computeCodeLenses();
		this.explorer.decorator.updateDecorationsNow();

		this.explorer.sendTreeChangedEvent();
	}

	recalcState(): void {
		if (this.rootSuite) {
			this.rootSuite.recalcState(this.rootSuite === this._autorunNode);
		}
	}

	retireState(node?: TreeNode): void {

		if (node) {

			node.retireState();

			let ancestor = node.parent;
			while (ancestor) {
				ancestor.neededUpdates = 'recalc';
				ancestor = ancestor.parent;
			}

		} else if (this.rootSuite) {

			this.rootSuite.retireState();

		}

		this.sendNodeChangedEvents();
	}

	resetState(node?: TreeNode): void {

		if (node) {

			node.resetState();

			let ancestor = node.parent;
			while (ancestor) {
				ancestor.neededUpdates = 'recalc';
				ancestor = ancestor.parent;
			}

		} else if (this.rootSuite) {

			this.rootSuite.resetState();

		}

		this.sendNodeChangedEvents();
	}

	setAutorun(node: TreeNode | undefined): void {

		if (this._autorunNode) {
			this.setRecalcNeededOnAncestors(this._autorunNode);
			this.setRecalcNeededOnDescendants(this._autorunNode);
			this._autorunNode = undefined;
		}

		if (this.rootSuite && node) {
			this.setRecalcNeededOnAncestors(node);
			this.setRecalcNeededOnDescendants(node);
			this._autorunNode = node;
		}

		this.explorer.sendNodeChangedEvents(true);
	}

	sendNodeChangedEvents(): void {
		this.explorer.sendNodeChangedEvents(false);
	}

	shouldRetireStateOnStart(): boolean {
		return (this.getConfiguration().get('onStart') === 'retire');
	}

	shouldResetStateOnStart(): boolean {
		return (this.getConfiguration().get('onStart') === 'reset');
	}

	shouldRetireStateOnReload(): boolean {
		return (this.getConfiguration().get('onReload') === 'retire');
	}

	shouldResetStateOnReload(): boolean {
		return (this.getConfiguration().get('onReload') === 'reset');
	}

	shouldShowCodeLens(): boolean {
		return (this.getConfiguration().get('codeLens') !== false);
	}

	shouldShowGutterDecoration(): boolean {
		return (this.getConfiguration().get('gutterDecoration') !== false);
	}

	computeCodeLenses(): void {

		this.codeLenses.clear();

		if (!this.shouldShowCodeLens()) return;
		if (this.rootSuite === undefined) return;

		this.locatedNodes.clear();
		this.collectLocatedNodes(this.rootSuite);

		for (const [ file, fileLocatedNodes ] of this.locatedNodes) {

			const fileCodeLenses: vscode.CodeLens[] = [];

			for (const [ line, lineLocatedNodes ] of fileLocatedNodes) {
				fileCodeLenses.push(this.createRunCodeLens(line, lineLocatedNodes));
				fileCodeLenses.push(this.createDebugCodeLens(line, lineLocatedNodes));
			}

			this.codeLenses.set(file, fileCodeLenses);
		}

		this.explorer.codeLensesChanged.fire();
	}

	getCodeLenses(file: string): vscode.CodeLens[] {
		return this.codeLenses.get(file) || [];
	}

	getLocatedNodes(file: string): Map<number, TreeNode[]> | undefined {
		return this.locatedNodes.get(file);
	}

	private getConfiguration(): vscode.WorkspaceConfiguration {
		const workspaceFolder = this.adapter.workspaceFolder;
		var workspaceUri = workspaceFolder ? workspaceFolder.uri : undefined;
		return vscode.workspace.getConfiguration('testExplorer', workspaceUri);
	}

	private setRecalcNeededOnDescendants(node: TreeNode): void {

		node.neededUpdates = 'recalc';

		for (const child of node.children) {
			this.setRecalcNeededOnDescendants(child);
		}
	}

	private setRecalcNeededOnAncestors(node: TreeNode): void {

		let _node: TreeNode | undefined = node;

		while (_node !== undefined) {
			_node.neededUpdates = 'recalc';
			_node = _node.parent;
		}
	}

	private collectLocatedNodes(node: TreeNode): void {

		this.addLocatedNode(node);

		for (const child of node.children) {
			if (child.info.type === 'test') {
				this.addLocatedNode(child);
			} else {
				this.collectLocatedNodes(child);
			}
		}
	}

	private addLocatedNode(node: TreeNode): void {

		if ((node.info.file === undefined) || (node.info.line === undefined)) return;

		let fileLocatedNodes = this.locatedNodes.get(node.info.file);
		if (!fileLocatedNodes) {
			fileLocatedNodes = new Map<number, TreeNode[]>()
			this.locatedNodes.set(node.info.file, fileLocatedNodes);
		}

		let lineLocatedNodes = fileLocatedNodes.get(node.info.line);
		if (!lineLocatedNodes) {
			lineLocatedNodes = [];
			fileLocatedNodes.set(node.info.line, lineLocatedNodes);
		}

		lineLocatedNodes.push(node);
	}

	private createRunCodeLens(
		line: number,
		nodes: TreeNode[]
	): vscode.CodeLens {

		const range = new vscode.Range(line, 0, line, 0);

		return new vscode.CodeLens(range, {
			title: 'Run',
			command: 'test-explorer.run',
			arguments: nodes
		});
	}

	private createDebugCodeLens(
		line: number,
		nodes: TreeNode[]
	): vscode.CodeLens {

		const range = new vscode.Range(line, 0, line, 0);

		return new vscode.CodeLens(range, {
			title: 'Debug',
			command: 'test-explorer.debug',
			arguments: nodes
		});
	}
}
