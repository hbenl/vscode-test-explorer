declare namespace Mocha {
	namespace utils {
		function lookupFiles(path: string, extensions: string[], recursive?: boolean): string[];
	}
	interface ISuite {
		suites: ISuite[];
		tests: ITest[];
	}
}

declare interface Mocha {
	suite: Mocha.ISuite;
	loadFiles(): void;
}
