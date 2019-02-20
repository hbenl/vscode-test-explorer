import * as vscode from 'vscode';
import { TestSuiteNode } from './testSuiteNode';
import { TestEvent, TestSuiteEvent, TestAdapter, TestRunStartedEvent, TestRunFinishedEvent, TestLoadStartedEvent, TestLoadFinishedEvent } from 'vscode-test-adapter-api';
import { TestNode } from './testNode';
import { TestExplorer } from '../testExplorer';
import { TreeNode } from './treeNode';
import { ErrorNode } from './errorNode';
import { allTests, createRunCodeLens, createDebugCodeLens, createRevealCodeLens, createLogCodeLens } from '../util';

export class TestCollection {

	private static nextCollectionId = 1;

	private disposables: vscode.Disposable[] = [];

	private id: number;
	private rootSuite: TestSuiteNode | undefined;
	private errorNode: ErrorNode | undefined;
	private allRunningTests: TestNode[] | undefined;
	private runningSuite: TestSuiteNode | undefined;
	private _autorunNode: TreeNode | undefined;
	private readonly nodesById = new Map<string, TreeNode>();
	private readonly idCount = new Map<string, number>();
	private readonly locatedNodes = new Map<string, Map<number, TreeNode[]>>();
	private readonly codeLenses = new Map<string, vscode.CodeLens[]>();

	get suite() { return this.rootSuite; }
	get error() { return this.errorNode; }
	get autorunNode() { return this._autorunNode; }

	constructor(
		public readonly adapter: TestAdapter,
		public readonly explorer: TestExplorer
	) {

		this.id = TestCollection.nextCollectionId++;

		const workspaceUri = adapter.workspaceFolder ? adapter.workspaceFolder.uri : undefined;

		this.disposables.push(vscode.workspace.onDidChangeConfiguration(configChange => {

			if (configChange.affectsConfiguration('testExplorer.codeLens', workspaceUri)) {
				this.computeCodeLenses();
			}

			if (configChange.affectsConfiguration('testExplorer.gutterDecoration', workspaceUri) ||
				configChange.affectsConfiguration('testExplorer.errorDecoration', workspaceUri)) {
				this.explorer.decorator.updateDecorationsNow();
			}

			if (configChange.affectsConfiguration('testExplorer.orderingStrategy')) {
				this.explorer.reload();
			}
		}));

		this.disposables.push(adapter.tests(testLoadEvent => this.onTestLoadEvent(testLoadEvent)));
		this.disposables.push(adapter.testStates(testRunEvent => this.onTestRunEvent(testRunEvent)));

		if (adapter.autorun) {
			this.disposables.push(adapter.autorun(() => {
				if (this._autorunNode) {
					this.explorer.run([this._autorunNode]);
				}
			}));
		}
	}

	private onTestLoadEvent(testLoadEvent: TestLoadStartedEvent | TestLoadFinishedEvent): void {

		if (testLoadEvent.type === 'started') {

			this.explorer.testLoadStarted();

		} else if (testLoadEvent.type === 'finished') {

			this.explorer.testLoadFinished();

			if (testLoadEvent.suite) {

				this.rootSuite = new TestSuiteNode(this, testLoadEvent.suite, undefined, this.getOrderingStrategy(), this.nodesById);
				this.errorNode = undefined;

				if (this.shouldRetireStateOnReload()) {
					this.rootSuite.retireState();
				} else if (this.shouldResetStateOnReload()) {
					this.rootSuite.resetState();
				}

			} else {

				this.rootSuite = undefined;
				if (testLoadEvent.errorMessage) {
					this.errorNode = new ErrorNode(this, testLoadEvent.errorMessage);
				} else {
					this.errorNode = undefined;
				}
			}

			this.collectNodesById();

			if (this._autorunNode) {
				const newAutorunNode = this.nodesById.get(this._autorunNode.info.id);
				this.setAutorun(newAutorunNode);
				this.explorer.run([this._autorunNode]);
			}

			this.runningSuite = undefined;

			this.computeCodeLenses();
			this.explorer.decorator.updateDecorationsNow();

			this.explorer.treeEvents.sendTreeChangedEvent();
		}
	}

