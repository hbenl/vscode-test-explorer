import * as vscode from 'vscode';
import { TestItem } from './adapter/api';
import { parentItemState, stateIconPath, parentCurrentItemState } from './state';
import { IconPaths } from './iconPaths';
import { TreeEventDebouncer } from './debouncer';

export type CurrentItemState = 'pending' | 'scheduled' | 'running' | 'passed' | 'failed';

export type PreviousItemState = 'passed' | 'failed' | 'other';

export interface ItemState {
	current: CurrentItemState,
	previous: PreviousItemState
};

export class TestExplorerTree {

	private _root: TreeItem;

	public get root() { return this._root; }
	public readonly itemsById = new Map<string, TreeItem>();

	private constructor(
		public readonly debouncer: TreeEventDebouncer,
		public readonly iconPaths: IconPaths
	) {}

	static from(
		testItem: TestItem,
		oldTree: TestExplorerTree | undefined,
		debouncer: TreeEventDebouncer,
		iconPaths: IconPaths
	): TestExplorerTree {

		const tree = new TestExplorerTree(debouncer, iconPaths);
		const oldItemsById = oldTree ? oldTree.itemsById : undefined;
		tree._root = TreeItem.from(testItem, undefined, tree, oldItemsById);

		return tree;
	}
}

export class TreeItem extends vscode.TreeItem {

	private _state: ItemState;
	private _children: TreeItem[];

	public get state() { return this._state; }
	public get children() { return this._children; }

	private constructor(
		public readonly testItem: TestItem,
		public readonly parent: TreeItem | undefined,
		public readonly tree: TestExplorerTree
	) {
		super(testItem.label);
	}

	static from(
		testItem: TestItem,
		parent: TreeItem | undefined,
		tree: TestExplorerTree,
		oldItemsById: Map<string, TreeItem> | undefined
	): TreeItem {

		let treeItem: TreeItem;

		if (testItem.type === 'suite') {

			treeItem = new TreeItem(testItem, parent, tree);
			treeItem._children = testItem.children.map(
				(child) => TreeItem.from(child, treeItem, tree, oldItemsById));
			treeItem._state = parentItemState(treeItem.children);
			treeItem.iconPath = stateIconPath(treeItem._state, tree.iconPaths);
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;

		} else {

			treeItem = new TreeItem(testItem, parent, tree);
			treeItem._children = [];
			const oldItem = oldItemsById ? oldItemsById.get(testItem.id) : undefined;
			treeItem._state = oldItem ? oldItem.state : { current: 'pending', previous: 'other' };
			treeItem.iconPath = stateIconPath(treeItem._state, tree.iconPaths);
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;

		}

		tree.itemsById.set(testItem.id, treeItem);

		return treeItem;
	}

	setCurrentState(currentState: CurrentItemState) {

		this.state.current = currentState;
		this.iconPath = stateIconPath(this.state, this.tree.iconPaths);

		if (this.parent) {
			this.parent.childStateChanged(this);
		}

		this.tree.debouncer.itemChanged(this);
	}

	childStateChanged(child: TreeItem) {
		if (!this.parent) return; // the root item doesn't maintain a state since it isn't visible

		const oldState = this.state.current;
		const newState = parentCurrentItemState(this.children);

		if (newState !== oldState) {
			this.setCurrentState(newState);
		}
	}

	shiftState() {

		if (this.testItem.type === 'test') {

			if ((this.state.current === 'passed') || (this.state.current === 'failed')) {
				this._state = { current: 'pending', previous: this.state.current };
			}

		} else {

			for (const child of this.children) {
				child.shiftState();
			}
			this._state = parentItemState(this.children);

		}

		this.iconPath = stateIconPath(this.state, this.tree.iconPaths);
	}

	collectTestIds(): string[] {

		if (this.testItem.type === 'suite') {

			let testIds: string[] = [];
			for (const child of this.children) {
				testIds.push(...child.collectTestIds());
			}
			return testIds;

		} else {

			return [ this.testItem.id ];

		}
	}
}
