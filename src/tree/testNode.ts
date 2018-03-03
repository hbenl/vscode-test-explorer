import * as vscode from 'vscode';
import { TestInfo } from "../adapter/api";
import { TreeNode, TreeNodeUpdates } from "./treeNode";
import { NodeState, stateIconPath, CurrentNodeState, defaultState } from "./state";
import { TestSuiteNode } from './testSuiteNode';
import { TestCollection } from './testCollection';

export class TestNode implements TreeNode {

	private _state: NodeState;
	private _log: string = "";

	get state(): NodeState { return this._state; }
	neededUpdates: TreeNodeUpdates = 'none';
	get log(): string { return this._log; }
	readonly children: TreeNode[] = [];

	constructor(
		public readonly collection: TestCollection,
		public readonly info: TestInfo,
		public readonly parent: TestSuiteNode,
		oldNode?: TestNode
	) {
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
		let ancestor: TestSuiteNode | undefined = this.parent;
		while (ancestor) {
			ancestor.neededUpdates = 'recalc';
			ancestor = ancestor.parent;
		}

		this.collection.sendNodeChangedEvents();
	}

	recalcState(autorun: boolean): void {
		if (this.neededUpdates !== 'recalc') return;

		const newAutorunFlag = autorun || (this.collection.autorunNode === this);

		if (this.state.autorun !== newAutorunFlag) {

			this.state.autorun = newAutorunFlag;
			this.neededUpdates = 'send';

		} else {
			this.neededUpdates = 'none';
		}
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

	getPath(): string[] {
		const path = this.parent.getPath();
		path.push(this.info.id);
		return path;
	}
}