	private onTestRunEvent(testRunEvent: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent): void {
		if (this.rootSuite === undefined) return;

		if (testRunEvent.type === 'started') {

			if (this.shouldRetireStateOnStart()) {
				this.retireState();
			} else if (this.shouldResetStateOnStart()) {
				this.resetState();
			}

			this.allRunningTests = [];
			for (const nodeId of testRunEvent.tests) {
				const node = this.nodesById.get(nodeId);
				if (node) {
					this.allRunningTests.push(...allTests(node));
				}
			}
			for (const testNode of this.allRunningTests) {
				testNode.setCurrentState('scheduled');
			}

			this.explorer.testRunStarted();

		} else if (testRunEvent.type === 'finished') {

			if (this.allRunningTests) {
				for (const testNode of this.allRunningTests) {
					if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
						testNode.setCurrentState('pending');
					}
				}
				this.allRunningTests = undefined;
			}

			this.explorer.testRunFinished();

			this.computeCodeLenses();

		} else if (testRunEvent.type === 'suite') {

			const suiteId = (typeof testRunEvent.suite === 'string') ? testRunEvent.suite : testRunEvent.suite.id;
			const node = this.nodesById.get(suiteId);
			let testSuiteNode = (node && (node.info.type === 'suite')) ? <TestSuiteNode>node : undefined;

			if (testRunEvent.state === 'running') {

				if (!testSuiteNode && this.runningSuite && (typeof testRunEvent.suite === 'object')) {

					this.runningSuite.info.children.push(testRunEvent.suite);
					testSuiteNode = new TestSuiteNode(this, testRunEvent.suite, this.runningSuite, this.getOrderingStrategy());
					this.runningSuite.children.push(testSuiteNode);
					this.runningSuite.neededUpdates = 'recalc';
					this.nodesById.set(suiteId, testSuiteNode);

				}

				if (testSuiteNode) {
					this.runningSuite = testSuiteNode;
				}

			} else { // testStateMessage.state === 'completed'

				const suiteId = (typeof testRunEvent.suite === 'object') ? testRunEvent.suite.id : testRunEvent.suite;
				const suiteNode = this.nodesById.get(suiteId);
				if (suiteNode) {
					for (const testNode of allTests(suiteNode)) {
						if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
							testNode.setCurrentState('pending');
						}
					}
				}

				if (this.runningSuite) {
					this.runningSuite = this.runningSuite.parent;
				}

			}

		} else { // testStateMessage.type === 'test'

			const testId = (typeof testRunEvent.test === 'string') ? testRunEvent.test : testRunEvent.test.id;
			const node = this.nodesById.get(testId);
			let testNode = (node && (node.info.type === 'test')) ? <TestNode>node : undefined;

			if (!testNode && this.runningSuite && (typeof testRunEvent.test === 'object')) {

				this.runningSuite.info.children.push(testRunEvent.test);
				testNode = new TestNode(this, testRunEvent.test, this.runningSuite);
				this.runningSuite.children.push(testNode);
				this.runningSuite.neededUpdates = 'recalc';
				this.nodesById.set(testId, testNode);

			}

			if (testNode) {
				testNode.setCurrentState(
					testRunEvent.state,
					testRunEvent.message,
					testRunEvent.decorations
				);
			}
		}

		this.sendNodeChangedEvents();
	}

	recalcState(): void {
		if (this.rootSuite) {
			this.rootSuite.recalcState();
		}
	}

	retireState(node?: TreeNode): void {

		if (node) {

			node.retireState();

			if (node.parent) {
				node.parent.neededUpdates = 'recalc';
			}

		} else if (this.rootSuite) {

			this.rootSuite.retireState();

		}

		this.sendNodeChangedEvents();
	}

	resetState(node?: TreeNode): void {

		if (node) {

			node.resetState();

			if (node.parent) {
				node.parent.neededUpdates = 'recalc';
			}

		} else if (this.rootSuite) {

			this.rootSuite.resetState();

		}

		this.sendNodeChangedEvents();
		this.computeCodeLenses();
	}

	setAutorun(node: TreeNode | undefined): void {

		if (this._autorunNode) {
			this._autorunNode.setAutorun(false);
			if (this._autorunNode.parent) {
				this._autorunNode.parent.neededUpdates = 'recalc';
			}
			this._autorunNode = undefined;
		}

		if (this.rootSuite && node) {
			node.setAutorun(true);
			if (node.parent) {
				node.parent.neededUpdates = 'recalc';
			}
			this._autorunNode = node;
		}

		this.explorer.treeEvents.sendNodeChangedEvents(true);
	}

	sendNodeChangedEvents(): void {
		this.explorer.treeEvents.sendNodeChangedEvents(false);
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

	shouldShowErrorDecoration(): boolean {
		return (this.getConfiguration().get('errorDecoration') !== false);
	}

	getOrderingStrategy(): 'orderByAdapter' | 'orderByAlphabet' | 'orderByLocation' {
		return this.getConfiguration().get('orderingStrategy', 'orderByAdapter');
	}

	computeCodeLenses(): void {

		this.codeLenses.clear();
		this.locatedNodes.clear();

		if (this.rootSuite !== undefined) {

			this.collectLocatedNodes(this.rootSuite);

			if (this.shouldShowCodeLens()) {

				for (const [ file, fileLocatedNodes ] of this.locatedNodes) {

					const fileCodeLenses: vscode.CodeLens[] = [];

					for (const [ line, lineLocatedNodes ] of fileLocatedNodes) {

						fileCodeLenses.push(createRunCodeLens(line, lineLocatedNodes));

						if (this.adapter.debug) {
							fileCodeLenses.push(createDebugCodeLens(line, lineLocatedNodes));
						}

						if (lineLocatedNodes.some(node => (node.log !== undefined) && (node.log.length > 0))) {
							fileCodeLenses.push(createLogCodeLens(line, lineLocatedNodes));
						}

						fileCodeLenses.push(createRevealCodeLens(line, lineLocatedNodes));
					}

					this.codeLenses.set(file, fileCodeLenses);
				}
			}
		}

		this.explorer.codeLensesChanged.fire();
	}

	getCodeLenses(fileUri: string): vscode.CodeLens[] {
		return this.codeLenses.get(fileUri) || [];
	}

	getLocatedNodes(fileUri: string): Map<number, TreeNode[]> | undefined {
		return this.locatedNodes.get(fileUri);
	}

	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables = [];
	}

	private getConfiguration(): vscode.WorkspaceConfiguration {
		const workspaceFolder = this.adapter.workspaceFolder;
		var workspaceUri = workspaceFolder ? workspaceFolder.uri : null;
		return vscode.workspace.getConfiguration('testExplorer', workspaceUri);
	}

	private collectNodesById(): void {

		this.nodesById.clear();
		this.idCount.clear();

		if (this.rootSuite !== undefined) {
			this.collectNodesByIdRec(this.rootSuite);
		}
	}

	private collectNodesByIdRec(node: TreeNode): void {

		if (!this.idCount.get(node.info.id)) {

			node.uniqueId = `${this.id}:${node.info.id}_1`;
			this.nodesById.set(node.info.id, node);
			this.idCount.set(node.info.id, 1);

		} else {

			const count = this.idCount.get(node.info.id)! + 1;
			node.uniqueId = `${this.id}:${node.info.id}_${count}`;
			this.idCount.set(node.info.id, count);

			const errorMessage = 'There are multiple tests with the same ID, Test Explorer will not be able to show test results for these tests.';

			if (node instanceof TestNode) {
				node.setCurrentState('duplicate', errorMessage);
			}

			const otherNode = this.nodesById.get(node.info.id);
			if (otherNode) {
				this.nodesById.delete(node.info.id);
				if (otherNode instanceof TestNode) {
					otherNode.setCurrentState('duplicate', errorMessage);
				}
			}
		}

		for (const child of node.children) {
			this.collectNodesByIdRec(child);
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

		if ((node.fileUri === undefined) || (node.info.line === undefined)) return;

		let fileLocatedNodes = this.locatedNodes.get(node.fileUri);
		if (!fileLocatedNodes) {
			fileLocatedNodes = new Map<number, TreeNode[]>()
			this.locatedNodes.set(node.fileUri, fileLocatedNodes);
		}

		let lineLocatedNodes = fileLocatedNodes.get(node.info.line);
		if (!lineLocatedNodes) {
			lineLocatedNodes = [];
			fileLocatedNodes.set(node.info.line, lineLocatedNodes);
		}

		lineLocatedNodes.push(node);
	}
}
