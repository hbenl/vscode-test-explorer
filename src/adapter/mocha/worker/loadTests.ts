import * as Mocha from 'mocha';
import { TestSuite, Test, TestItem } from '../../api';

let sendMessage: (message: any) => void;

if (process.send) {

	sendMessage = (message) => process.send!(message);

	const searchPaths = <string[]>JSON.parse(process.argv[2]);

	loadTests(searchPaths);

} else {
	console.log('This script is designed to run in a child process!');
}

function loadTests(searchPaths: string[]) {

	let files: string[] = [];
	for (const searchPath of searchPaths) {
		files = files.concat(Mocha.utils.lookupFiles(searchPath, ['js']));
	}

	const mocha = new Mocha();

	for (const file of files) {
		mocha.addFile(file);
	}

	mocha.loadFiles();

	sendMessage(convertSuite(mocha.suite));
}

function convertSuite(suite: Mocha.ISuite): TestSuite {

	let children: TestItem[] = suite.suites.map(convertSuite);
	children = children.concat(suite.tests.map(convertTest));

	return {
		type: 'suite',
		id: suite.fullTitle(),
		label: suite.title,
		children
	};
}

function convertTest(test: Mocha.ITest): Test {
	return {
		type: 'test',
		id: test.fullTitle(),
		label: test.title
	}
}
