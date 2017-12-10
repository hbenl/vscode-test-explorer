import * as vscode from 'vscode';
import { TestNode } from './testNode';
import { NodeState } from './state';
import { TestCollection } from './testCollection';
import { TestSuiteNode } from './testSuiteNode';
import { TestTreeInfo } from '../adapter/api';

export type TreeNodeUpdates = 'none' | 'send' | 'recalc';

export interface TreeNode {
	readonly info: TestTreeInfo;
	readonly state: NodeState;
	neededUpdates: TreeNodeUpdates;
	readonly log: string | undefined;
	readonly collection: TestCollection;
	readonly parent: TestSuiteNode | undefined;
	readonly children: TreeNode[];
	deprecateState(): void;
	collectTestNodes(testNodes: Map<string, TestNode>, filter?: (n: TestNode) => boolean): void;
	getTreeItem(): vscode.TreeItem;
}
