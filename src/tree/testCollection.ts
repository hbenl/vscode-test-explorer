import * as vscode from 'vscode';
import { TestSuiteNode } from './testSuiteNode';
import { TestCollectionAdapter } from '../adapter/api';
import { TestNode } from './testNode';
import { TestExplorer } from '../explorer';
import { TreeNode } from './treeNode';

export class TestCollection {

	private _suite: TestSuiteNode | undefined;

	readonly testNodes = new Map<string, TestNode>();
	get suite() { return this._suite; }
	get iconPaths() { return this.explorer.iconPaths; }

	constructor(
		public readonly adapter: TestCollectionAdapter,
		private readonly explorer: TestExplorer
	) {

		adapter.tests((testSuiteInfo) => {

			if (testSuiteInfo) {

				this._suite = new TestSuiteNode(this, testSuiteInfo, undefined, this.testNodes);
				this.testNodes.clear();
				this._suite.collectTestNodes(this.testNodes);

				if (this.shouldOutdateStateOnReload()) {
					this._suite.outdateState();
				}

			} else {
				this._suite = undefined;
				this.testNodes.clear();
			}

			explorer.sendTreeChangedEvent();
		});

		adapter.testStates((testStateMessage) => {

			const node = this.testNodes.get(testStateMessage.testId);
			if (!node) return;

			node.setCurrentState(testStateMessage.state, testStateMessage.message);
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

		} else if (this._suite) {

			this._suite.outdateState();

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

		} else if (this._suite) {

			this._suite.resetState();

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
