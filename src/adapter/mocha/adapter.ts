import * as vscode from 'vscode';
import { fork, ChildProcess } from 'child_process';
import { TestRunnerAdapter, TestSuiteInfo, TestStateMessage } from '../api';

export class MochaAdapter implements TestRunnerAdapter {

	private testFiles: string[];

	private runningTestProcess: ChildProcess | undefined;

	private readonly testsSubject = new vscode.EventEmitter<TestSuiteInfo>();
	private readonly statesSubject = new vscode.EventEmitter<TestStateMessage>();

	constructor() {
		const config = vscode.workspace.getConfiguration('test-explorer');
		this.testFiles = config.get('files') || [];
	}

	get tests(): vscode.Event<TestSuiteInfo> {
		return this.testsSubject.event;
	}

	get testStates(): vscode.Event<TestStateMessage> {
		return this.statesSubject.event;
	}

	reloadTests(): void {

		let testsLoaded = false;

		const childProc = fork(
			require.resolve('./worker/loadTests.js'),
			[ JSON.stringify(this.testFiles) ],
			{ execArgv: [] }
		);

		childProc.on('message', message => {
			testsLoaded = true;
			this.testsSubject.fire(<TestSuiteInfo>message);
		});

		childProc.on('exit', () => {
			if (!testsLoaded) {
				this.testsSubject.fire({ type: 'suite', id: '', label: 'No tests found', children: [] });
			}
		});
	}

	startTests(tests: string[]): Promise<void> {
		return new Promise<void>((resolve, reject) => {

			this.runningTestProcess = fork(
				require.resolve('./worker/runTests.js'),
				[ JSON.stringify(this.testFiles), JSON.stringify(tests) ],
				{ execArgv: [] }
			);

			this.runningTestProcess.on('message', 
				message => this.statesSubject.fire(<TestStateMessage>message));

			this.runningTestProcess.on('exit', () => {
				this.runningTestProcess = undefined;
				resolve();
			});
		});
	}

	cancelTests(): void {
		if (this.runningTestProcess) {
			this.runningTestProcess.kill();
		}
	}
}
