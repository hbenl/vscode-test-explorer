import * as vscode from 'vscode';
import { TestExplorer } from './explorer';

export function activate(context: vscode.ExtensionContext) {

	const testExplorer = new TestExplorer();

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'extension.test-explorer.tests', testExplorer
	));
}
