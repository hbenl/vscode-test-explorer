import * as vscode from 'vscode';
import { TestSuiteInfo } from "../adapter/api";
import { TreeNode } from "./treeNode";
import { NodeState, stateIconPath, parentNodeState, parentCurrentNodeState, CurrentNodeState } from "./state";
import { TestCollectionNode } from './testCollectionNode';
import { TestNode } from './testNode';

export class TestSuiteNode implements TreeNode {

	private _state: NodeState;
	private _children: TreeNode[];

	get state(): NodeState { return this._state; }
	readonly log = undefined;
	get children(): TreeNode[] { return this._children; }

	constructor(
		public readonly collection: TestCollectionNode,
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

	setCurrentState(currentState: CurrentNodeState): void {

		this.state.current = currentState;

		if (this.parent) {
			this.parent.childStateChanged(this);
		}

		this.collection.nodeChanged(this);
	}

	deprecateState(): void {

		for (const child of this._children) {
			child.deprecateState();
		}

		this._state = parentNodeState(this._children);
	}

	setAutorun(autorun: boolean): void {
		this.state.autorun = autorun;
		for (const child of this.children) {
			child.setAutorun(autorun);
		}
	}

	childStateChanged(child: TreeNode): void {

		const oldState = this.state.current;
		const newState = parentCurrentNodeState(this._children);

		if (newState !== oldState) {
			this.setCurrentState(newState);
		}
	}

	collectTestNodes(testNodes: Map<string, TestNode>, filter?: (n: TestNode) => boolean): void {
		for (const child of this._children) {
			child.collectTestNodes(testNodes, filter);
		}
	}

	getTreeItem(): vscode.TreeItem {

		const treeItem = new vscode.TreeItem(this.info.label, vscode.TreeItemCollapsibleState.Expanded);
		treeItem.iconPath = stateIconPath(this.state, this.collection.iconPaths);
		treeItem.contextValue = (this.parent !== undefined) ? 'suite' : 'collection';

		return treeItem;
	}
}
