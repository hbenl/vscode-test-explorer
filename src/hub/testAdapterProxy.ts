import * as vscode from 'vscode';
import { TestAdapter, TestSuiteInfo, TestInfo, TestSuiteEvent, TestEvent, TestController } from "vscode-test-adapter-api";
import { Hub } from './hub';

export class TestAdapterProxy implements TestAdapter {

	constructor(
		readonly originalAdapter: TestAdapter,
		readonly controller: TestController,
		private readonly hub: Hub
	) {}

	get workspaceFolder(): vscode.WorkspaceFolder | undefined {
		return this.originalAdapter.workspaceFolder;
	}

	load(): Promise<TestSuiteInfo | undefined> {
		return this.originalAdapter.load();
	}

	get reload(): vscode.Event<void> | undefined {
		return this.originalAdapter.reload;
	}

	run(tests: TestSuiteInfo | TestInfo): Promise<void> {
		return this.originalAdapter.run(tests);
	}

	debug(tests: TestSuiteInfo | TestInfo): Promise<void> {
		return this.originalAdapter.debug(tests);
	}

	cancel(): void {
		this.originalAdapter.cancel();
	}

	get testStates(): vscode.Event<TestSuiteEvent | TestEvent> {
		return this.originalAdapter.testStates;
	}

	get autorun(): vscode.Event<void> | undefined {
		return this.originalAdapter.autorun;
	}

	dispose(): void {}
}
