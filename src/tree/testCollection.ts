import * as vscode from 'vscode';
import { TestSuiteNode } from './testSuiteNode';
import { TestCollectionAdapter } from '../adapter/api';
import { TestNode } from './testNode';
import { TestExplorer } from '../explorer';
import { TreeNode } from './treeNode';

export class TestCollection {

	private rootSuite: TestSuiteNode | undefined;
	private runningSuite: TestSuiteNode | undefined;

	get suite() { return this.rootSuite; }
	get iconPaths() { return this.explorer.iconPaths; }

	constructor(
		public readonly adapter: TestCollectionAdapter,
		private readonly explorer: TestExplorer
	) {

		adapter.tests((testSuiteInfo) => {

			if (testSuiteInfo) {

				this.rootSuite = new TestSuiteNode(this, testSuiteInfo, undefined, this.rootSuite);

				if (this.shouldOutdateStateOnReload()) {
					this.rootSuite.outdateState();
				}

			} else {

				this.rootSuite = undefined;

			}

			explorer.sendTreeChangedEvent();
		});

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
								testSuiteNode = new TestSuiteNode(this, testStateMessage.suite, this.runningSuite);
							}
						}

						if (testSuiteNode !== undefined) {
							this.runningSuite = testSuiteNode;
						}

					}

				} else { // testStateMessage.state === 'completed'

					if (this.runningSuite !== undefined) {
						this.runningSuite = this.runningSuite.parent;
					}

				}

			} else { // testStateMessage.type === 'test'

				if (this.runningSuite !== undefined) {

					const testId = (typeof testStateMessage.test === 'string') ? testStateMessage.test : testStateMessage.test.id;
					let testNode = this.runningSuite.findChildTestNode(testId);

					if (testNode === undefined) {
						if (typeof testStateMessage.test === 'object') {
							testNode = new TestNode(this, testStateMessage.test, this.runningSuite);
							this.runningSuite.children.push(testNode);
						}
					}

					if (testNode !== undefined) {
						testNode.setCurrentState(testStateMessage.state, testStateMessage.message);
					}
				}
			}

			this.sendNodeChangedEvents();
		});

		adapter.autorun(() => this.explorer.autorun(this));

		this.adapter.reloadTests();
	}

	outdateState(node?: TreeNode): void {

		if (node) {

			node.outdateState();

			let ancestor = node.parent;
			while (ancestor) {
				ancestor.neededUpdates = 'recalc';
				ancestor = ancestor.parent;
			}

		} else if (this.rootSuite) {

			this.rootSuite.outdateState();

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

	setAutorun(node: TreeNode, autorun: boolean): void {

		this.setAutorunRecursively(node, autorun);

		let ancestor = node.parent;
		while (ancestor) {
			if (ancestor.neededUpdates === 'none') {
				ancestor.neededUpdates = 'send';
			}
			ancestor = ancestor.parent;
		}

		this.explorer.sendNodeChangedEvents(true);
	}

	sendNodeChangedEvents(): void {
		this.explorer.sendNodeChangedEvents(false);
	}

	shouldOutdateStateOnStart(): boolean {
		return this.getConfiguration().get('outdateOnStart') || false;
	}

	shouldOutdateStateOnReload(): boolean {
		return this.getConfiguration().get('outdateOnReload') || false;
	}

	private getConfiguration(): vscode.WorkspaceConfiguration {
		const workspaceFolder = this.adapter.workspaceFolder;
		var workspaceUri = workspaceFolder ? workspaceFolder.uri : undefined;
		return vscode.workspace.getConfiguration('testExplorer', workspaceUri);
	}

	private setAutorunRecursively(node: TreeNode, autorun: boolean): void {

		node.state.autorun = autorun;

		if (node.neededUpdates === 'none') {
			node.neededUpdates = 'send';
		}

		for (const child of node.children) {
			this.setAutorunRecursively(child, autorun);
		}
	}
}
