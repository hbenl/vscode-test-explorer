import * as vscode from 'vscode';
import { TestInfo } from "../adapter/api";
import { TreeNode } from "./treeNode";
import { NodeState, stateIconPath, CurrentNodeState } from "./state";
import { TestSuiteNode } from './testSuiteNode';
import { TestCollectionNode } from './testCollectionNode';

export class TestNode implements TreeNode {

	private _state: NodeState;
	private _log: string = "";

	get state(): NodeState { return this._state; }
	get log(): string { return this._log; }
	readonly children: TreeNode[] = [];

	constructor(
		public readonly collection: TestCollectionNode,
		public readonly info: TestInfo,
		public readonly parent: TestSuiteNode | undefined,
		oldNodesById: Map<string, TreeNode> | undefined
	) {
		const oldNode = oldNodesById ? oldNodesById.get(info.id) : undefined;
		this._state = oldNode ? oldNode.state : { current: 'pending', previous: 'other' };
	}

	setCurrentState(currentState: CurrentNodeState, logMessage?: string): void {

		this.state.current = currentState;

		if (logMessage) {
			this._log += logMessage + "\n";
		}

		if (this.parent) {
			this.parent.childStateChanged(this);
		}

		this.collection.nodeChanged(this);
	}

	deprecateState(): void {

		if ((this.state.current === 'passed') || (this.state.current === 'failed')) {
			this._state = { current: 'pending', previous: this.state.current };
		}

		this._log = "";
	}

	collectTestNodes(testNodes: Map<string, TestNode>): void {
		testNodes.set(this.info.id, this);
	}

	getTreeItem(): vscode.TreeItem {

		const treeItem = new vscode.TreeItem(this.info.label, vscode.TreeItemCollapsibleState.None);
		treeItem.iconPath = stateIconPath(this.state, this.collection.iconPaths);
		treeItem.command = {
			title: '',
			command: 'extension.test-explorer.selected',
			arguments: [ this ]
		};

		return treeItem;
	}
}
