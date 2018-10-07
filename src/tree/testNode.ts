import * as vscode from 'vscode';
import { TestInfo, TestDecoration } from "vscode-test-adapter-api";
import { TreeNode } from "./treeNode";
import { NodeState, stateIcon, CurrentNodeState, defaultState } from "./state";
import { TestSuiteNode } from './testSuiteNode';
import { TestCollection } from './testCollection';

export class TestNode implements TreeNode {

	private _state: NodeState;
	private _log: string = "";
	private _decorations: TestDecoration[] = [];

	get state(): NodeState { return this._state; }
	neededUpdates: 'none' | 'send' = 'none';
	get log(): string { return this._log; }
	get decorations(): TestDecoration[] { return this._decorations; }
	readonly children: TreeNode[] = [];

	constructor(
		public readonly collection: TestCollection,
		public readonly info: TestInfo,
		public readonly parent: TestSuiteNode,
		oldNodesById?: Map<string, TreeNode>
	) {

		const oldNode = oldNodesById ? oldNodesById.get(info.id) : undefined;
		if (oldNode && (oldNode.info.type === 'test')) {

			let currentState = oldNode.state.current;
			if (info.skipped) {
				currentState = 'skipped';
			}

			this._state = {
				current: currentState,
				previous: oldNode.state.previous,
				autorun: oldNode.state.autorun
			}
			this._log = oldNode.log || "";

		} else {

			this._state = defaultState(info.skipped);
			this._log = "";

		}
	}

	setCurrentState(
		currentState: CurrentNodeState,
		logMessage?: string,
		decorations?: TestDecoration[]
	): void {

		this.state.current = currentState;

		if ((currentState === 'passed') || (currentState === 'failed')) {
			this.state.previous = currentState;
		}

		if (currentState === 'scheduled') {
			this._log = "";
			this._decorations = [];
		}

		if (logMessage) {
			this._log += logMessage + "\n";
		}

		if (decorations) {
			this._decorations = this._decorations.concat(decorations);
		}

		this.neededUpdates = 'send';
		if (this.parent) {
			this.parent.neededUpdates = 'recalc';
		}

		this.collection.sendNodeChangedEvents();

		if (this.info.file) {
			this.collection.explorer.decorator.updateDecorationsFor(this.info.file);
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

		this._log = "";

		if (((this.state.current !== 'pending') && (this.state.current !== 'skipped')) ||
			((this.state.previous !== 'pending') && (this.state.previous !== 'skipped'))) {

			this._state.current = 'pending';
			this._state.previous = 'pending';
			this.neededUpdates = 'send';
			this._decorations = [];

			if (this.info.file) {
				this.collection.explorer.decorator.updateDecorationsFor(this.info.file);
			}

		} else if (this._decorations.length > 0) {

			this._decorations = [];

			if (this.info.file) {
				this.collection.explorer.decorator.updateDecorationsFor(this.info.file);
			}
		}
	}

	setAutorun(autorun: boolean): void {
		this._state.autorun = autorun;
		this.neededUpdates = 'send';
	}

	getTreeItem(): vscode.TreeItem {

		this.neededUpdates = 'none';

		const treeItem = new vscode.TreeItem(this.info.label, vscode.TreeItemCollapsibleState.None);
		treeItem.id = this.info.id;
		treeItem.iconPath = this.collection.explorer.iconPaths[stateIcon(this.state)];
		treeItem.contextValue = this.info.file ? 'testWithSource' : 'test';
		treeItem.command = {
			title: '',
			command: 'test-explorer.show-error',
			arguments: [ this.log ]
		};

		return treeItem;
	}
}
