import * as vscode from 'vscode';
import { TreeNode } from "./tree/treeNode";
import { TestNode } from "./tree/testNode";
import { TestExplorer } from "./explorer";
import { TestCollectionNode } from './tree/testCollectionNode';


export class TestRunScheduler {

	private pendingTestRuns: TestNode[][] = [];
	private currentTestRun: [TestCollectionNode, Promise<void>] | undefined;

	constructor(
		private readonly explorer: TestExplorer
	) {}

	schedule(node: TreeNode, filter?: (n: TestNode) => boolean): void {

		const testNodes = new Map<string, TestNode>();
		node.collectTestNodes(testNodes, filter);

		if (testNodes.size > 0) {
			this.pendingTestRuns.push([...testNodes.values()]);
			this.doNext();
		}
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

		const testNodes = this.pendingTestRuns.shift();
		if (!testNodes) return;

		this.runTests(testNodes);
	}

	private async runTests(testNodes: TestNode[]) {

		const collection = testNodes[0]!.collection;
		collection.deprecateState();
		for (const testNode of testNodes) {
			testNode.setCurrentState('scheduled');
		}
		this.explorer.nodeChanged(collection);

		vscode.commands.executeCommand('setContext', 'testsRunning', true);

		const testIds = testNodes.map(testNode => testNode.info.id);
		const testRunPromise = collection.adapter.startTests(testIds);
		this.currentTestRun = [collection, testRunPromise];

		await testRunPromise;

		this.currentTestRun = undefined;

		vscode.commands.executeCommand('setContext', 'testsRunning', false);

		for (const testNode of testNodes) {
			if ((testNode.state.current === 'scheduled') || (testNode.state.current === 'running')) {
				testNode.setCurrentState('pending');
			}
		}

		this.doNext();
	}
}