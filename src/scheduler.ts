import * as vscode from 'vscode';
import { TreeNode } from "./tree/treeNode";
import { TestNode } from "./tree/testNode";
import { TestExplorer } from "./explorer";


export class TestRunScheduler {

	private pendingTestRuns: TreeNode[] = [];
	private currentTestRun: [TreeNode, Promise<void>] | undefined;

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
			this.currentTestRun[0].collection.adapter.cancelTests();
			await this.currentTestRun[1];
		}
	}

	private doNext() {
		if (this.currentTestRun) return;

		const node = this.pendingTestRuns.shift();
		if (!node) return;

		this.runTests(node);
	}

	private async runTests(node: TreeNode) {

		const testNodes = new Map<string, TestNode>();
		node.collectTestNodes(testNodes);

		if (testNodes.size === 0) {
			this.doNext();
			return;
		}

		node.collection.deprecateState();
		for (const testNode of testNodes.values()) {
			testNode.setCurrentState('scheduled');
		}
		this.explorer.nodeChanged(node.collection);

		vscode.commands.executeCommand('setContext', 'testsRunning', true);

		const testRunPromise = node.collection.adapter.startTests([...testNodes.keys()]);
		this.currentTestRun = [node, testRunPromise];

		await testRunPromise;

		this.currentTestRun = undefined;

		vscode.commands.executeCommand('setContext', 'testsRunning', false);

		for (const testNode of testNodes.values()) {
			if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
				testNode.setCurrentState('pending');
			}
		}

		this.doNext();
	}
}