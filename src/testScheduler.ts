import * as vscode from 'vscode';
import { TreeNode } from "./tree/treeNode";
import { TestNode } from "./tree/testNode";
import { TestExplorer } from "./testExplorer";
import { TestCollection } from './tree/testCollection';

export class TestScheduler {

	private pendingReloads: TestCollection[] = [];
	private currentReload: TestCollection | undefined;
	private pendingTestRuns: TreeNode[] = [];
	private currentTestRun: [TestCollection, Promise<void>] | undefined;

	constructor(
		private readonly explorer: TestExplorer
	) {}

	scheduleReload(collection: TestCollection): void {
		this.pendingReloads.push(collection);
		this.doNext();
	}

	scheduleTestRun(node: TreeNode): void {
		this.pendingTestRuns.push(node);
		this.doNext();
	}

	async cancel(): Promise<void> {

		this.pendingTestRuns = [];

		if (this.currentTestRun) {
			this.currentTestRun[0].adapter.cancel();
			await this.currentTestRun[1];
		}
	}

	private doNext() {
		if (this.currentReload || this.currentTestRun) return;

		const collection = this.pendingReloads.shift();
		if (collection) {
			this.loadTests(collection);
			return;
		}

		const treeNode = this.pendingTestRuns.shift();
		if (treeNode) {
			this.runTests(treeNode);
			return;
		}
	}

	private async loadTests(collection: TestCollection): Promise<void> {

		this.currentReload = collection;

		try {
			await collection.loadTests();
		} catch(e) {
			vscode.window.showErrorMessage(`Error while loading tests: ${e}`);
		}

		this.currentReload = undefined;

		this.doNext();
	}

	private async runTests(treeNode: TreeNode): Promise<void> {

		const collection = treeNode.collection;

		if (collection.shouldRetireStateOnStart()) {
			collection.retireState();
		} else if (collection.shouldResetStateOnStart()) {
			collection.resetState();
		}

		collection.testRunStarting();

		const testNodes: TestNode[] = [];
		this.collectTests(treeNode, testNodes);
		for (const testNode of testNodes) {
			testNode.setCurrentState('scheduled');
		}
		this.explorer.treeEvents.sendNodeChangedEvents(false);

		vscode.commands.executeCommand('setContext', 'testsRunning', true);

		try {

			const testRunPromise = collection.adapter.run(treeNode.info);
			this.currentTestRun = [collection, testRunPromise];
	
			await testRunPromise;

		} catch(e) {
			vscode.window.showErrorMessage(`Error while running tests: ${e}`);
		}

		this.currentTestRun = undefined;

		vscode.commands.executeCommand('setContext', 'testsRunning', false);

		for (const testNode of testNodes) {
			if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
				testNode.setCurrentState('pending');
			}
		}

		collection.testRunFinished();

		this.doNext();
	}

	private collectTests(treeNode: TreeNode, testNodes: TestNode[]): void {
		if (treeNode.info.type === 'suite') {
			for (const child of treeNode.children) {
				this.collectTests(child, testNodes);
			}
		} else {
			testNodes.push(<TestNode>treeNode);
		}
	}
}