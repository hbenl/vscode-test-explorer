import * as vscode from 'vscode';
import { TestExplorer } from './testExplorer';
import { stateIcon } from './tree/state';
import { StateDecorationTypes } from './stateDecorationTypes';
import { TestCollection } from './tree/testCollection';
import { allTests } from './util';

export class Decorator {

	private readonly stateDecorationTypes: StateDecorationTypes;
	private readonly errorDecorationType: vscode.TextEditorDecorationType;

	private activeTextEditor: vscode.TextEditor | undefined;
	private timeout: NodeJS.Timer | undefined;

	constructor(
		context: vscode.ExtensionContext,
		private readonly testExplorer: TestExplorer
	) {

		this.stateDecorationTypes = new StateDecorationTypes(this.testExplorer.iconPaths);
		this.errorDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: 'rgba(255,0,0,0.3)',
			isWholeLine: true,
			overviewRulerColor: 'rgba(255,0,0,0.3)',
		});

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

		const decorations = new Map<vscode.TextEditorDecorationType, vscode.DecorationOptions[]>();
		for (const decorationType of this.stateDecorationTypes.all) {
			decorations.set(decorationType, []);
		}
		decorations.set(this.errorDecorationType, []);

		for (const collection of this.testExplorer.collections) {
			this.addStateDecorations(collection, file, decorations);
			this.addErrorDecorations(collection, file, decorations);
		}

		for (const [ decorationType, decorationOptions ] of decorations) {
			this.activeTextEditor.setDecorations(decorationType, decorationOptions);
		}
	}

	private addStateDecorations(
		collection: TestCollection,
		file: string,
		decorations: Map<vscode.TextEditorDecorationType, vscode.DecorationOptions[]>
	): void {

		if (collection.shouldShowGutterDecoration()) {
			const locatedNodes = collection.getLocatedNodes(file);
			if (locatedNodes) {
				for (const [ line, treeNodes ] of locatedNodes) {
					for (const treeNode of treeNodes) {
						const decorationType = this.stateDecorationTypes[stateIcon(treeNode.state)];
						decorations.get(decorationType)!.push({
							range: new vscode.Range(line, 0, line, 0)
						});
						break;
					}
				}
			}
		}
	}

	private addErrorDecorations(
		collection: TestCollection,
		file: string,
		decorations: Map<vscode.TextEditorDecorationType, vscode.DecorationOptions[]>
	): void {

		if (collection.shouldShowErrorDecoration() && collection.suite) {
			for (const testNode of allTests(collection.suite)) {
				if (testNode.info.file === file) {
					for (const decoration of testNode.decorations) {
						decorations.get(this.errorDecorationType)!.push({
							range: new vscode.Range(decoration.line, 0, decoration.line, 0),
							renderOptions: {
								after: {
									contentText: ` // ${decoration.message}`
								}
							}
						});
					}
				}
			}
		}
	}
}
