import { Observable, Subject } from 'rxjs';
import { TestRunnerAdapter, TestSuite, Test, TestState } from './api';

export class FakeAdapter implements TestRunnerAdapter {

	private readonly testsSubject = new Subject<TestSuite>();
	private readonly statesSubject = new Subject<TestState>();

	private readonly tree: TestSuite = {
		type: 'suite',
		label: 'Root',
		children: [
			<Test> {
				type: 'test',
				id: 'Test1',
				label: 'Test #1'
			},
			<Test> {
				type: 'test',
				id: 'Test2',
				label: 'Test #2'
			},
			<TestSuite> {
				type: 'suite',
				label: 'Test Suite',
				children: [
					<Test> {
						type: 'test',
						id: 'Test3',
						label: 'Test #3'
					},
					<Test> {
						type: 'test',
						id: 'Test4',
						label: 'Test #4'
					}
				]
			}
		]
	};

	get tests(): Observable<TestSuite> {
		return this.testsSubject.asObservable();
	}

	get testStates(): Observable<TestState> {
		return this.statesSubject.asObservable();
	}
	
	reloadTests(): void {
		this.testsSubject.next(this.tree);
	}

	async startTests(tests: string[]): Promise<void> {
		await delay(500);
		this.statesSubject.next({ testId: 'Test1', state: 'running' });
		await delay(1000);
		this.statesSubject.next({ testId: 'Test1', state: 'success' });
		await delay(500);
		this.statesSubject.next({ testId: 'Test2', state: 'running' });
		await delay(1000);
		this.statesSubject.next({ testId: 'Test2', state: 'error' });
	}
}

function delay(timeout: number): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, timeout);
	});
}
