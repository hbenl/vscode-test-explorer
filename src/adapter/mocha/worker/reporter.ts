import { EventEmitter } from 'events';
import { TestMessage, TestSuiteMessage } from '../../api';

export default (sendMessage: (message: any) => void) => {

	return class Reporter {

		constructor(runner: EventEmitter) {

			runner.on('suite', (suite: Mocha.ISuite) => {

				const stateMessage: TestSuiteMessage = {
					type: 'suite',
					suite: suite.title,
					state: 'running'
				};

				sendMessage(stateMessage);
			});

			runner.on('suite end', (suite: Mocha.ISuite) => {

				const stateMessage: TestSuiteMessage = {
					type: 'suite',
					suite: suite.title,
					state: 'completed'
				};

				sendMessage(stateMessage);
			});

			runner.on('test', (test: Mocha.ITest) => {

				const stateMessage: TestMessage = {
					type: 'test',
					test: test.title,
					state: 'running'
				};

				sendMessage(stateMessage);
			});

			runner.on('pass', (test: Mocha.ITest) => {

				const stateMessage: TestMessage = {
					type: 'test',
					test: test.title,
					state: 'passed'
				};

				sendMessage(stateMessage);
			});

			runner.on('fail', (test: Mocha.ITest, err: Error) => {

				const stateMessage: TestMessage = {
					type: 'test',
					test: test.title,
					state: 'failed',
					message: err.stack || err.message
				};

				sendMessage(stateMessage);
			});

			runner.on('pending', (test: Mocha.ITest) => {

				const stateMessage: TestMessage = {
					type: 'test',
					test: test.title,
					state: 'skipped'
				};

				sendMessage(stateMessage);
			});
		}
	}
}
