import { EventEmitter } from 'events';
import * as Mocha from 'mocha';
import * as RegExEscape from 'escape-string-regexp';
import { TestStateMessage } from '../../api';

let sendMessage: (message: any) => void;

class Reporter {

	constructor(runner: EventEmitter) {

		runner.on('test', (test: Mocha.ITest) => {
			const state: TestStateMessage = {
				testId: test.fullTitle(),
				state: 'running'
			};
			sendMessage(state);
		});

		runner.on('pass', (test: Mocha.ITest) => {
			const state: TestStateMessage = {
				testId: test.fullTitle(),
				state: 'passed'
			};
			sendMessage(state);
		});

		runner.on('fail', (test: Mocha.ITest) => {
			const state: TestStateMessage = {
				testId: test.fullTitle(),
				state: 'failed'
			};
			sendMessage(state);
		});
	}
}

if (process.send) {

	sendMessage = (message) => process.send!(message);

	const searchPaths = <string[]>JSON.parse(process.argv[2]);
	const testsToRun = <string[]>JSON.parse(process.argv[3]);

	runTests(searchPaths, testsToRun);

} else {
	console.log('This script is designed to run in a child process!');
}

function runTests(searchPaths: string[], testsToRun: string[]) {

	let files: string[] = [];
	for (const searchPath of searchPaths) {
		files = files.concat(Mocha.utils.lookupFiles(searchPath, ['js']));
	}

	let regExp = testsToRun.map(RegExEscape).join('|');

	const mocha = new Mocha();

	for (const file of files) {
		mocha.addFile(file);
	}
	mocha.grep(regExp);
	mocha.reporter(Reporter);
	
	mocha.run();
}
