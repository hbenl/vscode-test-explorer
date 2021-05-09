import * as vscode from 'vscode';
import { TestHub as ITestHub} from 'vscode-test-adapter-api';
import { TestHub } from './hub/testHub';
import { TestExplorer, HideWhenSetting } from './testExplorer';
import { runTestsInFile, runTestAtCursor, debugTestAtCursor, expand } from './util';

export function activate(context: vscode.ExtensionContext): ITestHub {

	const hub = new TestHub();
	const testExplorer = new TestExplorer(context);

	const workspaceFolders = vscode.workspace.workspaceFolders;
	const workspaceUri = (workspaceFolders !== undefined && workspaceFolders.length > 0) ? workspaceFolders[0].uri : undefined;
	const configuration = vscode.workspace.getConfiguration('testExplorer', workspaceUri);
	const expandLevels = configuration.get<number>('showExpandButton') || 0;
	const showCollapseAll = configuration.get<boolean>('showCollapseButton');
	const addToEditorContextMenu = configuration.get<boolean>('addToEditorContextMenu');
	const hideWhen = configuration.get<HideWhenSetting>('hideWhen');

	if (configuration.get('useNativeTesting')) {
		testExplorer.disabled = true;
		testExplorer.updateVisibility();
		setTimeout(() => vscode.commands.executeCommand('testExplorerConverter.activate'), 0);
	} else {
		hub.registerTestController(testExplorer);
	}

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(configChange => {
		if (configChange.affectsConfiguration('testExplorer.showExpandButton') ||
			configChange.affectsConfiguration('testExplorer.showCollapseButton')) {
			vscode.window.showInformationMessage('The change will take effect when you restart Visual Studio Code');
		}
		if (configChange.affectsConfiguration('testExplorer.addToEditorContextMenu')) {
			const configuration = vscode.workspace.getConfiguration('testExplorer', workspaceUri);
			const addToEditorContextMenu = configuration.get<boolean>('addToEditorContextMenu');
			vscode.commands.executeCommand('setContext', 'showTestExplorerEditorContextMenu', addToEditorContextMenu);
		}
		if (configChange.affectsConfiguration('testExplorer.hideWhen')) {
			const configuration = vscode.workspace.getConfiguration('testExplorer', workspaceUri);
			const hideWhen = configuration.get<HideWhenSetting>('hideWhen');
			testExplorer.hideWhen = (hideWhen !== undefined) ? hideWhen : 'never';
			testExplorer.updateVisibility();
		}
		if (configChange.affectsConfiguration('testExplorer.useNativeTesting')) {
			const configuration = vscode.workspace.getConfiguration('testExplorer', workspaceUri);
			const useNativeTesting = configuration.get('useNativeTesting');
			if (useNativeTesting) {
				hub.unregisterTestController(testExplorer);
				testExplorer.disabled = true;
				testExplorer.updateVisibility();
				vscode.commands.executeCommand('testExplorerConverter.activate');
			} else {
				testExplorer.disabled = false;
				testExplorer.updateVisibility();
				hub.registerTestController(testExplorer);
			}
		}
	}));

	vscode.commands.executeCommand('setContext', 'showTestExplorerExpandButton', (expandLevels > 0));
	vscode.commands.executeCommand('setContext', 'showTestExplorerEditorContextMenu', addToEditorContextMenu);
	testExplorer.hideWhen = (hideWhen !== undefined) ? hideWhen : 'never';
	testExplorer.updateVisibility();

	const treeView = vscode.window.createTreeView('test-explorer', { treeDataProvider: testExplorer, showCollapseAll, canSelectMany: true });
	context.subscriptions.push(treeView);

	const documentSelector = { scheme: '*', pattern: '**/*' };
	context.subscriptions.push(vscode.languages.registerCodeLensProvider(documentSelector, testExplorer));
	context.subscriptions.push(vscode.languages.registerHoverProvider(documentSelector, testExplorer));

	const registerCommand = (command: string, callback: (...args: any[]) => any) => {
		context.subscriptions.push(vscode.commands.registerCommand(command, callback));
	};

	registerCommand('test-explorer.reload', () => testExplorer.reload());

	registerCommand('test-explorer.reload-collection', (node) => testExplorer.reload(node));

	registerCommand('test-explorer.reloading', () => {});

	registerCommand('test-explorer.run-all', () => testExplorer.run());

	registerCommand('test-explorer.run', (clickedNode, allNodes) => testExplorer.run(allNodes || [ clickedNode ], false));

	registerCommand('test-explorer.pick-and-run', (nodes) => testExplorer.run(nodes, true));

	registerCommand('test-explorer.rerun', () => testExplorer.rerun());

	registerCommand('test-explorer.run-file', (file?: string) => runTestsInFile(file, testExplorer));

	registerCommand('test-explorer.run-test-at-cursor', () => runTestAtCursor(testExplorer));

	registerCommand('test-explorer.run-this-file', (fileUri: vscode.Uri) => runTestsInFile(fileUri.toString(), testExplorer));

	registerCommand('test-explorer.run-this-test', () => runTestAtCursor(testExplorer));

	registerCommand('test-explorer.cancel', () => testExplorer.cancel());

	registerCommand('test-explorer.debug', (node) => testExplorer.debug([ node ]));

	registerCommand('test-explorer.pick-and-debug', (nodes) => testExplorer.debug(nodes));

	registerCommand('test-explorer.redebug', () => testExplorer.redebug());

	registerCommand('test-explorer.debug-test-at-cursor', () => debugTestAtCursor(testExplorer));

	registerCommand('test-explorer.debug-this-test', () => debugTestAtCursor(testExplorer));

	registerCommand('test-explorer.show-log', (nodes) => testExplorer.showLog(nodes));

	registerCommand('test-explorer.show-error', (message) => testExplorer.showError(message));

	registerCommand('test-explorer.show-source', (node) => testExplorer.showSource(node));

	registerCommand('test-explorer.enable-autorun', (node) => testExplorer.setAutorun(node));

	registerCommand('test-explorer.disable-autorun', (node) => testExplorer.clearAutorun(node));

	registerCommand('test-explorer.retire', (node) => testExplorer.retireState(node));

	registerCommand('test-explorer.reset', (node) => testExplorer.resetState(node));

	registerCommand('test-explorer.reveal', (node) => testExplorer.reveal(node, treeView));

	registerCommand('test-explorer.expand', () => expand(testExplorer, treeView, expandLevels));

	registerCommand('test-explorer.sort-by-label', () => testExplorer.setSortBy('byLabel'));

	registerCommand('test-explorer.sort-by-location', () => testExplorer.setSortBy('byLocation'));

	registerCommand('test-explorer.sort-by-label-with-suites-first', () => testExplorer.setSortBy('byLabelWithSuitesFirst'));

	registerCommand('test-explorer.sort-by-location-with-suites-first', () => testExplorer.setSortBy('byLocationWithSuitesFirst'));

	registerCommand('test-explorer.dont-sort', () => testExplorer.setSortBy(null));

	return {
		registerAdapter: adapter => hub.registerAdapter(adapter),
		unregisterAdapter: adapter => hub.unregisterAdapter(adapter),
		registerTestAdapter: adapter => hub.registerTestAdapter(adapter),
		unregisterTestAdapter: adapter => hub.unregisterTestAdapter(adapter),
		registerTestController: controller => hub.registerTestController(controller),
		unregisterTestController: controller => hub.unregisterTestController(controller)
	}
}
