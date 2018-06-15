import * as vscode from 'vscode';
import { TestInfo } from "vscode-test-adapter-api";
import { TreeNode, TreeNodeUpdates } from "./treeNode";
import { NodeState, stateIcon, CurrentNodeState, defaultState } from "./state";
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
		oldNodesById?: Map<string, TreeNode>
	) {
		const oldNode = oldNodesById ? oldNodesById.get(info.id) : undefined;
		if (oldNode && (oldNode.info.type === 'test')) {
			this._state = oldNode.state;
			this._log = oldNode.log || "";
		} else {
			this._state = defaultState(info.skipped);
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

		if (this.info.file) {
			this.collection.explorer.decorator.updateDecorationsFor(this.info.file);
		}
	}

	recalcState(autorun: boolean): void {
		if (this.neededUpdates !== 'recalc') return;

		const newAutorunFlag = autorun || (this.collection.autorunNode === this);

		if (this.state.autorun !== newAutorunFlag) {

			this.state.autorun = newAutorunFlag;
			this.neededUpdates = 'send';

			if (this.info.file) {
				this.collection.explorer.decorator.updateDecorationsFor(this.info.file);
			}
	
		} else {
			this.neededUpdates = 'none';
		}
	}

	retireState(): void {
		if ((this.state.current === 'passed') || (this.state.current === 'failed')) {

			this._state.current = 'pending';
			this.neededUpdates = 'send';

			if (this.info.file) {
				this.collection.explorer.decorator.updateDecorationsFor(this.info.file);
			}
		}
	}

	resetState(): void {
		if (((this.state.current !== 'pending') && (this.state.current !== 'skipped')) ||
			((this.state.previous !== 'pending') && (this.state.previous !== 'skipped'))) {

			this._state.current = 'pending';
			this._state.previous = 'pending';
			this.neededUpdates = 'send';

			if (this.info.file) {
				this.collection.explorer.decorator.updateDecorationsFor(this.info.file);
			}
		}
	}

	getTreeItem(): vscode.TreeItem {

		this.neededUpdates = 'none';

		const treeItem = new vscode.TreeItem(this.info.label, vscode.TreeItemCollapsibleState.None);
		treeItem.iconPath = this.collection.explorer.iconPaths[stateIcon(this.state)];
		treeItem.contextValue = 'test';
		treeItem.command = {
			title: '',
			command: 'test-explorer.selected',
			arguments: [ this ]
		};

		return treeItem;
	}
}
