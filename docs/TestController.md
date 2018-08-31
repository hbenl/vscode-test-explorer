# Writing your own Test Controller

The [`vscode-test-adapter-api`](https://github.com/hbenl/vscode-test-adapter-api) npm package
provides the API that is used by Test Controllers and Test Adapters to talk to each other.
You need to implement the 
[TestController](https://github.com/hbenl/vscode-test-adapter-api/blob/cd79e2a251200c88bf4617a9fa5e094d76fb649e/src/index.ts#L103)
interface and
[register](https://github.com/hbenl/vscode-test-adapter-api/blob/cd79e2a251200c88bf4617a9fa5e094d76fb649e/src/index.ts#L21)
your implementation with this extension.
