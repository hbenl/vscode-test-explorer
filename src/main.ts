import * as vscode from 'vscode';
import { TestExplorer } from './explorer';
import { MochaAdapter } from './adapter/mocha/adapter';

export function activate(context: vscode.ExtensionContext) {

	const outputChannel = vscode.window.createOutputChannel("Test Explorer");
	context.subscriptions.push(outputChannel);

	const testExplorer = new TestExplorer(context, outputChannel, new MochaAdapter());

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.reload', () => testExplorer.reload()
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.start', (node) => testExplorer.start(node)
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.selected', (node) => testExplorer.selected(node)
	));

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'extension.test-explorer.tests', testExplorer
	));
}
