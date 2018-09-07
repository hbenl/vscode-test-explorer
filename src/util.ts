import * as vscode from 'vscode';
import * as RegExpEscape from 'escape-string-regexp';
import { TestExplorer } from './testExplorer';
import { TreeNode } from './tree/treeNode';
import { TestNode } from './tree/testNode';

export function* allTests(treeNode: TreeNode): IterableIterator<TestNode> {
	if (treeNode.info.type === 'suite') {
		for (const child of treeNode.children) {
			yield* allTests(child);
		}
	} else {
		yield <TestNode>treeNode;
	}
}

export function runTestsInFile(file: string | undefined, testExplorer: TestExplorer): void {

	if (!file && vscode.window.activeTextEditor) {
		file = uriToFile(vscode.window.activeTextEditor.document.uri);
	}

	if (file) {
		for (const collection of testExplorer.collections) {
			if (collection.suite) {
				const found = findFileNode(file, collection.suite);
				if (found) {
					testExplorer.run([ found ]);
					return;
				}
			}
		}
	}
}

function findFileNode(file: string, searchNode: TreeNode): TreeNode | undefined {

	if (searchNode.info.file) {

		if (searchNode.info.file === file) {
			return searchNode;
		} else {
			return undefined;
		}

	} else {

		for (const childNode of searchNode.children) {
			const found = findFileNode(file, childNode);
			if (found) {
				return found;
			}
		}
	}

	return undefined;
}

export function runTestAtCursor(testExplorer: TestExplorer): void {

	const editor = vscode.window.activeTextEditor;
	if (editor) {

		const nodes = findNodesLocatedAboveCursor(
			uriToFile(editor.document.uri),
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
			uriToFile(editor.document.uri),
			editor.selection.active.line,
			testExplorer
		);

		if (nodes.length > 0) {
			testExplorer.debug(nodes);
		}
	}
}

function findNodesLocatedAboveCursor(file: string, cursorLine: number, testExplorer: TestExplorer): TreeNode[] {

	let currentLine = -1;
	let currentNodes: TreeNode[] = [];

	for (const collection of testExplorer.collections) {

		const locatedNodes = collection.getLocatedNodes(file);
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

export async function pickNode(nodes: TreeNode[]): Promise<TreeNode | undefined> {

	if (nodes.length === 1) {

		return nodes[0];

	} else if (nodes.length > 1) {

		const labels = nodes.map(node => node.info.label);
		const pickedLabel = await vscode.window.showQuickPick(labels);
		return nodes.find(node => (node.info.label === pickedLabel));
		
	} else {
		return undefined;
	}
}

export function createRunCodeLens(line: number, nodes: TreeNode[]): vscode.CodeLens {

	const range = new vscode.Range(line, 0, line, 0);

	return new vscode.CodeLens(range, {
		title: 'Run',
		command: 'test-explorer.run',
		arguments: nodes
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

const schemeMatcher = /^[a-z][a-z0-9+-.]+:/;
export function fileToUri(file: string): vscode.Uri {
	if (schemeMatcher.test(file)) {
		return vscode.Uri.parse(file);
	} else {
		return vscode.Uri.file(file);
	}
}

export function uriToFile(uri: vscode.Uri): string {
	if (uri.scheme === 'file') {
		return uri.path;
	} else {
		return uri.toString();
	}
}
