# Test Explorer for Visual Studio Code

This extension provides an extensible user interface for running your tests in VS Code.
It can be used with any testing framework if there is a corresponding [Test Adapter extension](#test-adapters).

Other extensions can get full access to the Test Adapters by acting as [Test Controllers](#test-controllers).

The Test Explorer can also be used in [VS Live Share](https://aka.ms/vsls) sessions by installing the [Test Explorer Live Share](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer-liveshare) extension.

This extension will be automatically installed when you install one of the Test Adapters,
so there is usually no need to install this extension manually.

## Test Adapters

Currently the following Test Adapters are available:

### Javascript

* [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)
* [Jasmine Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-jasmine-test-adapter)

### C++

* [Google Test Explorer](https://marketplace.visualstudio.com/items?itemName=OpenNingia.vscode-google-test-adapter)
* [Catch2 Test Explorer](https://marketplace.visualstudio.com/items?itemName=matepek.vscode-catch2-test-adapter)

### Python

* [Python Test Explorer](https://marketplace.visualstudio.com/items?itemName=LittleFoxTeam.vscode-python-test-adapter)

### Live Share

* The [Test Explorer Live Share](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer-liveshare) extension creates Test Adapters in
Live Share guests that act as proxies for the Test Adapters in the Live Share host.

If there is no Test Adapter for your favorite testing framework yet, you can easily [create your own](https://github.com/hbenl/vscode-example-test-adapter).

## Test Controllers

Currently the following Test Controllers are available:

* The Test Explorer UI (which is the main part of this extension) is itself implemented as a Test Controller
* The [Test Explorer Live Share](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer-liveshare) extension creates Test Controllers in
the Live Share host that act as proxies for the Test Explorers in the Live Share guests.

Do you have a new idea for interacting with the Test Adapters? You can easily get full access to all Test Adapters in your own extension by [implementing your own controller](https://github.com/hbenl/vscode-example-test-controller).

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
