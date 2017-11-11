import * as vscode from 'vscode';
import { TestExplorer } from './explorer';
import { MochaAdapter } from './adapter/mocha/adapter';

export function activate(context: vscode.ExtensionContext) {

	const testExplorer = new TestExplorer(context, new MochaAdapter());

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.reload', () => testExplorer.reload()
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.start', (item) => testExplorer.start(item)
	));

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'extension.test-explorer.tests', testExplorer
	));
}
