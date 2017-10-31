import { Observable } from 'rxjs';

export type TestItem = TestSuite | Test;

export interface TestSuite {
	type: 'suite';
	label: string;
	readonly children: TestItem[];
}

export interface Test {
	type: 'test';
	id: string;
	label: string;
}

export interface TestState {
	testId: string;
	state: 'running' | 'success' | 'error';
}

export interface TestRunnerAdapter {
	readonly tests: Observable<TestSuite>;
	reloadTests(): void;
	readonly testStates: Observable<TestState>;
	startTests(tests: string[]): Promise<void>;
}
