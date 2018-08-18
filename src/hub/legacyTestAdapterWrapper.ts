import * as vscode from 'vscode';
import { TestAdapter, TestLoadStartedEvent, TestLoadFinishedEvent, TestRunStartedEvent, TestRunFinishedEvent, TestSuiteEvent, TestEvent, TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';
import { TestAdapter as LegacyTestAdapter } from 'vscode-test-adapter-api/out/legacy';

export class LegacyTestAdapterWrapper implements TestAdapter {

	private readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
	private readonly testStatesEmitter = new vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>();

	private readonly disposables: vscode.Disposable[] = [];

	constructor(
		private readonly legacyAdapter: LegacyTestAdapter
	) {
		this.disposables.push(this.testsEmitter);
		this.disposables.push(this.testStatesEmitter);

		this.disposables.push(
			this.legacyAdapter.testStates(event => this.testStatesEmitter.fire(event))
		);

		if (this.legacyAdapter.reload) {
			this.disposables.push(
				this.legacyAdapter.reload(() => this.load())
			);
		}
	}

	get workspaceFolder(): vscode.WorkspaceFolder | undefined {
		return this.legacyAdapter.workspaceFolder;
	}

	async load(): Promise<void> {

		this.testsEmitter.fire({ type: 'started' });

		let suite: TestSuiteInfo | undefined;
		try {
			suite = await this.legacyAdapter.load();
		} catch (e) {}

		this.testsEmitter.fire({ type: 'finished', suite });
	}

	async run(tests: TestSuiteInfo | TestInfo): Promise<void> {

		this.testStatesEmitter.fire({ type: 'started', tests });

		try {
			await this.legacyAdapter.run(tests);
		} catch (e) {}

		this.testStatesEmitter.fire({ type: 'finished' });
	}

	async debug(tests: TestSuiteInfo | TestInfo): Promise<void> {

		this.testStatesEmitter.fire({ type: 'started', tests });

		try {
			await this.legacyAdapter.debug(tests);
		} catch (e) {}

		this.testStatesEmitter.fire({ type: 'finished' });
	}

	cancel(): void {
		this.legacyAdapter.cancel();
	}

	get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
		return this.testsEmitter.event;
	}

	get testStates(): vscode.Event<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent> {
		return this.testStatesEmitter.event;
	}

	get autorun(): vscode.Event<void> | undefined {
		return this.legacyAdapter.autorun;
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables.splice(0, this.disposables.length);
	}
}
