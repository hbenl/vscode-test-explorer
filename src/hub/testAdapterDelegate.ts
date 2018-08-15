import * as vscode from 'vscode';
import { TestAdapter, TestSuiteInfo, TestInfo, TestSuiteEvent, TestEvent, TestAdapterDelegate, TestRunStartedEvent, TestRunFinishedEvent, TestLoadStartedEvent, TestLoadFinishedEvent, TestController } from 'vscode-test-adapter-api';
import { IDisposable } from '../util';

export class TestAdapterDelegateImpl implements TestAdapterDelegate {

	public readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
	public readonly testStatesEmitter = new vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>();

	private rootSuite: TestSuiteInfo | undefined;

	private disposables: IDisposable[] = [];

	constructor(
		readonly adapter: TestAdapter,
		readonly controller: TestController
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
		this.testsEmitter.fire({ type: 'started' });
		this.rootSuite = await this.adapter.load();
		this.testsEmitter.fire({ type: 'finished', suite: this.rootSuite });
	}

	async run(tests: TestSuiteInfo | TestInfo): Promise<void> {
		this.testStatesEmitter.fire({ type: 'started', tests });
		await this.adapter.run(tests);
		this.testStatesEmitter.fire({ type: 'finished' });
	}

	async debug(tests: TestSuiteInfo | TestInfo): Promise<void> {
		this.testStatesEmitter.fire({ type: 'started', tests });
		await this.adapter.debug(tests);
		this.testStatesEmitter.fire({ type: 'finished' });
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

export class TestAdapterDelegateImpl2 implements TestAdapterDelegate {

	public readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();

	private disposables: IDisposable[] = [];

	constructor(
		readonly adapter: TestAdapterDelegate,
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
