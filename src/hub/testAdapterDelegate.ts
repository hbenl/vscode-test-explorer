import * as vscode from 'vscode';
import { TestAdapter, TestSuiteEvent, TestEvent, TestRunStartedEvent, TestRunFinishedEvent, TestLoadStartedEvent, TestLoadFinishedEvent, TestController, RetireEvent } from 'vscode-test-adapter-api';

export class TestAdapterDelegate implements TestAdapter {

	public readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
	private readonly retireEmitter = new vscode.EventEmitter<RetireEvent>();

	private readonly disposables: vscode.Disposable[] = [];

	constructor(
		readonly adapter: TestAdapter,
		readonly controller: TestController
	) {
		this.disposables.push(this.testsEmitter);
		this.disposables.push(this.retireEmitter);

		if (adapter.debug) {
			this.debug = tests => adapter.debug!(tests);
		}

		if (adapter.autorun) {
			this.disposables.push(
				adapter.autorun(() => this.retireEmitter.fire({}))
			);
		}

		if (adapter.retire) {

			this.disposables.push(
				adapter.retire(retireEvent => this.retireEmitter.fire(retireEvent))
			);

		} else {

			this.disposables.push(
				adapter.tests(testLoadEvent => {
					if (testLoadEvent.type === 'finished') {
						// ensure that the RetireEvent reaches Test Controllers *after* the TestLoadFinishedEvent
						setTimeout(() => this.retireEmitter.fire({}), 0);
					}
				})
			);
		}
	}

	get workspaceFolder(): vscode.WorkspaceFolder | undefined {
		return this.adapter.workspaceFolder;
	}

	load(): Promise<void> {
		return this.adapter.load();
	}

	run(tests: string[]): Promise<void> {
		return this.adapter.run(tests);
	}

	debug?: (tests: string[]) => Promise<void>;

	cancel(): void {
		this.adapter.cancel();
	}

	get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
		return this.testsEmitter.event;
	}

	get testStates(): vscode.Event<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent> {
		return this.adapter.testStates;
	}

	get retire(): vscode.Event<RetireEvent> {
		return this.retireEmitter.event;
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables.splice(0, this.disposables.length);
	}
}
