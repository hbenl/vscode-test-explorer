import * as vscode from 'vscode';
import { TestAdapter, TestSuiteInfo, TestInfo, TestSuiteEvent, TestEvent, TestRunStartedEvent, TestRunFinishedEvent, TestLoadStartedEvent, TestLoadFinishedEvent, TestController } from 'vscode-test-adapter-api';
import { TestAdapter as LegacyTestAdapter } from 'vscode-test-adapter-api/out/legacy';
import { IDisposable } from '../util';
import { TestHub } from './testHub';

export class TestAdapterDelegateImpl implements TestAdapter {

	public readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
	public readonly testStatesEmitter = new vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>();

	private disposables: IDisposable[] = [];

	constructor(
		readonly adapter: LegacyTestAdapter,
		readonly controller: TestController,
		private readonly hub: TestHub
	) {
		this.disposables.push(this.testsEmitter);
		this.disposables.push(this.testStatesEmitter);

		this.disposables.push(
			this.adapter.testStates(event => this.testStatesEmitter.fire(event))
		);
	}

	get workspaceFolder(): vscode.WorkspaceFolder | undefined {
		return this.adapter.workspaceFolder;
	}

	async load(): Promise<void> {
		return this.hub.load(this.adapter);
	}

	async run(tests: TestSuiteInfo | TestInfo): Promise<void> {
		return this.hub.run(tests, this.adapter);
	}

	async debug(tests: TestSuiteInfo | TestInfo): Promise<void> {
		return this.hub.debug(tests, this.adapter);
	}

	cancel(): void {
		this.adapter.cancel();
	}

	get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
		return this.testsEmitter.event;
	}

	get testStates(): vscode.Event<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent> {
		return this.testStatesEmitter.event;
	}

	get autorun(): vscode.Event<void> | undefined {
		return this.adapter.autorun;
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
	}
}

export class TestAdapterDelegateImpl2 implements TestAdapter {

	public readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();

	private disposables: IDisposable[] = [];

	constructor(
		readonly adapter: TestAdapter,
		readonly controller: TestController
	) {
		this.disposables.push(this.testsEmitter);

		this.disposables.push(
			this.adapter.tests(event => this.testsEmitter.fire(event))
		);
	}

	get workspaceFolder(): vscode.WorkspaceFolder | undefined {
		return this.adapter.workspaceFolder;
	}

	load(): Promise<void> {
		return this.adapter.load();
	}

	run(tests: TestSuiteInfo | TestInfo): Promise<void> {
		return this.adapter.run(tests);
	}

	debug(tests: TestSuiteInfo | TestInfo): Promise<void> {
		return this.adapter.debug(tests);
	}

	cancel(): void {
		this.adapter.cancel();
	}

	get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
		return this.testsEmitter.event;
	}

	get testStates(): vscode.Event<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent> {
		return this.adapter.testStates;
	}

	get autorun(): vscode.Event<void> | undefined {
		return this.adapter.autorun;
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
	}
}
