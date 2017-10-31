import * as vscode from 'vscode';
import { TestExplorer } from './explorer';
import { FakeAdapter } from './adapter/fake';

export function activate(context: vscode.ExtensionContext) {

	const testExplorer = new TestExplorer(new FakeAdapter());

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.reload', () => testExplorer.reload()
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.start', () => testExplorer.start()
	));

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'extension.test-explorer.tests', testExplorer
	));
}
