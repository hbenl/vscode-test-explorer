import * as vscode from 'vscode';
import { TestInfo, TestDecoration } from "vscode-test-adapter-api";
import { TreeNode } from "./treeNode";
import { NodeState, stateIcon, CurrentNodeState, defaultState } from "./state";
import { TestSuiteNode } from './testSuiteNode';
import { TestCollection } from './testCollection';
import { normalizeFilename } from '../util';

export class TestNode implements TreeNode {

	private _state: NodeState;
	private _log: string = "";
	private _decorations: TestDecoration[] = [];

	readonly fileUri: string | undefined;
	uniqueId: string;
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

		this.fileUri = normalizeFilename(info.file);

		const oldNode = oldNodesById ? oldNodesById.get(info.id) : undefined;
		if (oldNode && (oldNode.info.type === 'test')) {

			let currentState = oldNode.state.current;
			if (info.skipped) {
				currentState = 'always-skipped';
			} else if ((currentState === 'always-skipped') || (currentState === 'duplicate')) {
				currentState = 'pending';
			}

			let previousState = oldNode.state.previous;
			if (info.skipped) {
				previousState = 'always-skipped';
			} else if ((previousState === 'always-skipped') || (previousState === 'duplicate')) {
				previousState = 'pending';
			}

			this._state = {
				current: currentState,
				previous: previousState,
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

		if ((currentState === 'passed') || (currentState === 'failed') ||
			(currentState === 'duplicate') || (currentState === 'errored') ||
			((currentState === 'skipped') && (this.state.previous !== 'always-skipped'))) {
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

		if (this.fileUri) {
			this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
		}
	}

	retireState(): void {

		if ((this.state.current === 'passed') || (this.state.current === 'failed') ||
			(this.state.current === 'skipped') || (this.state.current === 'errored')) {

			this._state.current = 'pending';
			this.neededUpdates = 'send';

			if (this.fileUri) {
				this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
			}
		}
	}

	resetState(): void {

		this._log = "";

		if ((this.state.current !== 'pending') && (this.state.current !== 'always-skipped') && (this.state.current !== 'duplicate')) {
			this._state.current = 'pending';
			this.neededUpdates = 'send';
		}

		if ((this.state.previous !== 'pending') && (this.state.previous !== 'always-skipped') && (this.state.previous !== 'duplicate')) {
			this._state.previous = 'pending';
			this.neededUpdates = 'send';
		}

		if (this._decorations.length > 0) {

			this._decorations = [];

			if (this.fileUri) {
				this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
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
		treeItem.id = this.uniqueId;
		treeItem.iconPath = this.collection.explorer.iconPaths[stateIcon(this.state)];
		treeItem.contextValue = this.fileUri ? 'testWithSource' : 'test';
		treeItem.command = {
			title: '',
			command: 'test-explorer.show-error',
			arguments: [ this.log ]
		};

		return treeItem;
	}
}
