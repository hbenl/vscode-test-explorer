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
	private description?: string;
	private tooltip?: string;

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
		oldNodesById?: Map<string, TreeNode>
	) {

		this.fileUri = normalizeFilename(info.file);

		this.description = info.description;
		this.tooltip = info.tooltip;

		this._children = info.children.map(childInfo => {
			if (childInfo.type === 'test') {
				return new TestNode(collection, childInfo, this, oldNodesById);
			} else {
				return new TestSuiteNode(collection, childInfo, this, oldNodesById);
			}
		});

		this._state = parentNodeState(this._children);
	}

	update(description?: string, tooltip?: string) {
		if (description !== undefined) {
			this.description = description;
		}
		if (tooltip !== undefined) {
			this.tooltip = tooltip;
		}
		if ((this.neededUpdates === 'none') && ((description !== undefined) || (tooltip !== undefined))) {
			this.neededUpdates = 'send';
		}
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

			// if ((this.state.current !== newCurrentNodeState) ||
			// 	(this.state.previous !== newPreviousNodeState) ||
			// 	(this.state.autorun !== newAutorunFlag)
			// ) {
	
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
		
			// } else {

			// 	this.neededUpdates = 'none';

			// }
		}
	}

	retireState(): void {

		for (const child of this._children) {
			child.retireState();
		}

		this.neededUpdates = 'recalc';
	}

	resetState(): void {

		this.description = this.info.description;
		this.tooltip = this.info.tooltip;

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
		treeItem.description = this.description;
		treeItem.tooltip = this.tooltip;

		return treeItem;
	}
}
