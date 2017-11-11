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

export interface TestStateMessage {
	testId: string;
	state: 'running' | 'passed' | 'failed';
}

export interface TestRunnerAdapter {
	readonly tests: Observable<TestSuite>;
	reloadTests(): void;
	readonly testStates: Observable<TestStateMessage>;
	startTests(tests: string[]): Promise<void>;
}
