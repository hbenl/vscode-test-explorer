import * as vscode from 'vscode';
import { TestInfo } from "../adapter/api";
import { TreeNode, TestExplorerTree } from "./tree";
import { NodeState, CurrentNodeState, stateIconPath } from "./state";
import { TestSuiteNode } from './testSuiteNode';

export class TestNode implements TreeNode {

	public get state(): NodeState { return this._state; }

	public get children(): TreeNode[] { return []; }

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

	setCurrentState(currentState: CurrentNodeState): void {

		this.state.current = currentState;

		if (this.parent) {
			this.parent.childStateChanged(this);
		}

		this.tree.debouncer.nodeChanged(this);
	}

	deprecateState(): void {

		if ((this.state.current === 'passed') || (this.state.current === 'failed')) {
			this._state = { current: 'pending', previous: this.state.current };
		}

	}

	collectTestIds(): string[] {

		return [ this.testInfo.id ];

	}

	getTreeItem(): vscode.TreeItem {

		const treeItem = new vscode.TreeItem(this.testInfo.label, vscode.TreeItemCollapsibleState.None);
		treeItem.iconPath = stateIconPath(this.state, this.tree.iconPaths);

		return treeItem;
	}
}
