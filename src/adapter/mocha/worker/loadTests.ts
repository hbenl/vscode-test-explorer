import * as Mocha from 'mocha';
import { TestSuiteInfo, TestInfo, TestTreeInfo } from '../../api';

let sendMessage: (message: any) => void;

if (process.send) {

	sendMessage = (message) => process.send!(message);

	const files = <string[]>JSON.parse(process.argv[2]);
	const ui: string = JSON.parse(process.argv[3]).ui;

	loadTests(files, ui);

} else {
	console.log('This script is designed to run in a child process!');
}

async function loadTests(files: string[], ui: string) {

	const mocha = new Mocha();
	mocha.ui(ui);

	for (const file of files) {
		mocha.addFile(file);
	}

	mocha.loadFiles();

	sendMessage(await convertSuite(mocha.suite));
}

async function convertSuite(suite: Mocha.ISuite): Promise<TestSuiteInfo> {

	const childSuites: TestTreeInfo[] = await Promise.all(suite.suites.map((suite) => convertSuite(suite)));
	const childTests: TestTreeInfo[] = await Promise.all(suite.tests.map((test) => convertTest(test)));

	return {
		type: 'suite',
		id: suite.fullTitle(),
		label: suite.title,
		file: suite.file,
		children: childSuites.concat(childTests)
	};
}

async function convertTest(test: Mocha.ITest): Promise<TestInfo> {
	return {
		type: 'test',
		id: test.fullTitle(),
		label: test.title,
		file: test.file,
	}
}
