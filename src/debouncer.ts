import * as vscode from 'vscode';
import { TreeNode } from "./tree/treeNode";
import { TestCollection } from './tree/testCollection';

export class TreeEventDebouncer {

	private timeout: NodeJS.Timer | undefined;

	constructor(
		private readonly collections: TestCollection[],
		private readonly treeDataChanged: vscode.EventEmitter<TreeNode>
	) {}

	sendNodeChangedEvents(immediately: boolean): void {

		if (immediately) {

			if (this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = undefined;
			}

			this.sendNodeChangedEventsNow();

		} else if (!this.timeout) {

			this.timeout = setTimeout(() => {
				this.timeout = undefined;
				this.sendNodeChangedEventsNow();
			}, 200);

		}
	}

	sendTreeChangedEvent(): void {

		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}

		this.treeDataChanged.fire();
	}

	private sendNodeChangedEventsNow(): void {

		const changedNodes: TreeNode[] = [];
		for (const collection of this.collections) {
			if (collection.suite) {
				collection.suite.recalcState();
				changedNodes.push(...this.collectChangedNodes(collection.suite));
			}
		}

		for (const node of changedNodes) {
			this.treeDataChanged.fire(node);
		}
	}

	private collectChangedNodes(node: TreeNode): TreeNode[] {

		if (node.neededUpdates === 'send') {

			this.resetNeededUpdates(node);
			return [ node ];

		} else {

			const nodesToSend: TreeNode[] = [];

			for (const child of node.children) {
				nodesToSend.push(...this.collectChangedNodes(child));
			}
	
			return nodesToSend;
		}
	}

	private resetNeededUpdates(node: TreeNode): void {

		node.neededUpdates = 'none';

		for (const child of node.children) {
			this.resetNeededUpdates(child);
		}
	}
}
