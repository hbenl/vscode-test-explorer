import * as vscode from 'vscode';
import { TestTreeInfo } from '../adapter/api';
import { TestNode } from './testNode';
import { TestSuiteNode } from './testSuiteNode';
import { NodeState, CurrentNodeState } from './state';
import { IconPaths } from '../iconPaths';
import { TreeEventDebouncer } from '../debouncer';

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

export interface TreeNode {
	readonly state: NodeState;
	readonly parent: TestSuiteNode | undefined;
	readonly children: TreeNode[];
	setCurrentState(currentState: CurrentNodeState): void;
	deprecateState(): void;
	collectTestIds(): string[];
	getTreeItem(): vscode.TreeItem;
}

export function treeNodeFrom(
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
