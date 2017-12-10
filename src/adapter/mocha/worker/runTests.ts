import * as Mocha from 'mocha';
import * as RegExEscape from 'escape-string-regexp';
import { MochaOpts } from '../opts';
import ReporterFactory from './reporter';

const sendMessage = process.send ? (message: any) => process.send!(message) : () => {};

const files = <string[]>JSON.parse(process.argv[2]);
const testsToRun = <string[]>JSON.parse(process.argv[3]);
const mochaOpts = <MochaOpts>JSON.parse(process.argv[4]);

const regExp = testsToRun.map(RegExEscape).join('|');

const mocha = new Mocha();

mocha.ui(mochaOpts.ui);
mocha.timeout(mochaOpts.timeout);
mocha.suite.retries(mochaOpts.retries);

for (const file of files) {
	mocha.addFile(file);
}

mocha.grep(regExp);
mocha.reporter(ReporterFactory(sendMessage));

mocha.run();
