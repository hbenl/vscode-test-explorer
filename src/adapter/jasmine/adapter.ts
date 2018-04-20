import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { fork, ChildProcess } from 'child_process';
import { TestCollectionAdapter, TestSuiteInfo, TestMessage, TestSuiteMessage } from '../api';

export class JasmineTestCollectionAdapter implements TestCollectionAdapter {

	private runningTestProcess: ChildProcess | undefined;

	private readonly testsEmitter = new vscode.EventEmitter<TestSuiteInfo>();
	private readonly statesEmitter = new vscode.EventEmitter<TestSuiteMessage | TestMessage>();
	private readonly autorunEmitter = new vscode.EventEmitter<void>();

	constructor(
		public readonly workspaceFolder: vscode.WorkspaceFolder
	) {
		vscode.workspace.onDidSaveTextDocument((doc) => {
			if (doc.uri.fsPath.startsWith(this.workspaceFolder.uri.fsPath)) {
				this.autorunEmitter.fire();
			}
		});
	}

	get tests(): vscode.Event<TestSuiteInfo> {
		return this.testsEmitter.event;
	}

	get testStates(): vscode.Event<TestSuiteMessage | TestMessage> {
		return this.statesEmitter.event;
	}

	get autorun(): vscode.Event<void> {
		return this.autorunEmitter.event;
	}

	async reloadTests(): Promise<void> {

		const config = this.getConfiguration();
		const testFiles = await this.lookupFiles(config);

		const testFileSuites = testFiles.map(file => <TestSuiteInfo>{
			type: 'suite',
			id: file,
			label: file,
			file: file,
			children: []
		});

		const rootSuite: TestSuiteInfo = {
			type: 'suite',
			id: 'root',
			label: 'root',
			children: testFileSuites
		}

		this.testsEmitter.fire(rootSuite);
	}

	async startTests(path: string[]): Promise<void> {

		const config = this.getConfiguration();
		const testFiles = await this.lookupFiles(config);

		this.statesEmitter.fire(<TestSuiteMessage>{
			type: 'suite',
			suite: 'root',
			state: 'running'
		});

		for (const testFile of testFiles) {

			this.statesEmitter.fire(<TestSuiteMessage>{
				type: 'suite',
				suite: testFile,
				state: 'running'
			});

			await new Promise<void>((resolve) => {

				this.runningTestProcess = fork(
					require.resolve('./worker/runTests.js'),
					[ testFile ],
					{
						execArgv: []
					}
				);
	
				this.runningTestProcess.on('message', 
					message => this.statesEmitter.fire(<TestMessage>message)
				);
	
				this.runningTestProcess.on('exit', () => {

					this.statesEmitter.fire(<TestSuiteMessage>{
						type: 'suite',
						suite: testFile,
						state: 'completed'
					});
		
					this.runningTestProcess = undefined;
					resolve();
				});
	
			});
		}

		this.statesEmitter.fire(<TestSuiteMessage>{
			type: 'suite',
			suite: 'root',
			state: 'completed'
		});
	}

	async debugTests(tests: string[]): Promise<void> {
		throw new Error("Method not implemented.");
	}

	cancelTests(): void {
		throw new Error("Method not implemented.");
	}

	private getConfiguration(): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration('jasmineExplorer', this.workspaceFolder.uri);
	}

	private async lookupFiles(adapterConfig: vscode.WorkspaceConfiguration): Promise<string[]> {
		const jasmineConfigFile = adapterConfig.get<string>('config') || 'spec/support/jasmine.json';
		const jasmineConfig = await fs.readJson(path.join(this.workspaceFolder.uri.fsPath, jasmineConfigFile));
		const testFilesGlob = jasmineConfig.spec_dir + '/' + jasmineConfig.spec_files[0];
		const relativePattern = new vscode.RelativePattern(this.workspaceFolder, testFilesGlob);
		const fileUris = await vscode.workspace.findFiles(relativePattern);
		return fileUris.map(uri => uri.fsPath);
	}
}
