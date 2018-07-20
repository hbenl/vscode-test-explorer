# Test Explorer UI for Visual Studio Code

This extension provides a user interface for running automated tests.
It needs Test Adapter extensions to provide the integration with different testing frameworks.
Currently the following Test Adapters are under development:

* [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)
* [Jasmine Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-jasmine-test-adapter)
* [Google Test Explorer](https://marketplace.visualstudio.com/items?itemName=OpenNingia.vscode-google-test-adapter)

This extension will be automatically installed when you install one of the Test Adapters,
so there is usually no need to install this extension manually.

## Configuration

The following configuration properties are available:

Property                        | Description
--------------------------------|---------------------------------------------------------------
`testExplorer.onStart`          | Retire or reset all test states whenever a test run is started
`testExplorer.onReload`         | Retire or reset all test states whenever the test tree is reloaded
`testExplorer.codeLens`         | Show a CodeLens above each test or suite for running or debugging the tests
`testExplorer.gutterDecoration` | Show the state of each test in the editor using Gutter Decorations
`testExplorer.errorDecoration`  | Show error messages from test failures as decorations in the editor

Further configuration options are provided by the Test Adapters.

## Commands

The following commands are available in VS Code's command palette, use the ID to add them to your keyboard shortcuts:

ID                                 | Command
-----------------------------------|--------------------------------------------
`test-explorer.reload`             | Reload tests
`test-explorer.run-all`            | Run all tests
`test-explorer.run-file`           | Run tests in current file
`test-explorer.run-test-at-cursor` | Run the test at the current cursor position
`test-explorer.cancel`             | Cancel running tests

## Writing your own Test Adapter

The [`vscode-test-adapter-api`](https://github.com/hbenl/vscode-test-adapter-api) npm package
provides the API that is used by this extension and the Test Adapters to talk to each other.
You need to implement the 
[TestAdapter](https://github.com/hbenl/vscode-test-adapter-api/blob/5b2300ac79dee47dffe5f9fdfe5399316e31d278/src/index.ts#L10)
interface and
[register](https://github.com/hbenl/vscode-test-adapter-api/blob/5b2300ac79dee47dffe5f9fdfe5399316e31d278/src/index.ts#L6)
your implementation with this extension.
Have a look at the existing adapters for examples.
