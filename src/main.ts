import * as vscode from 'vscode';
import { TestExplorer } from './explorer';
import { FakeAdapter } from './adapter/fake';

export function activate(context: vscode.ExtensionContext) {

	const testExplorer = new TestExplorer(new FakeAdapter());

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'extension.test-explorer.tests', testExplorer
	));
}
