import * as vscode from 'vscode';
import { TestInfo, TestStateMessage } from "../adapter/api";
import { TreeNode, TestExplorerTree } from "./tree";
import { NodeState, stateIconPath, CurrentNodeState } from "./state";
import { TestSuiteNode } from './testSuiteNode';

export class TestNode implements TreeNode {

	private _log: string = "";

	public get state(): NodeState { return this._state; }

	public get children(): TreeNode[] { return []; }

	public get log(): string { return this._log; }

	private constructor(
		private readonly testInfo: TestInfo,
		private _state: NodeState,
		public readonly parent: TestSuiteNode | undefined,
		private readonly tree: TestExplorerTree
	) {}

	static from(
		testInfo: TestInfo,
		parent: TestSuiteNode | undefined,
		tree: TestExplorerTree,
		oldNodesById: Map<string, TreeNode> | undefined
	): TestNode {

		const oldNode = oldNodesById ? oldNodesById.get(testInfo.id) : undefined;
		const state: NodeState = oldNode ? oldNode.state : { current: 'pending', previous: 'other' };
		const testNode = new TestNode(testInfo, state, parent, tree);

		tree.nodesById.set(testInfo.id, testNode);

		return testNode;
	}

	setCurrentState(stateMessage: TestStateMessage | CurrentNodeState): void {

		if (typeof stateMessage === 'string') {

			this.state.current = stateMessage;

		} else {

			this.state.current = stateMessage.state;

			if (stateMessage.message) {
				this._log += stateMessage.message + "\n";
			}
		}

		if (this.parent) {
			this.parent.childStateChanged(this);
		}

		this.tree.debouncer.nodeChanged(this);
	}

	deprecateState(): void {

		if ((this.state.current === 'passed') || (this.state.current === 'failed')) {
			this._state = { current: 'pending', previous: this.state.current };
		}

		this._log = "";
	}

	collectTestIds(): string[] {

		return [ this.testInfo.id ];

	}

	getTreeItem(): vscode.TreeItem {

		const treeItem = new vscode.TreeItem(this.testInfo.label, vscode.TreeItemCollapsibleState.None);
		treeItem.iconPath = stateIconPath(this.state, this.tree.iconPaths);
		treeItem.command = {
			title: '',
			command: 'extension.test-explorer.selected',
			arguments: [ this ]
		};

		return treeItem;
	}
}
