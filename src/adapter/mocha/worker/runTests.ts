import { EventEmitter } from 'events';
import * as Mocha from 'mocha';
import * as RegExEscape from 'escape-string-regexp';
import { TestStateMessage } from '../../api';

class Reporter {

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

const sendMessage = process.send ? (message: any) => process.send!(message) : () => {};

const files = <string[]>JSON.parse(process.argv[2]);
const testsToRun = <string[]>JSON.parse(process.argv[3]);

const regExp = testsToRun.map(RegExEscape).join('|');

const mocha = new Mocha();

for (const file of files) {
	mocha.addFile(file);
}
mocha.grep(regExp);
mocha.reporter(Reporter);

mocha.run();
