# Test Explorer for Visual Studio Code

This extension provides an extensible user interface for running your tests in VS Code.
It can be used with any testing framework if there is a corresponding [Test Adapter extension](#test-adapters).

Other extensions can get full access to the Test Adapters by acting as [Test Controllers](#test-controllers).

The Test Explorer can also be used in [VS Live Share](https://aka.ms/vsls) sessions by installing the [Test Explorer Live Share](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer-liveshare) extension.

This extension will be automatically installed when you install one of the Test Adapters,
so there is usually no need to install this extension manually.

## Migrating to native testing

In version 1.59, VS Code added an official API and UI for running tests, which provides all the functionality of this extension and more.
Therefore this extension is now deprecated. I will keep maintaining it so it will remain usable but I don't plan to add any major new features to it.

### Changes for users

You can keep using this extension as before, but you now also have the option to use VS Code's native testing UI
instead by setting `testExplorer.useNativeTesting` to `true` in your VS Code settings.

### Changes for extension authors

If you plan to write a new testing extension for VS Code, I recommend you use the native testing API as it's more flexible and has more features
than this extension's Test Adapter API. [Here](https://code.visualstudio.com/api/extension-guides/testing)'s the official guide for the native testing API.

If you're maintaining an extension that uses the Test Adapter API, [here](https://github.com/microsoft/vscode-docs/blob/vnext/api/extension-guides/testing.md#migrating-from-the-test-explorer-ui) is a short guide how to migrate your Test Adapter to the native API.
The migration isn't strictly necessary because this extension will remain usable and your users can switch to the native testing UI using the
`testExplorer.useNativeTesting` setting anyway, but you might find the additional flexibility of the native testing API useful in the future.

## Test Adapters

Currently the following Test Adapters are available:

### Javascript

* [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)
* [Jasmine Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-jasmine-test-adapter)
* [Angular/Karma Test Explorer](https://marketplace.visualstudio.com/items?itemName=raagh.angular-karma-test-explorer)
* [Jest Test Explorer](https://marketplace.visualstudio.com/items?itemName=kavod-io.vscode-jest-test-adapter)
* [AVA Test Explorer](https://marketplace.visualstudio.com/items?itemName=gwenio.vscode-ava-test-adapter)
* [TestyTs Test Explorer](https://marketplace.visualstudio.com/items?itemName=Testy.vscode-testyts-test-adapter)
* [React-scripts Test Adapter](https://marketplace.visualstudio.com/items?itemName=smarschollek.vscode-react-scripts-test-adapter)

### ABAP

* [ABAP remote filesystem](https://marketplace.visualstudio.com/items?itemName=murbani.vscode-abap-remote-fs)
  
### C

* [Ceedling Test Explorer](https://marketplace.visualstudio.com/items?itemName=numaru.vscode-ceedling-test-adapter)
* [CppUTest Test Explorer](https://marketplace.visualstudio.com/items?itemName=bneumann.cpputest-test-adapter)
* [Unity Framework for C Test Explorer](https://marketplace.visualstudio.com/items?itemName=fpopescu.vscode-unity-test-adapter)
* [Acutest Test Explorer](https://marketplace.visualstudio.com/items?itemName=Moosecasa.vscode-acutest-test-adapter)

### C++

* [C++ TestMate](https://marketplace.visualstudio.com/items?itemName=matepek.vscode-catch2-test-adapter)
* [CMake Test Explorer](https://marketplace.visualstudio.com/items?itemName=fredericbonnet.cmake-test-adapter)
* [CppUnitTestFramework Explorer](https://marketplace.visualstudio.com/items?itemName=drleq.vscode-cpputf-test-adapter)
* [Bandit Test Explorer](https://marketplace.visualstudio.com/items?itemName=dampsoft.vscode-banditcpp-test-adapter)
* [catkin-tools](https://marketplace.visualstudio.com/items?itemName=betwo.b2-catkin-tools)
* [CppUTest Test Explorer](https://marketplace.visualstudio.com/items?itemName=bneumann.cpputest-test-adapter)
* [Boost.Test Explorer](https://marketplace.visualstudio.com/items?itemName=zcoinofficial.boost-test-adapter)
* [Acutest Test Explorer](https://marketplace.visualstudio.com/items?itemName=Moosecasa.vscode-acutest-test-adapter)
* [CppUnit Test Explorer](https://marketplace.visualstudio.com/items?itemName=dprog.vscode-cppunit-test-adapter)

### Elixir

* [Elixir Test Explorer](https://marketplace.visualstudio.com/items?itemName=adamzapasnik.elixir-test-explorer)

### Elm

* [Run Elm tests](https://marketplace.visualstudio.com/items?itemName=FraWa.vscode-elm-test-runner)

### Go

* [Go Test Explorer](https://marketplace.visualstudio.com/items?itemName=ethan-reesor.vscode-go-test-adapter)

### Haxe

* [Haxe Test Explorer](https://marketplace.visualstudio.com/items?itemName=vshaxe.haxe-test-adapter)

### Java

* [Apache NetBeans Language Server](https://marketplace.visualstudio.com/items?itemName=ASF.apache-netbeans-java)

### Lua

* [LuaUnit Test Explorer](https://marketplace.visualstudio.com/items?itemName=lej.vscode-lua-test-adapter)

### Python

* [Python Test Explorer](https://marketplace.visualstudio.com/items?itemName=LittleFoxTeam.vscode-python-test-adapter)

### PHP

* [PHPUnit Test Explorer](https://marketplace.visualstudio.com/items?itemName=recca0120.vscode-phpunit)
* [PHP Tools for VSCode](https://marketplace.visualstudio.com/items?itemName=DEVSENSE.phptools-vscode)

### R

* [R Test Explorer](https://marketplace.visualstudio.com/items?itemName=meakbiyik.vscode-r-test-adapter)

### REST/GraphQL

* [Ply](https://marketplace.visualstudio.com/items?itemName=ply-ct.vscode-ply)

### Ruby

* [Ruby Test Explorer](https://marketplace.visualstudio.com/items?itemName=connorshea.vscode-ruby-test-adapter)

### Rust

* [Rust Test Explorer](https://marketplace.visualstudio.com/items?itemName=swellaby.vscode-rust-test-adapter)

### Swift

* [Swift Test Explorer](https://marketplace.visualstudio.com/items?itemName=MakeItBetter.vscode-swift-test-adapter)

### .NET Framework

* [NXunit Test Explorer](https://marketplace.visualstudio.com/items?itemName=wghats.vscode-nxunit-test-adapter)
* [.Net Core Test Explorer](https://marketplace.visualstudio.com/items?itemName=derivitec-ltd.vscode-dotnet-adapter)

### Powershell
* [Pester Test Explorer](https://marketplace.visualstudio.com/items?itemName=TylerLeonhardt.vscode-pester-test-adapter)

### VHDL/SystemVerilog

* [VUnit Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbohlin.vunit-test-explorer)

### Z80 Assembler

* [Z80 Unit Tests](https://marketplace.visualstudio.com/items?itemName=maziac.z80-unit-tests)

### Live Share

* The [Test Explorer Live Share](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer-liveshare) extension creates Test Adapters in
Live Share guests that act as proxies for the Test Adapters in the Live Share host.

If there is no Test Adapter for your favorite testing framework yet, you can easily [create your own](https://github.com/hbenl/vscode-example-test-adapter).

## Test Controllers

Currently the following Test Controllers are available:

* The Test Explorer UI (which is the main part of this extension) is itself implemented as a Test Controller
* The [Test Explorer Diagnostics Controller](https://marketplace.visualstudio.com/items?itemName=emilylilylime.vscode-test-explorer-diagnostics) adds test results to the Problems panel in VS Code.
* The [Test Explorer Status Bar](https://marketplace.visualstudio.com/items?itemName=connorshea.vscode-test-explorer-status-bar) extension provides information about the current test suite in the Status Bar.
* The [Test Explorer Live Share](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer-liveshare) extension creates Test Controllers in
the Live Share host that act as proxies for the Test Explorers in the Live Share guests.

Do you have a new idea for interacting with the Test Adapters? You can easily get full access to all Test Adapters in your own extension by [implementing your own controller](https://github.com/hbenl/vscode-example-test-controller).

## Configuration

The following configuration properties are available:

Property                              | Description
--------------------------------------|---------------------------------------------------------------
`testExplorer.onStart`                | Retire or reset all test states whenever a test run is started
`testExplorer.onReload`               | Retire or reset all test states whenever the test tree is reloaded
`testExplorer.codeLens`               | Show a CodeLens above each test or suite for running or debugging the tests
`testExplorer.gutterDecoration`       | Show the state of each test in the editor using Gutter Decorations
`testExplorer.errorDecoration`        | Show error messages from test failures as decorations in the editor
`testExplorer.errorDecorationHover`   | Provide hover messages for the error decorations in the editor
`testExplorer.sort`                   | Sort the tests and suites by label or location. If this is not set (or set to null), they will be shown in the order that they were received from the adapter
`testExplorer.showCollapseButton`     | Show a button for collapsing the nodes of the test tree
`testExplorer.showExpandButton`       | Show a button for expanding the top nodes of the test tree, recursively for the given number of levels
`testExplorer.showOnRun`              | Switch to the Test Explorer view whenever a test run is started
`testExplorer.addToEditorContextMenu` | Add menu items for running and debugging the tests in the current file to the editor context menu
`testExplorer.mergeSuites`            | Merge suites with the same label and parent
`testExplorer.hideEmptyLog`           | Hide the output channel used to show a test's log when the user clicks on a test whose log is empty
`testExplorer.hideWhen`               | Hide the Test Explorer when no test adapters have been registered or when no tests have been found by the registered adapters. The default is to never hide the Test Explorer (some test adapters only work with this default setting).
`testExplorer.useNativeTesting`       | Disable the Test Explorer UI and use VSCode's native Testing UI instead

Further configuration options are provided by the Test Adapters.

## Commands

The following commands are available in VS Code's command palette, use the ID to add them to your keyboard shortcuts:

ID                                   | Command
-------------------------------------|--------------------------------------------
`test-explorer.reload`               | Reload tests
`test-explorer.run-all`              | Run all tests
`test-explorer.run-file`             | Run tests in current file
`test-explorer.run-test-at-cursor`   | Run the test at the current cursor position
`test-explorer.rerun`                | Repeat the last test run
`test-explorer.debug-test-at-cursor` | Debug the test at the current cursor position
`test-explorer.redebug`              | Repeat the last test run in the debugger
`test-explorer.cancel`               | Cancel running tests
