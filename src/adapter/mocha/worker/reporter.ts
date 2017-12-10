import { EventEmitter } from 'events';
import { TestStateMessage } from '../../api';

export default (sendMessage: (message: any) => void) => {

	return class Reporter {

		constructor(runner: EventEmitter) {
	
			runner.on('test', (test: Mocha.ITest) => {
	
				const stateMessage: TestStateMessage = {
					testId: test.fullTitle(),
					state: 'running'
				};
	
				sendMessage(stateMessage);
			});
	
			runner.on('pass', (test: Mocha.ITest) => {
	
				const stateMessage: TestStateMessage = {
					testId: test.fullTitle(),
					state: 'passed'
				};
	
				sendMessage(stateMessage);
			});
	
			runner.on('fail', (test: Mocha.ITest, err: Error) => {
	
				const stateMessage: TestStateMessage = {
					testId: test.fullTitle(),
					state: 'failed',
					message: err.stack || err.message
				};
	
				sendMessage(stateMessage);
			});
		}
	}
}
