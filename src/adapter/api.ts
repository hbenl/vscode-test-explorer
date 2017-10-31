import { Observable } from 'rxjs';

export type TestItem = TestSuite | Test;

interface TestItemBase {
	type: string;
	id: string;
	label: string;
}

export interface TestSuite extends TestItemBase {
	type: 'suite';
	readonly children: TestItem[];
}

export interface Test extends TestItemBase {
	type: 'test';
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
