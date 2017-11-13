import * as vscode from 'vscode';
import { TreeItem } from "./tree";

export class TreeEventDebouncer {

	private changedItems = new Set<TreeItem>();
	private timeout: NodeJS.Timer | undefined;

	constructor(
		private readonly treeDataChanged: vscode.EventEmitter<TreeItem>
	) {}

	itemChanged(item: TreeItem): void {

		if (!item.parent) {
			this.treeChanged();
			return;
		}

		this.changedItems.add(item.parent);

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

		this.changedItems.clear();
	}

	private sendEvents(): void {

		for (const item of this.changedItems) {
			if (!this.ancestorChanged(item)) {
				this.treeDataChanged.fire(item.parent ? item : undefined);
			}
		}

		this.changedItems.clear();
		this.timeout = undefined;
	}

	private ancestorChanged(item: TreeItem): boolean {

		if (!item.parent) {
			return false;
		}

		return this.changedItems.has(item.parent) || this.ancestorChanged(item.parent);
	}
}