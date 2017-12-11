import * as vscode from 'vscode';

export type TestTreeInfo = TestInfo | TestSuiteInfo;

interface TestTreeInfoBase {
	type: string;
	id: string;
	label: string;
}

export interface TestSuiteInfo extends TestTreeInfoBase {
	type: 'suite';
	file?: string;
	line?: number;
	readonly children: TestTreeInfo[];
}

export interface TestInfo extends TestTreeInfoBase {
	type: 'test';
	file?: string;
	line?: number;
}

export interface TestStateMessage {
	testId: string;
	state: 'running' | 'passed' | 'failed';
	message?: string;
}

export interface TestCollectionAdapter {
	workspaceFolder?: vscode.WorkspaceFolder;
	readonly tests: vscode.Event<TestSuiteInfo | undefined>;
	reloadTests(): Promise<void>;
	readonly testStates: vscode.Event<TestStateMessage>;
	startTests(tests: string[]): Promise<void>;
	cancelTests(): void;
	debugTests(tests: string[]): void;
	readonly autorun: vscode.Event<void>;
}
