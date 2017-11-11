import * as vscode from 'vscode';
import { fork } from 'child_process';
import { Observable, Subject } from 'rxjs';
import { TestRunnerAdapter, TestSuite, TestState } from '../api';

export class MochaAdapter implements TestRunnerAdapter {

	private testFiles: string[];

	private readonly testsSubject = new Subject<TestSuite>();
	private readonly statesSubject = new Subject<TestState>();

	constructor() {
		const config = vscode.workspace.getConfiguration('test-explorer');
		this.testFiles = config.get('files') || [];
	}

	get tests(): Observable<TestSuite> {
		return this.testsSubject.asObservable();
	}

	get testStates(): Observable<TestState> {
		return this.statesSubject.asObservable();
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
			this.testsSubject.next(<TestSuite>message);
		});

		childProc.on('exit', () => {
			if (!testsLoaded) {
				this.testsSubject.next({ type: 'suite', id: '', label: 'No tests found', children: [] });
			}
		});
	}

	startTests(tests: string[]): Promise<void> {
		return new Promise<void>((resolve, reject) => {

			const childProc = fork(
				require.resolve('./worker/runTests.js'),
				[ JSON.stringify(this.testFiles), JSON.stringify(tests) ],
				{ execArgv: [] }
			);

			childProc.on('message', message => this.statesSubject.next(<TestState>message));

			childProc.on('exit', () => resolve());
		});
	}
}
