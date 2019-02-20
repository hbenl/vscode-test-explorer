### Version 2.6.0
* add `testExplorer.orderingStrategy` with `orderByAlphabet` and `orderByLocation`

### Version 2.5.0
* make TestAdapter#debug optional and don't show menu items and code lenses for debugging if TestAdapter#debug isn't defined

### Version 2.4.1
* ensure that the IDs of nodes from different adapters never clash
* ensure that the filenames from the adapters match the file URIs we get from VS Code

### Version 2.4.0
* handle multiple tests with the same ID
* new test state for tests that the adapter failed to run

### Version 2.3.2
* clean up states of tests that were not run after receiving the completed event for the suite containing them

### Version 2.3.1
* update list of test adapters in README.md

### Version 2.3.0
* add commands for repeating the last test run

### Version 2.2.0
* add CodeLenses for showing a test's log and revealing the test in the explorer

### Version 2.1.0
* remember if a test was skipped dynamically (while running the test) and don't reset its state when reloading the tests

### Version 2.0.9
* fix decorations and CodeLenses on Windows

### Version 2.0.8
* show error message when loading the tests fails

### Version 2.0.7
* bugfix for TestLoadEvents being sent to the controllers twice

### Version 2.0.6
* add command for debugging the test at the current cursor position

### Version 2.0.5
* show the "Show source" button only for tests and suites that specify a source file

### Version 2.0.4
* fix the "Show source" button on Windows

### Version 2.0.3
* updated documentation

### Version 2.0.2
* UI bugfix: when multiple adapters are installed, the "Run all tests" button did not change when tests were running

### Version 2.0.1
* API bugfix

### Version 2.0.0
* changed API to allow support for VS Live Share and more extensibility

### Version 1.1.0
* add commands for running all tests in the current file or the test at the current cursor position
* remove error decorations when resetting the test states

### Version 1.0.1
* bugfix for broken CodeLenses

### Version 1.0.0
* show error decorations
* show state decorations for test suites
* bugfixes for CodeLenses or decorations not being updated in some situations
* add support for multiple (dynamically generated) tests on one line

### Version 0.4.2
* turn "Show source" context menu item into an inline menu item

### Version 0.4.1
* bugfix for another state display bug

### Version 0.4.0
* start an autorun after automatically reloading the tests
* bugfix for the autorun state not being displayed correctly

### Version 0.3.3
* animate the reload icon while tests are loading

### Version 0.3.2
* simplification of Test Adapter API: events for test suites are now optional

### Version 0.3.1
* bugfixes for CodeLenses not appearing in non-javascript files and inconsistent handling of skipped tests

### Version 0.3.0
* provide Gutter Decorations showing the test states

### Version 0.2.1
* add configuration option for turning off CodeLenses

### Version 0.2.0
* provide CodeLenses for running and debugging tests

### Version 0.1.4
* update list of test adapters

### Version 0.1.3
* bugfix for registration of tests and suites during a test run
* bugfix for computation of state of test suites

### Version 0.1.2
* bugfix for resetting the state of partially-run suites

### Version 0.1.1
* bugfixes for retiring and resetting test states from the global menu
