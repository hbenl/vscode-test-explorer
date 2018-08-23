import * as vscode from 'vscode';
import { TestAdapter, TestLoadStartedEvent, TestLoadFinishedEvent, TestRunStartedEvent, TestRunFinishedEvent, TestSuiteEvent, TestEvent, TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';
import { TestAdapter as LegacyTestAdapter } from 'vscode-test-adapter-api/out/legacy';
import { TestHub } from './testHub';

export class LegacyTestAdapterWrapper implements TestAdapter {

	private readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
	private readonly testStatesEmitter = new vscode.EventEmitter<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>();

	private readonly disposables: vscode.Disposable[] = [];

	constructor(
		private readonly legacyAdapter: LegacyTestAdapter,
		private readonly hub: TestHub
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

	async run(testIDs: string[]): Promise<void> {

		const allTests = this.hub.getTests(this);
		if (!allTests) return;

		const tests = (testIDs.length > 0) ? this.find(testIDs[0], allTests) : allTests;
		if (!tests) return;

		this.testStatesEmitter.fire({ type: 'started', tests });

		try {
			await this.legacyAdapter.run(tests);
		} catch (e) {}

		this.testStatesEmitter.fire({ type: 'finished' });
	}

	async debug(testIDs: string[]): Promise<void> {

		const allTests = this.hub.getTests(this);
		if (!allTests) return;

		const tests = (testIDs.length > 0) ? this.find(testIDs[0], allTests) : allTests;
		if (!tests) return;

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

	private find(id: string, info: TestSuiteInfo | TestInfo): TestSuiteInfo | TestInfo | undefined {

		if (info.id === id) {

			return info;

		} else if (info.type === 'suite') {

			for (const child of info.children) {
				const found = this.find(id, child);
				if (found) {
					return found;
				}
			}
		}

		return undefined;
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables.splice(0, this.disposables.length);
	}
}
