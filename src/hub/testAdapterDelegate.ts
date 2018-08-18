import * as vscode from 'vscode';
import { TestAdapter, TestSuiteInfo, TestInfo, TestSuiteEvent, TestEvent, TestRunStartedEvent, TestRunFinishedEvent, TestLoadStartedEvent, TestLoadFinishedEvent, TestController } from 'vscode-test-adapter-api';
import { IDisposable } from '../util';

export class TestAdapterDelegate implements TestAdapter {

	public readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();

	private readonly disposables: IDisposable[] = [];

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
		this.disposables.splice(0, this.disposables.length);
	}
}
