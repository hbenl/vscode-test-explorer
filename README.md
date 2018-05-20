# Test Explorer for Visual Studio Code

This extension provides a user interface for running automated tests.
It needs Test Adapter extensions to provide the integration with different testing frameworks.
Currently the following Test Adapters are under development:

* [Mocha Test Adapter](https://github.com/hbenl/vscode-mocha-test-adapter)
* [Jasmine Test Adapter](https://github.com/hbenl/vscode-jasmine-test-adapter) (not published yet)

This extension will be automatically installed when you install one of the Test Adapters,
so there is usually no need to install this extension manually.

## Configuration

The following configuration properties are available:

* `testExplorer.onStart`: Retire or reset all test states whenever a test run is started
* `testExplorer.onReload`: Retire or reset all test states whenever the test tree is reloaded

Further configuration options are provided by the Test Adapters.

## Writing your own Test Adapter

The [`vscode-test-adapter-api`](https://github.com/hbenl/vscode-test-adapter-api) npm package
provides the API that is used by this extension and the Test Adapters to talk to each other.
You need to implement the 
[TestAdapter](https://github.com/hbenl/vscode-test-adapter-api/blob/5b2300ac79dee47dffe5f9fdfe5399316e31d278/src/index.ts#L10)
interface and
[register](https://github.com/hbenl/vscode-test-adapter-api/blob/5b2300ac79dee47dffe5f9fdfe5399316e31d278/src/index.ts#L6)
your implementation with this extension.
Have a look at the existing adapters for examples.
