# Writing your own Test Adapter

The [`vscode-test-adapter-api`](https://github.com/hbenl/vscode-test-adapter-api) npm package
provides the API that is used by Test Controllers and Test Adapters to talk to each other.
You need to implement the 
[TestAdapter](https://github.com/hbenl/vscode-test-adapter-api/blob/cd79e2a251200c88bf4617a9fa5e094d76fb649e/src/index.ts#L37)
interface and
[register](https://github.com/hbenl/vscode-test-adapter-api/blob/cd79e2a251200c88bf4617a9fa5e094d76fb649e/src/index.ts#L19)
your implementation with this extension.
Have a look at the existing adapters for examples.
