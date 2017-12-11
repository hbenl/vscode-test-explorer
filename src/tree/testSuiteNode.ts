import * as vscode from 'vscode';
import { TestSuiteInfo } from "../adapter/api";
import { TreeNode, TreeNodeUpdates } from "./treeNode";
import { NodeState, stateIconPath, parentNodeState, parentCurrentNodeState, parentPreviousNodeState } from "./state";
import { TestCollection } from './testCollection';
import { TestNode } from './testNode';

export class TestSuiteNode implements TreeNode {

	private _state: NodeState;
	private _children: TreeNode[];

	get state(): NodeState { return this._state; }
	neededUpdates: TreeNodeUpdates = 'none';
	readonly log = undefined;
	get children(): TreeNode[] { return this._children; }

	constructor(
		public readonly collection: TestCollection,
		public readonly info: TestSuiteInfo,
		public readonly parent: TestSuiteNode | undefined,
		oldNodesById: Map<string, TreeNode> | undefined
	) {

		this._children = info.children.map((childInfo) => {
			if (childInfo.type === 'test') {
				return new TestNode(collection, childInfo, this, oldNodesById);
			} else {
				return new TestSuiteNode(collection, childInfo, this, oldNodesById);
			}
		});

		this._state = parentNodeState(this._children);
	}

	recalcState(): void {
		if (this.neededUpdates !== 'recalc') return;

		for (const child of this.children) {
			if (child instanceof TestSuiteNode) {
				child.recalcState();
			}
		}

		const newCurrentNodeState = parentCurrentNodeState(this.children);
		const newPreviousNodeState = parentPreviousNodeState(this.children);

		if ((this.state.current !== newCurrentNodeState) || (this.state.previous !== newPreviousNodeState)) {

			this.state.current = newCurrentNodeState;
			this.state.previous = newPreviousNodeState;
			this.neededUpdates = 'send';

		} else {
			this.neededUpdates = 'none';
		}
	}

	outdateState(): void {

		for (const child of this._children) {
			child.outdateState();
		}

		this.neededUpdates = 'recalc';
	}

	resetState(): void {

		if ((this.state.current !== 'pending') || (this.state.previous !== 'other') || (this.neededUpdates === 'recalc')) {

			this.state.current = 'pending';
			this.state.previous = 'other';

			for (const child of this._children) {
				child.resetState();
			}

			this.neededUpdates = 'send';
		}
	}

	collectTestNodes(testNodes: Map<string, TestNode>, filter?: (n: TestNode) => boolean): void {
		for (const child of this._children) {
			child.collectTestNodes(testNodes, filter);
		}
	}

	getTreeItem(): vscode.TreeItem {

		if (this.neededUpdates === 'send') {
			this.neededUpdates = 'none';
		}

		const treeItem = new vscode.TreeItem(this.info.label, vscode.TreeItemCollapsibleState.Collapsed);
		treeItem.iconPath = stateIconPath(this.state, this.collection.iconPaths);
		treeItem.contextValue = (this.parent !== undefined) ? 'suite' : 'collection';

		return treeItem;
	}
}
