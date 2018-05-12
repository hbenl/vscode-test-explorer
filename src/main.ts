import * as vscode from 'vscode';
import { TestExplorerExtension } from 'vscode-test-adapter-api';
import { TestExplorer } from './explorer';

export function activate(context: vscode.ExtensionContext): TestExplorerExtension {

	const testExplorer = new TestExplorer(context);

	const registerCommand = (command: string, callback: (...args: any[]) => any) => {
		context.subscriptions.push(vscode.commands.registerCommand(command, callback));
	};

	registerCommand('test-explorer.reload', () => testExplorer.reload());

	registerCommand('test-explorer.reload-collection', (collection) => testExplorer.reload(collection));

	registerCommand('test-explorer.start-all', () => testExplorer.start());

	registerCommand('test-explorer.start', (node) => testExplorer.start(node));

	registerCommand('test-explorer.cancel', () => testExplorer.cancel());

	registerCommand('test-explorer.debug', (node) => testExplorer.debug(node));

	registerCommand('test-explorer.selected', (node) => testExplorer.selected(node));

	registerCommand('test-explorer.show-source', (node) => testExplorer.showSource(node));

	registerCommand('test-explorer.enable-autorun', (node) => testExplorer.setAutorun(node));

	registerCommand('test-explorer.disable-autorun', (node) => testExplorer.clearAutorun(node));

	registerCommand('test-explorer.retire', (node) => testExplorer.retireState(node));

	registerCommand('test-explorer.reset', (node) => testExplorer.resetState(node));

	context.subscriptions.push(vscode.window.registerTreeDataProvider('test-explorer', testExplorer));

	return {
		registerAdapter: adapter => testExplorer.registerAdapter(adapter),
		unregisterAdapter: adapter => testExplorer.unregisterAdapter(adapter)
	}
}
