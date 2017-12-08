declare namespace Mocha {
	namespace utils {
		function lookupFiles(path: string, extensions: string[], recursive?: boolean): string[];
	}
	interface ISuite {
		file?: string;
		suites: ISuite[];
		tests: ITest[];
	}
	interface ITest {
		file?: string;
	}
}

declare interface Mocha {
	suite: Mocha.ISuite;
	loadFiles(): void;
}
