import * as vscode from 'vscode';
import { TestExplorer } from './explorer';
import { initMocha } from './adapter/mocha/adapterFactory';
import { initJasmine } from './adapter/jasmine/adapterFactory';

export let testExplorer: TestExplorer;

export function activate(context: vscode.ExtensionContext) {

	testExplorer = new TestExplorer(context);
	initMocha();
	initJasmine();

	const registerCommand = (command: string, callback: (...args: any[]) => any) => {
		context.subscriptions.push(vscode.commands.registerCommand(command, callback));
	};

	registerCommand('extension.test-explorer.reload', () => testExplorer.reload());

	registerCommand('extension.test-explorer.reload-collection', (collection) => testExplorer.reload(collection));

	registerCommand('extension.test-explorer.start', (node) => testExplorer.start(node));

	registerCommand('extension.test-explorer.cancel', () => testExplorer.cancel());

	registerCommand('extension.test-explorer.debug', (node) => testExplorer.debug(node));

	registerCommand('extension.test-explorer.selected', (node) => testExplorer.selected(node));

	registerCommand('extension.test-explorer.show-source', (node) => testExplorer.showSource(node));

	registerCommand('extension.test-explorer.enable-autorun', (node) => testExplorer.setAutorun(node));

	registerCommand('extension.test-explorer.disable-autorun', (node) => testExplorer.clearAutorun(node.collection));

	registerCommand('extension.test-explorer.outdate', (node) => testExplorer.outdateState(node));

	registerCommand('extension.test-explorer.reset', (node) => testExplorer.resetState(node));

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'extension.test-explorer.tests', testExplorer
	));
}
