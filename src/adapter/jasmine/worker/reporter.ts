import { TestMessage, TestSuiteMessage } from '../../api';

export class Reporter implements jasmine.CustomReporter {

	constructor(private readonly sendMessage: (message: any) => void) {}

	suiteStarted(result: jasmine.CustomReporterResult): void {

		const msg: TestSuiteMessage = {
			type: 'suite',
			suite: {
				type: 'suite',
				id: result.id,
				label: result.description,
				children: []
			},
			state: 'running'
		};

		this.sendMessage(msg);
	}

	suiteDone(result: jasmine.CustomReporterResult): void {

		const msg: TestSuiteMessage = {
			type: 'suite',
			suite: result.id,
			state: 'completed'
		};

		this.sendMessage(msg);
	}

	specStarted(result: jasmine.CustomReporterResult): void {

		const msg: TestMessage = {
			type: 'test',
			test: {
				type: 'test',
				id: result.id,
				label: result.description
			},
			state: 'running'
		};

		this.sendMessage(msg);
	}

	specDone(result: jasmine.CustomReporterResult): void {

		const failed = result.failedExpectations && (result.failedExpectations.length > 0);
		const state = failed ? 'failed' : 'passed';

		const msg: TestMessage = {
			type: 'test',
			test: result.id,
			state
		};

		this.sendMessage(msg);
	}
}
