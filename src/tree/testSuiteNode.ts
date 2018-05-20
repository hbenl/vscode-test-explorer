import * as vscode from 'vscode';
import { TestSuiteInfo } from "vscode-test-adapter-api";
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
		oldNode?: TestSuiteNode
	) {

		this._children = info.children.map(childInfo => {

			if (childInfo.type === 'test') {

				const oldChildNode = oldNode ? oldNode.findChildTestNode(childInfo.id) : undefined;
				return new TestNode(collection, childInfo, this, oldChildNode);

			} else {

				const oldChildNode = oldNode ? oldNode.findChildTestSuiteNode(childInfo.id) : undefined;
				return new TestSuiteNode(collection, childInfo, this, oldChildNode);
			}
		});

		this._state = parentNodeState(this._children);
	}

	recalcState(autorun: boolean): void {
		if (this.neededUpdates !== 'recalc') return;

		const newAutorunFlag = autorun || (this.collection.autorunNode === this);

		for (const child of this.children) {
			child.recalcState(newAutorunFlag);
		}

		const newCurrentNodeState = parentCurrentNodeState(this.children);
		const newPreviousNodeState = parentPreviousNodeState(this.children);

		if ((this.state.current !== newCurrentNodeState) ||
			(this.state.previous !== newPreviousNodeState) ||
			(this.state.autorun !== newAutorunFlag)
		) {

			this.state.current = newCurrentNodeState;
			this.state.previous = newPreviousNodeState;
			this.state.autorun = newAutorunFlag;
			this.neededUpdates = 'send';

		} else {
			this.neededUpdates = 'none';
		}
	}

	retireState(): void {

		for (const child of this._children) {
			child.retireState();
		}

		this.neededUpdates = 'recalc';
	}

	resetState(): void {

		if ((this.parent === undefined) || (this.state.current !== 'pending') ||
			(this.state.previous !== 'other') || (this.neededUpdates === 'recalc')) {

			this.state.current = 'pending';
			this.state.previous = 'other';

			for (const child of this._children) {
				child.resetState();
			}

			this.neededUpdates = 'send';
		}
	}

	getTreeItem(): vscode.TreeItem {

		if (this.neededUpdates === 'send') {
			this.neededUpdates = 'none';
		}

		let label = this.info.label;
		if ((this.parent === undefined) && this.collection.adapter.workspaceFolder &&
			vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1)) {
			label = `${this.collection.adapter.workspaceFolder.name} - ${label}`;
		}

		const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
		treeItem.iconPath = stateIconPath(this.state, this.collection.iconPaths);
		treeItem.contextValue = this.parent ? 'suite' : 'collection';

		return treeItem;
	}

	getPath(): string[] {
		if (this.parent === undefined) {
			return [];
		} else {
			const path = this.parent.getPath();
			path.push(this.info.id);
			return path;
		}
	}

	private findChildNode(type: 'suite' | 'test', id: string): TreeNode | undefined {
		return this.children.find(childNode =>
			(childNode.info.type === type) && (childNode.info.id === id));
	}

	findChildTestSuiteNode(id: string): TestSuiteNode | undefined {
		return <TestSuiteNode | undefined>this.findChildNode('suite', id);
	}

	findChildTestNode(id: string): TestNode | undefined {
		return <TestNode | undefined>this.findChildNode('test', id);
	}
}
