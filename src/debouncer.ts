import * as vscode from 'vscode';
import { TreeNode } from "./tree";

export class TreeEventDebouncer {

	private changedNodes = new Set<TreeNode>();
	private timeout: NodeJS.Timer | undefined;

	constructor(
		private readonly treeDataChanged: vscode.EventEmitter<TreeNode>
	) {}

	nodeChanged(node: TreeNode): void {

		if (!node.parent) {
			this.treeChanged();
			return;
		}

		this.changedNodes.add(node.parent);

		if (!this.timeout) {
			this.timeout = setTimeout(() => this.sendEvents(), 300);
		}
	}

	private treeChanged(): void {

		this.treeDataChanged.fire();

		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}

		this.changedNodes.clear();
	}

	private sendEvents(): void {

		for (const node of this.changedNodes) {
			if (!this.ancestorChanged(node)) {
				this.treeDataChanged.fire(node.parent ? node : undefined);
			}
		}

		this.changedNodes.clear();
		this.timeout = undefined;
	}

	private ancestorChanged(node: TreeNode): boolean {

		if (!node.parent) {
			return false;
		}

		return this.changedNodes.has(node.parent) || this.ancestorChanged(node.parent);
	}
}