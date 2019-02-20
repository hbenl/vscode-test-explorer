import * as vscode from 'vscode';
import { TestSuiteInfo } from 'vscode-test-adapter-api';
import { TreeNode, TreeNodeUpdates } from "./treeNode";
import { NodeState, stateIcon, parentNodeState, parentCurrentNodeState, parentPreviousNodeState, parentAutorunFlag } from "./state";
import { TestCollection } from './testCollection';
import { TestNode } from './testNode';
import { normalizeFilename } from '../util';

export class TestSuiteNode implements TreeNode {

	private _state: NodeState;
	private _children: TreeNode[];

	readonly fileUri: string | undefined;
	uniqueId: string;
	get state(): NodeState { return this._state; }
	neededUpdates: TreeNodeUpdates = 'none';
	readonly log = undefined;
	get children(): TreeNode[] { return this._children; }

	constructor(
		public readonly collection: TestCollection,
		public readonly info: TestSuiteInfo,
		public readonly parent: TestSuiteNode | undefined,
		testOrderingStrategy: 'orderByAdapter' | 'orderByAlphabet' | 'orderByLocation',
		oldNodesById?: Map<string, TreeNode>
	) {

		this.fileUri = normalizeFilename(info.file);

		this._children = [];

		for (let i = 0; i < info.children.length; ++i) {

			let node: TestNode | TestSuiteNode;

			{
				const childInfo = info.children[i];
				if (childInfo.type === 'test') {
					node = new TestNode(collection, childInfo, this, oldNodesById);
				} else {
					node = new TestSuiteNode(collection, childInfo, this, testOrderingStrategy, oldNodesById);
				}
			}

			let index = -1;

			switch (testOrderingStrategy) {
				default:
				case 'orderByAdapter':
					break;

				case 'orderByAlphabet': {
					index = this._children.findIndex(n => {
						return node.info.label.localeCompare(n.info.label) < 0;
					});
					break;
				}

				case 'orderByLocation': {
					/**
					 * Strategy explanation:
					 *   1. suites before tests
					 *   2. suites ordered by label
					 *   3. tests with file and line come before tests without file or line
					 *   4. tests with file ordered by file and sub-ordered by line
					 */
					index = this._children.findIndex(n => {
						if (node.info.type !== n.info.type) {
							return node.info.type === 'suite';
						} else if (node.info.type === 'suite') {
							return node.info.label.localeCompare(n.info.label) < 0;
						} else {
							if (node.fileUri && node.info.line) {
								if (n.fileUri && n.info.line) {
									const fileComp = node.fileUri.localeCompare(n.fileUri);
									if (fileComp !== 0) {
										return fileComp < 0;
									} else {
										return node.info.line < n.info.line;
									}
								} else {
									return true;
								}
							} else {
								return false;
							}
						}
					});
					break;
				}
			}

			if (index === -1) index = this._children.length;

			this._children.splice(index, 0, node);
		}

		this._state = parentNodeState(this._children);
	}

	recalcState(): void {

		for (const child of this.children) {
			if (child instanceof TestSuiteNode) {
				child.recalcState();
			}
		}

		if (this.neededUpdates === 'recalc') {

			const newCurrentNodeState = parentCurrentNodeState(this.children);
			const newPreviousNodeState = parentPreviousNodeState(this.children);
			const newAutorunFlag = parentAutorunFlag(this.children);

			if ((this.state.current !== newCurrentNodeState) ||
				(this.state.previous !== newPreviousNodeState) ||
				(this.state.autorun !== newAutorunFlag)
			) {
	
				this.state.current = newCurrentNodeState;
				this.state.previous = newPreviousNodeState;
				this.state.autorun = newAutorunFlag;
				this.neededUpdates = 'send';
				if (this.parent) {
					this.parent.neededUpdates = 'recalc';
				}
				if (this.fileUri) {
					this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
				}
		
			} else {

				this.neededUpdates = 'none';

			}
		}
	}

	retireState(): void {

		for (const child of this._children) {
			child.retireState();
		}

		this.neededUpdates = 'recalc';
	}

	resetState(): void {

		for (const child of this._children) {
			child.resetState();
		}

		this.neededUpdates = 'recalc';
	}

	setAutorun(autorun: boolean): void {

		for (const child of this._children) {
			child.setAutorun(autorun);
		}

		this.neededUpdates = 'recalc';
	}

	getTreeItem(): vscode.TreeItem {

		if (this.neededUpdates === 'recalc') {
			this.recalcState();
		}
		this.neededUpdates = 'none';

		let label = this.info.label;
		if ((this.parent === undefined) && this.collection.adapter.workspaceFolder &&
			vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1)) {
			label = `${this.collection.adapter.workspaceFolder.name} - ${label}`;
		}

		const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
		treeItem.id = this.uniqueId;
		treeItem.iconPath = this.collection.explorer.iconPaths[stateIcon(this.state)];
		treeItem.contextValue = this.parent ? (this.fileUri ? 'suiteWithSource' : 'suite') : 'collection';

		return treeItem;
	}
}
