import * as vscode from 'vscode';
import { TestInfo } from "../adapter/api";
import { TreeNode } from "./treeNode";
import { NodeState, stateIconPath, CurrentNodeState, defaultState } from "./state";
import { TestSuiteNode } from './testSuiteNode';
import { TestCollection } from './testCollection';

export class TestNode implements TreeNode {

	private _state: NodeState;
	private _log: string = "";

	get state(): NodeState { return this._state; }
	neededUpdates: 'send' | 'none' = 'none';
	get log(): string { return this._log; }
	readonly children: TreeNode[] = [];

	constructor(
		public readonly collection: TestCollection,
		public readonly info: TestInfo,
		public readonly parent: TestSuiteNode | undefined,
		oldNodesById: Map<string, TreeNode> | undefined
	) {
		const oldNode = oldNodesById ? oldNodesById.get(info.id) : undefined;
		if (oldNode) {
			this._state = oldNode.state;
			this._log = oldNode.log || "";
		} else {
			this._state = defaultState();
		}
	}

	setCurrentState(currentState: CurrentNodeState, logMessage?: string): void {

		this.state.current = currentState;

		if ((currentState === 'passed') || (currentState === 'failed')) {
			this.state.previous = currentState;
		}

		if (currentState === 'scheduled') {
			this._log = "";
		}

		if (logMessage) {
			this._log += logMessage + "\n";
		}

		this.neededUpdates = 'send';
		let ancestor = this.parent;
		while (ancestor) {
			ancestor.neededUpdates = 'recalc';
			ancestor = ancestor.parent;
		}

		this.collection.sendNodeChangedEvents();
	}

	outdateState(): void {
		if ((this.state.current === 'passed') || (this.state.current === 'failed')) {
			this._state.current = 'pending';
			this.neededUpdates = 'send';
		}
	}

	resetState(): void {
		if ((this.state.current !== 'pending') || (this.state.previous !== 'other')) {
			this._state.current = 'pending';
			this._state.previous = 'other';
			this.neededUpdates = 'send';
		}
	}

	collectTestNodes(testNodes: Map<string, TestNode>, filter?: (n: TestNode) => boolean): void {
		if ((filter === undefined) || filter(this)) {
			testNodes.set(this.info.id, this);
		}
	}

	getTreeItem(): vscode.TreeItem {

		this.neededUpdates = 'none';

		const treeItem = new vscode.TreeItem(this.info.label, vscode.TreeItemCollapsibleState.None);
		treeItem.iconPath = stateIconPath(this.state, this.collection.iconPaths);
		treeItem.contextValue = 'test';
		treeItem.command = {
			title: '',
			command: 'extension.test-explorer.selected',
			arguments: [ this ]
		};

		return treeItem;
	}
}
