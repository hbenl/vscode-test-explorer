import * as vscode from 'vscode';
import { TreeNode } from "./tree/treeNode";
import { TestNode } from "./tree/testNode";
import { TestExplorer } from "./testExplorer";
import { TestCollection } from './tree/testCollection';


export class TestRunScheduler {

	private pendingTestRuns: TreeNode[] = [];
	private currentTestRun: [TestCollection, Promise<void>] | undefined;

	constructor(
		private readonly explorer: TestExplorer
	) {}

	schedule(node: TreeNode): void {
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
		if (this.currentTestRun) return;

		const treeNode = this.pendingTestRuns.shift();
		if (!treeNode) return;

		this.runTests(treeNode);
	}

	private async runTests(treeNode: TreeNode) {

		const collection = treeNode.collection;

		if (collection.shouldRetireStateOnStart()) {
			collection.retireState();
		}
		const testNodes: TestNode[] = [];
		this.collectTests(treeNode, testNodes);
		for (const testNode of testNodes) {
			testNode.setCurrentState('scheduled');
		}
		this.explorer.sendNodeChangedEvents(false);

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