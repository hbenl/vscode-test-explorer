import * as vscode from 'vscode';
import { JasmineTestCollectionAdapter } from './adapter';
import { testExplorer } from '../../main';

export function initJasmine() {

	const adapters = new Map<vscode.WorkspaceFolder, JasmineTestCollectionAdapter>();

	if (vscode.workspace.workspaceFolders) {
		for (const workspaceFolder of vscode.workspace.workspaceFolders) {
			const adapter = new JasmineTestCollectionAdapter(workspaceFolder);
			adapters.set(workspaceFolder, adapter);
			testExplorer.registerCollection(adapter);
		}
	}

	vscode.workspace.onDidChangeWorkspaceFolders((event) => {

		for (const workspaceFolder of event.removed) {
			const adapter = adapters.get(workspaceFolder);
			if (adapter) {
				testExplorer.unregisterCollection(adapter);
				adapters.delete(workspaceFolder);
			}
		}

		for (const workspaceFolder of event.added) {
			const adapter = new JasmineTestCollectionAdapter(workspaceFolder);
			adapters.set(workspaceFolder, adapter);
			testExplorer.registerCollection(adapter);
		}
	});
}
