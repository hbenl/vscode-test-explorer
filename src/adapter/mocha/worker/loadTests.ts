import * as Mocha from 'mocha';
import * as RegExpEscape from 'escape-string-regexp';
import { TestSuiteInfo, TestInfo, TestTreeInfo } from '../../api';
import { TestFileCache } from './testFileCache';

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

	sendMessage(await convertSuite(mocha.suite, new TestFileCache()));
}

async function convertSuite(suite: Mocha.ISuite, cache: TestFileCache): Promise<TestSuiteInfo> {

	const testFileContent = suite.file ? await cache.getFile(suite.file) : undefined;
	const line = testFileContent ? findLineContaining(suite.title, testFileContent) : undefined;

	const childSuites: TestTreeInfo[] = await Promise.all(suite.suites.map((suite) => convertSuite(suite, cache)));
	const childTests: TestTreeInfo[] = await Promise.all(suite.tests.map((test) => convertTest(test, cache)));

	return {
		type: 'suite',
		id: suite.fullTitle(),
		label: suite.title,
		file: suite.file,
		line,
		children: childSuites.concat(childTests)
	};
}

async function convertTest(test: Mocha.ITest, cache: TestFileCache): Promise<TestInfo> {

	const testFileContent = test.file ? await cache.getFile(test.file) : undefined;
	const line = testFileContent ? findLineContaining(test.title, testFileContent) : undefined;

	return {
		type: 'test',
		id: test.fullTitle(),
		label: test.title,
		file: test.file,
		line
	}
}

function findLineContaining(needle: string, haystack: string | undefined): number | undefined {

	if (!haystack) return undefined;

	const index = haystack.search(RegExpEscape(needle));
	if (index < 0) return undefined;

	return haystack.substr(0, index).split('\n').length - 1;
}
