import { Observable } from 'rxjs';

export type TestTreeInfo = TestInfo | TestSuiteInfo;

interface TestTreeInfoBase {
	type: string;
	id: string;
	label: string;
}

export interface TestSuiteInfo extends TestTreeInfoBase {
	type: 'suite';
	readonly children: TestTreeInfo[];
}

export interface TestInfo extends TestTreeInfoBase {
	type: 'test';
}

export interface TestStateMessage {
	testId: string;
	state: 'running' | 'passed' | 'failed';
	message?: string;
}

export interface TestRunnerAdapter {
	readonly tests: Observable<TestSuiteInfo>;
	reloadTests(): void;
	readonly testStates: Observable<TestStateMessage>;
	startTests(tests: string[]): Promise<void>;
}
