import * as path from 'path';
import * as vscode from 'vscode';
import { fork, ChildProcess } from 'child_process';
import { TestCollectionAdapter, TestSuiteInfo, TestStateMessage } from '../api';

export class MochaTestCollectionAdapter implements TestCollectionAdapter {

	private runningTestProcess: ChildProcess | undefined;

	private readonly testsSubject = new vscode.EventEmitter<TestSuiteInfo>();
	private readonly statesSubject = new vscode.EventEmitter<TestStateMessage>();

	constructor(
		private readonly workspaceFolder: vscode.WorkspaceFolder
	) {}

	get tests(): vscode.Event<TestSuiteInfo> {
		return this.testsSubject.event;
	}

	get testStates(): vscode.Event<TestStateMessage> {
		return this.statesSubject.event;
	}

	async reloadTests(): Promise<void> {

		const config = this.getConfiguration();
		const testFiles = await this.lookupFiles(config);
		const mochaOpts = this.getMochaOpts(config);

		let testsLoaded = false;

		await new Promise<void>((resolve, reject) => {

			const childProc = fork(
				require.resolve('./worker/loadTests.js'),
				[ JSON.stringify(testFiles), JSON.stringify(mochaOpts) ],
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

		const config = this.getConfiguration();
		const testFiles = await this.lookupFiles(config);
		const mochaOpts = this.getMochaOpts(config);

		await new Promise<void>((resolve, reject) => {

			this.runningTestProcess = fork(
				require.resolve('./worker/runTests.js'),
				[ JSON.stringify(testFiles), JSON.stringify(tests), JSON.stringify(mochaOpts) ],
				{
					cwd: this.getCwd(config),
					env: this.getEnv(config),
					execArgv: []
				}
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

		const config = this.getConfiguration();
		const testFiles = await this.lookupFiles(config);
		const mochaOpts = this.getMochaOpts(config);

		vscode.debug.startDebugging(this.workspaceFolder, {
			name: 'Debug Mocha Tests',
			type: 'node',
			request: 'launch',
			program: require.resolve('./worker/runTests.js'),
			args: [ JSON.stringify(testFiles), JSON.stringify(tests), JSON.stringify(mochaOpts) ],
			cwd: '${workspaceRoot}',
			stopOnEntry: false
		});
	}

	cancelTests(): void {
		if (this.runningTestProcess) {
			this.runningTestProcess.kill();
		}
	}

	private getConfiguration(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration('mochaExplorer', this.workspaceFolder.uri);
	}

	private async lookupFiles(config: vscode.WorkspaceConfiguration): Promise<string[]> {
		const testFilesGlob = config.get<string>('files') || 'test/**/*.js';
		const relativePattern = new vscode.RelativePattern(this.workspaceFolder, testFilesGlob);
		const fileUris = await vscode.workspace.findFiles(relativePattern);
		return fileUris.map(uri => uri.fsPath);
	}

	private getEnv(config: vscode.WorkspaceConfiguration): object {
		return config.get('env') || {};
	}

	private getCwd(config: vscode.WorkspaceConfiguration): string {
		const dirname = this.workspaceFolder.uri.fsPath;
		const configCwd = config.get<string>('cwd');
		return configCwd ? path.resolve(dirname, configCwd) : dirname;
	}

	private getMochaOpts(config: vscode.WorkspaceConfiguration): MochaOpts {
		return {
			ui: config.get<string>('ui')!,
			timeout: config.get<number>('timeout')!,
			retries: config.get<number>('retries')!
		}
	}
}

export interface MochaOpts {
	ui: string,
	timeout: number,
	retries: number
}
