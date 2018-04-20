import Jasmine = require('jasmine');
import { Reporter } from './reporter';

const sendMessage = process.send ? (message: any) => process.send!(message) : () => {};

const _jasmine = new Jasmine({});
jasmine.getEnv().addReporter(new Reporter(sendMessage));
_jasmine.loadConfig({
	spec_dir: 'out/adapter/jasmine',
	spec_files: [process.argv[2]]
});
_jasmine.execute();
