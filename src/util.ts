import * as vscode from 'vscode';
import * as RegExpEscape from 'escape-string-regexp';
import { TestExplorer } from './testExplorer';
import { TreeNode } from './tree/treeNode';
import { TestNode } from './tree/testNode';
import { ErrorNode } from './tree/errorNode';
import { TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';

export function* allTests(treeNode: TreeNode): IterableIterator<TestNode> {
	if (treeNode.info.type === 'suite') {
		for (const child of treeNode.children) {
			yield* allTests(child);
		}
	} else {
		yield <TestNode>treeNode;
	}
}

export function isAncestor(node: TreeNode, otherNode: TreeNode | undefined): boolean {
	return !!otherNode && ((node === otherNode) || isAncestor(node, otherNode.parent));
}

export function intersect(mainNode: TreeNode, nodes: TreeNode[]): TreeNode[] {
	
	for (const node of nodes) {
		if (isAncestor(node, mainNode)) {
			return [ mainNode ];
		}
	}

	return nodes.filter(node => isAncestor(mainNode, node));
}

export function runTestsInFile(fileUri: string | undefined, testExplorer: TestExplorer): void {

	if (!fileUri && vscode.window.activeTextEditor) {
		fileUri = vscode.window.activeTextEditor.document.uri.toString();
	}

	if (fileUri) {
		for (const collection of testExplorer.collections.values()) {
			if (collection.suite) {
				const found = findFileNodes(fileUri, collection.suite);
				if (found.length > 0) {
					testExplorer.run(found, false);
					return;
				}
			}
		}
	}
}

function findFileNodes(fileUri: string, searchNode: TreeNode): TreeNode[] {

	if (searchNode.fileUri) {

		if (searchNode.fileUri === fileUri) {
			return [ searchNode ];
		} else {
			return [];
		}

	} else {

		return ([] as TreeNode[]).concat(...searchNode.children.map(childNode => findFileNodes(fileUri, childNode)));

	}
}

export function runTestAtCursor(testExplorer: TestExplorer): void {

	const editor = vscode.window.activeTextEditor;
	if (editor) {

		const nodes = findNodesLocatedAboveCursor(
			editor.document.uri.toString(),
			editor.selection.active.line,
			testExplorer
		);

		if (nodes.length > 0) {
			testExplorer.run(nodes);
		}
	}
}

export function debugTestAtCursor(testExplorer: TestExplorer): void {

	const editor = vscode.window.activeTextEditor;
	if (editor) {

		const nodes = findNodesLocatedAboveCursor(
			editor.document.uri.toString(),
			editor.selection.active.line,
			testExplorer
		);

		if (nodes.length > 0) {
			testExplorer.debug(nodes);
		}
	}
}

function findNodesLocatedAboveCursor(fileUri: string, cursorLine: number, testExplorer: TestExplorer): TreeNode[] {

	let currentLine = -1;
	let currentNodes: TreeNode[] = [];

	for (const collection of testExplorer.collections.values()) {

		const locatedNodes = collection.getLocatedNodes(fileUri);
		if (locatedNodes) {
			
			for (const line of locatedNodes.keys()) {
				if ((line > cursorLine) || (line < currentLine)) continue;

				const lineNodes = locatedNodes.get(line)!;

				if (line === currentLine) {

					currentNodes.push(...lineNodes);

				} else { // line > currentLine

					currentLine = line;
					currentNodes = [...lineNodes];
				}
			}
		}
	}

	return currentNodes;
}

export function findLineContaining(needle: string, haystack: string | undefined): number | undefined {

	if (!haystack) return undefined;

	const index = haystack.search(RegExpEscape(needle));
	if (index < 0) return undefined;

	return haystack.substr(0, index).split('\n').length - 1;
}

export async function pickNodes(nodes: TreeNode[]): Promise<TreeNode[]> {

	if (nodes.length > 1) {

		const labels = nodes.map(node => node.info.label);
		labels.push("All of them");
		const pickedLabel = await vscode.window.showQuickPick(labels);

		if (pickedLabel === "All of them") {
			return nodes;
		} else {
			return nodes.filter(node => (node.info.label === pickedLabel));
		}

	} else {
		return nodes;
	}
}

export function createRunCodeLens(line: number, nodes: TreeNode[]): vscode.CodeLens {

	const range = new vscode.Range(line, 0, line, 0);

	return new vscode.CodeLens(range, {
		title: 'Run',
		command: 'test-explorer.run',
		arguments: [ nodes[0], nodes ]
	});
}

export function createDebugCodeLens(line: number, nodes: TreeNode[]): vscode.CodeLens {

	const range = new vscode.Range(line, 0, line, 0);

	return new vscode.CodeLens(range, {
		title: 'Debug',
		command: 'test-explorer.debug',
		arguments: nodes
	});
}

export function createLogCodeLens(line: number, nodes: TreeNode[]): vscode.CodeLens {

	const range = new vscode.Range(line, 0, line, 0);

	return new vscode.CodeLens(range, {
		title: 'Show Log',
		command: 'test-explorer.show-log',
		arguments: [ nodes ]
	});
}

export function createRevealCodeLens(line: number, node: TreeNode): vscode.CodeLens {

	const range = new vscode.Range(line, 0, line, 0);

	return new vscode.CodeLens(range, {
		title: 'Show in Test Explorer',
		command: 'test-explorer.reveal',
		arguments: [ node ]
	});
}

const schemeMatcher = /^[a-z][a-z0-9+-.]+:/;
export function normalizeFilename(file: string | undefined): string | undefined {
	if (file === undefined) return undefined;

	if (schemeMatcher.test(file)) {
		return vscode.Uri.parse(file).toString();
	} else {
		return vscode.Uri.file(file).toString();
	}
}

export function expand(testExplorer: TestExplorer, treeView: vscode.TreeView<TreeNode | ErrorNode>, levels: number): void {
	for (const node of testExplorer.getChildren()) {
		treeView.reveal(node, { expand: levels });
	}
}

export function groupSuitesByLabel(nodes: (TestSuiteInfo | TestInfo)[]): (TestSuiteInfo[] | TestInfo)[] {

	const grouped = new Map<string, TestSuiteInfo[] | TestInfo>();
	let testCount = 0;

	for (const node of nodes) {

		if (node.type === 'test') {

			const key = `t${testCount++}`;
			grouped.set(key, node);

		} else { // node.type === 'suite'

			const key = `s${node.label}`;
			if (!grouped.has(key)) {
				grouped.set(key, [ node ]);
			} else {
				(grouped.get(key) as TestSuiteInfo[]).push(node);
			}
		}
	}

	return [...grouped.values()];
}

export function mergeSuiteInfos(suites: TestSuiteInfo[]): TestSuiteInfo {

	if (suites.length === 1) {

		return suites[0];

	} else {

		return {
			type: 'suite',
			id: JSON.stringify(suites.map(suite => suite.id).sort()),
			label: suites[0].label,
			children: ([] as (TestSuiteInfo | TestInfo)[]).concat(...suites.map(suite => suite.children))
		}
	}
}

export function getAdapterIds(nodes: TreeNode[]): string[] {
	return ([] as string[]).concat(...nodes.map(node => node.adapterIds));
}
