import * as vscode from 'vscode';
import { TreeNode } from "./tree/treeNode";
import { TestNode } from "./tree/testNode";
import { TestCollection } from './tree/testCollection';

export class TestScheduler {

	private pendingReloads: TestCollection[] = [];
	private currentReload: TestCollection | undefined;
	private pendingTestRuns: TreeNode[] = [];
	private currentTestRun: [TestCollection, Promise<void>] | undefined;

	scheduleReload(collection: TestCollection): void {

		this.pendingReloads.push(collection);

		this.doNext();
	}

	scheduleTestRun(node: TreeNode): void {

		this.pendingTestRuns.push(node);

		for (const testNode of this.collectTests(node)) {
			testNode.setCurrentState('scheduled');
		}

		this.doNext();
	}

	async cancel(): Promise<void> {

		for (const treeNode of this.pendingTestRuns) {
			for (const testNode of this.collectTests(treeNode)) {
				if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
					testNode.setCurrentState('pending');
				}
			}
		}
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

		vscode.commands.executeCommand('setContext', 'testsLoading', true);

		this.currentReload = collection;

		try {
			await collection.loadTests();
		} catch(e) {
			vscode.window.showErrorMessage(`Error while loading tests: ${e}`);
		}

		this.currentReload = undefined;

		vscode.commands.executeCommand('setContext', 'testsLoading', false);

		this.doNext();
	}

	private async runTests(treeNode: TreeNode): Promise<void> {

		const collection = treeNode.collection;

		if (collection.shouldRetireStateOnStart()) {
			collection.retireState();
		} else if (collection.shouldResetStateOnStart()) {
			collection.resetState();
		}

		vscode.commands.executeCommand('setContext', 'testsRunning', true);
		collection.testRunStarting();

		try {

			const testRunPromise = collection.adapter.run(treeNode.info);
			this.currentTestRun = [collection, testRunPromise];
	
			await testRunPromise;

		} catch(e) {
			vscode.window.showErrorMessage(`Error while running tests: ${e}`);
		}

		this.currentTestRun = undefined;

		for (const testNode of this.collectTests(treeNode)) {
			if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
				testNode.setCurrentState('pending');
			}
		}

		collection.testRunFinished();
		vscode.commands.executeCommand('setContext', 'testsRunning', false);

		this.doNext();
	}

	private *collectTests(treeNode: TreeNode): IterableIterator<TestNode> {
		if (treeNode.info.type === 'suite') {
			for (const child of treeNode.children) {
				yield* this.collectTests(child);
			}
		} else {
			yield <TestNode>treeNode;
		}
	}
}
