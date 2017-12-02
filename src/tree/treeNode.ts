import * as vscode from 'vscode';
import { TestNode } from './testNode';
import { NodeState, CurrentNodeState } from './state';
import { TestCollectionNode } from './testCollectionNode';

export interface TreeNode {
	readonly state: NodeState;
	readonly log: string | undefined;
	readonly collection: TestCollectionNode;
	readonly parent: TreeNode | undefined;
	readonly children: TreeNode[];
	setCurrentState(currentState: CurrentNodeState, logMessage?: string): void;
	deprecateState(): void;
	collectTestNodes(testNodes: Map<string, TestNode>): void;
	getTreeItem(): vscode.TreeItem;
}
