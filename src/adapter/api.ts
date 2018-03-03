import * as vscode from 'vscode';

export interface TestSuiteInfo {
	type: 'suite';
	id: string;
	label: string;
	file?: string;
	line?: number;
	children: (TestSuiteInfo | TestInfo)[];
}

export interface TestInfo {
	type: 'test';
	id: string;
	label: string;
	file?: string;
	line?: number;
}

export interface TestSuiteMessage {
	type: 'suite';
	suite: string | TestSuiteInfo;
	state: 'running' | 'completed';
}

export interface TestMessage {
	type: 'test';
	test: string | TestInfo;
	state: 'running' | 'passed' | 'failed' | 'skipped';
	message?: string;
}

export interface TestCollectionAdapter {
	workspaceFolder?: vscode.WorkspaceFolder;
	readonly tests: vscode.Event<TestSuiteInfo | undefined>;
	reloadTests(): Promise<void>;
	readonly testStates: vscode.Event<TestSuiteMessage | TestMessage>;
	startTests(path: string[]): Promise<void>;
	cancelTests(): void;
	debugTests(tests: string[]): void;
	readonly autorun: vscode.Event<void>;
}
