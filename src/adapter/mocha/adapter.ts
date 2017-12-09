import * as vscode from 'vscode';
import { fork, ChildProcess } from 'child_process';
import { TestCollectionAdapter, TestSuiteInfo, TestStateMessage } from '../api';

export class MochaTestCollectionAdapter implements TestCollectionAdapter {

	private config: vscode.WorkspaceConfiguration;

	private runningTestProcess: ChildProcess | undefined;

	private readonly testsSubject = new vscode.EventEmitter<TestSuiteInfo>();
	private readonly statesSubject = new vscode.EventEmitter<TestStateMessage>();

	constructor(
		private readonly workspaceFolder: vscode.WorkspaceFolder
	) {
		this.config = vscode.workspace.getConfiguration('mochaExplorer', workspaceFolder.uri);
	}

	get tests(): vscode.Event<TestSuiteInfo> {
		return this.testsSubject.event;
	}

	get testStates(): vscode.Event<TestStateMessage> {
		return this.statesSubject.event;
	}

	async reloadTests(): Promise<void> {

		const testFiles = await this.lookupFiles();

		let testsLoaded = false;

		await new Promise<void>((resolve, reject) => {

			const childProc = fork(
				require.resolve('./worker/loadTests.js'),
				[ JSON.stringify(testFiles) ],
				{ execArgv: [], cwd: this.workspaceFolder.uri.fsPath }
			);

			childProc.on('message', (info: TestSuiteInfo | undefined) => {

				testsLoaded = true;

				if (info) {
					info.label = this.workspaceFolder.name;
				}

				this.testsSubject.fire(info);
			});

			childProc.on('exit', () => {

				if (!testsLoaded) {
					this.testsSubject.fire({ type: 'suite', id: '', label: 'No tests found', children: [] });
				}

				resolve();
			});
		});
	}

	async startTests(tests: string[]): Promise<void> {

		const testFiles = await this.lookupFiles();

		await new Promise<void>((resolve, reject) => {

			this.runningTestProcess = fork(
				require.resolve('./worker/runTests.js'),
				[ JSON.stringify(testFiles), JSON.stringify(tests) ],
				{ execArgv: [], cwd: this.workspaceFolder.uri.fsPath }
			);

			this.runningTestProcess.on('message', 
				message => this.statesSubject.fire(<TestStateMessage>message));

			this.runningTestProcess.on('exit', () => {
				this.runningTestProcess = undefined;
				resolve();
			});
		});
	}

	async debugTests(tests: string[]): Promise<void> {

		const testFiles = await this.lookupFiles();

		vscode.debug.startDebugging(vscode.workspace.workspaceFolders![0], {
			name: 'Debug Mocha Tests',
			type: 'node',
			request: 'launch',
			program: require.resolve('./worker/runTests.js'),
			args: [ JSON.stringify(testFiles), JSON.stringify(tests) ],
			cwd: '${workspaceRoot}',
			stopOnEntry: false
		});
	}

	cancelTests(): void {
		if (this.runningTestProcess) {
			this.runningTestProcess.kill();
		}
	}

	private async lookupFiles(): Promise<string[]> {
		const testFilesGlob = this.config.get<string>('files') || 'test/**/*.js';
		const relativePattern = new vscode.RelativePattern(this.workspaceFolder, testFilesGlob);
		const fileUris = await vscode.workspace.findFiles(relativePattern);
		return fileUris.map(uri => uri.fsPath);
	}
}
