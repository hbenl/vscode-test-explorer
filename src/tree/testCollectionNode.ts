import * as vscode from 'vscode';
import { TestSuiteNode } from './testSuiteNode';
import { TestCollectionAdapter } from '../adapter/api';
import { TestNode } from './testNode';
import { TestExplorer } from '../explorer';
import { TreeNode } from './treeNode';
import { CurrentNodeState, NodeState, defaultState } from './state';

export class TestCollectionNode implements TreeNode {

	private _suite: TestSuiteNode | undefined;

	readonly testNodes = new Map<string, TestNode>();
	get suite() { return this._suite; }
	get iconPaths() { return this.explorer.iconPaths; }
	get state(): NodeState { return this._suite ? this._suite.state : defaultState(); }
	readonly log = undefined;
	readonly collection = this;
	readonly parent = undefined;
	get children() { return this._suite ? this._suite.children : []; }

	constructor(
		public readonly adapter: TestCollectionAdapter,
		private readonly explorer: TestExplorer
	) {

		adapter.tests((testSuiteInfo) => {

			this._suite = testSuiteInfo ? new TestSuiteNode(this, testSuiteInfo, undefined, this.testNodes) : undefined;

			this.testNodes.clear();
			this.collectTestNodes(this.testNodes);

			explorer.nodeChanged(this);
		});

		adapter.testStates((testStateMessage) => {

			const node = this.testNodes.get(testStateMessage.testId);
			if (!node) return;

			node.setCurrentState(testStateMessage.state, testStateMessage.message);
		});

		adapter.autorun(() => this.explorer.autorun(this));

		this.adapter.reloadTests();
	}

	setCurrentState(currentState: CurrentNodeState): void {
		if (this._suite) {
			this._suite.setCurrentState(currentState);
		}
	}

	deprecateState(): void {
		if (this._suite) {
			this._suite.deprecateState();
		}
	}

	getTreeItem(): vscode.TreeItem {
		if (this._suite) {
			return this._suite.getTreeItem();
		} else {
			return new vscode.TreeItem('');
		}
	}

	nodeChanged(node: TreeNode): void {
		this.explorer.nodeChanged(node);
	}

	setAutorun(autorun: boolean): void {
		if (this._suite) {
			this._suite.setAutorun(autorun);
		}
	}

	collectTestNodes(testNodes: Map<string, TestNode>, filter?: (n: TestNode) => boolean): void {
		if (this._suite) {
			this._suite.collectTestNodes(testNodes, filter);
		}
	}
}
