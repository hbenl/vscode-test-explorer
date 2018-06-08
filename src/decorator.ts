import * as vscode from 'vscode';
import { TestExplorer } from './testExplorer';
import { stateIcon } from './tree/state';

export class Decorator {

	private activeTextEditor: vscode.TextEditor | undefined;
	private timeout: NodeJS.Timer | undefined;

	constructor(
		context: vscode.ExtensionContext,
		private readonly testExplorer: TestExplorer
	) {
		context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
			this.activeTextEditor = editor;
			this.updateDecorationsNow();
		}));

		this.activeTextEditor = vscode.window.activeTextEditor;
	}

	updateDecorationsFor(file: string): void {

		if (!this.timeout && this.activeTextEditor &&
			(this.activeTextEditor.document.fileName === file)) {

			this.timeout = setTimeout(() => this.updateDecorationsNow(), 200);
		}
	}

	updateDecorationsNow(): void {
		this.timeout = undefined;
		if (!this.activeTextEditor) return;

		const file = this.activeTextEditor.document.fileName;
		const decorationTypes = this.testExplorer.decorationTypes;

		const decorations = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
		for (const decorationType of decorationTypes.all) {
			decorations.set(decorationType, []);
		}

		for (const collection of this.testExplorer.collections) {
			if (collection.shouldShowGutterDecoration()) {
				const locatedNodes = collection.getLocatedNodes(file);
				if (locatedNodes) {
					for (const [ line, treeNodes ] of locatedNodes) {
						for (const treeNode of treeNodes) {
							if (treeNode.info.type === 'test') {
								const decorationType = decorationTypes[stateIcon(treeNodes[0].state)];
								decorations.get(decorationType)!.push(new vscode.Range(line, 0, line, 0));
								break;
							}
						}
					}
				}
			}
		}

		for (const [ decorationType, ranges ] of decorations) {
			this.activeTextEditor.setDecorations(decorationType, ranges);
		}
	}
}
