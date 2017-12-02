import * as vscode from 'vscode';
import { TestExplorer } from './explorer';
import { initMocha } from './adapter/mocha/adapterFactory';

export let testExplorer: TestExplorer;

export function activate(context: vscode.ExtensionContext) {

	testExplorer = new TestExplorer(context);
	initMocha();

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.reload', () => testExplorer.reload()
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.start', (node) => testExplorer.start(node)
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.cancel', () => testExplorer.cancel()
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.debug', (node) => testExplorer.debug(node)
	));

	context.subscriptions.push(vscode.commands.registerCommand(
		'extension.test-explorer.selected', (node) => testExplorer.selected(node)
	));

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'extension.test-explorer.tests', testExplorer
	));
}
