import * as vscode from 'vscode';
import { TestTreeInfo, TestInfo, TestSuiteInfo } from './adapter/api';
import { parentNodeState, stateIconPath, parentCurrentNodeState } from './state';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './debouncer';

export type CurrentNodeState = 'pending' | 'scheduled' | 'running' | 'passed' | 'failed';

export type PreviousNodeState = 'passed' | 'failed' | 'other';

export interface NodeState {
	current: CurrentNodeState,
	previous: PreviousNodeState
};

export interface TreeNode {
	readonly state: NodeState;
	readonly parent: TestSuiteNode | undefined;
	readonly children: TreeNode[];
	setCurrentState(currentState: CurrentNodeState): void;
	deprecateState(): void;
	collectTestIds(): string[];
	getTreeItem(): vscode.TreeItem;
}

export class TestExplorerTree {

	private _root: TreeNode;

	public get root() { return this._root; }
	public readonly nodesById = new Map<string, TreeNode>();

	private constructor(
		public readonly debouncer: TreeEventDebouncer,
		public readonly iconPaths: IconPaths
	) {}

	static from(
		testTreeInfo: TestTreeInfo,
		oldTree: TestExplorerTree | undefined,
		debouncer: TreeEventDebouncer,
		iconPaths: IconPaths
	): TestExplorerTree {

		const tree = new TestExplorerTree(debouncer, iconPaths);
		const oldNodesById = oldTree ? oldTree.nodesById : undefined;
		tree._root = treeNodeFrom(testTreeInfo, undefined, tree, oldNodesById);

		return tree;
	}
}

function treeNodeFrom(
	testTreeInfo: TestTreeInfo,
	parent: TestSuiteNode | undefined,
	tree: TestExplorerTree,
	oldNodesById: Map<string, TreeNode> | undefined
): TreeNode {

	if (testTreeInfo.type === 'test') {
		return TestNode.from(testTreeInfo, parent, tree, oldNodesById);
	} else {
		return TestSuiteNode.from(testTreeInfo, parent, tree, oldNodesById);
	}

}

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

export class TestSuiteNode implements TreeNode {

	private _state: NodeState;
	private _children: TreeNode[];

	public get state(): NodeState { return this._state; }

	public get children(): TreeNode[] { return this._children; }

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

	setCurrentState(currentState: CurrentNodeState): void {

		this.state.current = currentState;

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
