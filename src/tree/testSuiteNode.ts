import * as vscode from 'vscode';
import { TestSuiteInfo, TestStateMessage } from "../adapter/api";
import { TreeNode, TestExplorerTree, treeNodeFrom } from "./tree";
import { NodeState, stateIconPath, parentNodeState, parentCurrentNodeState, CurrentNodeState } from "./state";

export class TestSuiteNode implements TreeNode {

	private _state: NodeState;
	private _children: TreeNode[];

	public get state(): NodeState { return this._state; }

	public get children(): TreeNode[] { return this._children; }

	public get log(): undefined { return undefined; }

	private constructor(
		private readonly testSuiteInfo: TestSuiteInfo,
		public readonly parent: TestSuiteNode | undefined,
		private readonly tree: TestExplorerTree
	) {}

	static from(
		testSuiteInfo: TestSuiteInfo,
		parent: TestSuiteNode | undefined,
		tree: TestExplorerTree,
		oldNodesById: Map<string, TreeNode> | undefined
	): TestSuiteNode {

		const testSuiteNode = new TestSuiteNode(testSuiteInfo, parent, tree);
		testSuiteNode._children = testSuiteInfo.children.map(
			(child) => treeNodeFrom(child, testSuiteNode, tree, oldNodesById));
		testSuiteNode._state = parentNodeState(testSuiteNode._children);

		tree.nodesById.set(testSuiteInfo.id, testSuiteNode);

		return testSuiteNode;
	}

	setCurrentState(stateMessage: TestStateMessage | CurrentNodeState): void {

		if (typeof stateMessage === 'string') {
			this.state.current = stateMessage;
		} else {
			this.state.current = stateMessage.state;
		}

		if (this.parent) {
			this.parent.childStateChanged(this);
		}

		this.tree.debouncer.nodeChanged(this);
	}

	deprecateState(): void {

		for (const child of this._children) {
			child.deprecateState();
		}

		this._state = parentNodeState(this._children);
	}

	childStateChanged(child: TreeNode): void {
		if (!this.parent) return; // the root item doesn't maintain a state since it isn't visible

		const oldState = this.state.current;
		const newState = parentCurrentNodeState(this._children);

		if (newState !== oldState) {
			this.setCurrentState(newState);
		}
	}

	collectTestIds(): string[] {

		const testIds: string[] = [];

		for (const child of this._children) {
			testIds.push(...child.collectTestIds());
		}

		return testIds;
	}

	getTreeItem(): vscode.TreeItem {

		const treeItem = new vscode.TreeItem(this.testSuiteInfo.label, vscode.TreeItemCollapsibleState.Expanded);
		treeItem.iconPath = stateIconPath(this.state, this.tree.iconPaths);

		return treeItem;
	}
}
