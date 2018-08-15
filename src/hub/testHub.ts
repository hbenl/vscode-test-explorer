import { TestAdapter, TestController, TestExplorerExtension, TestSuiteInfo, TestAdapterDelegate, TestInfo } from 'vscode-test-adapter-api';
import { TestAdapterDelegateImpl, TestAdapterDelegateImpl2 } from './testAdapterDelegate';
import { IDisposable } from '../util';

export class TestHub implements TestExplorerExtension {

	private controllers = new Set<TestController>();

	private localAdapters = new Set<TestAdapter>();
	private localAdapterSubscriptions = new Map<TestAdapter, IDisposable>();
	private localDelegates = new Set<TestAdapterDelegateImpl>();
	private localTests = new Map<TestAdapter, TestSuiteInfo | undefined>();

	private remoteAdapters = new Set<TestAdapterDelegate>();
	private remoteAdapterSubscriptions = new Map<TestAdapterDelegate, IDisposable>();
	private remoteDelegates = new Set<TestAdapterDelegateImpl2>();
	private remoteTests = new Map<TestAdapterDelegate, TestSuiteInfo | undefined>();

	registerController(controller: TestController): void {

		this.controllers.add(controller);

		for (const adapter of this.localAdapters) {

			const delegate = new TestAdapterDelegateImpl(adapter, controller, this);
			this.localDelegates.add(delegate);
			controller.registerAdapterDelegate(delegate);

			delegate.testsEmitter.fire({ type: 'started' });
			if (this.localTests.has(adapter)) {
				delegate.testsEmitter.fire({ type: 'finished', suite: this.localTests.get(adapter) });
			}
		}

		for (const adapter of this.remoteAdapters) {

			const delegate = new TestAdapterDelegateImpl2(adapter, controller);
			this.remoteDelegates.add(delegate);
			controller.registerAdapterDelegate(delegate);

			delegate.testsEmitter.fire({ type: 'started' });
			if (this.remoteTests.has(adapter)) {
				delegate.testsEmitter.fire({ type: 'finished', suite: this.remoteTests.get(adapter) });
			}
		}
	}

	unregisterController(controller: TestController): void {

		this.controllers.delete(controller);

		for (const delegate of this.localDelegates) {
			if (delegate.controller === controller) {
				controller.unregisterAdapterDelegate(delegate);
				delegate.dispose();
				this.localDelegates.delete(delegate);
			}
		}

		for (const delegate of this.remoteDelegates) {
			if (delegate.controller === controller) {
				controller.unregisterAdapterDelegate(delegate);
				delegate.dispose();
				this.remoteDelegates.delete(delegate);
			}
		}
	}

	registerAdapter(adapter: TestAdapter): void {

		this.localAdapters.add(adapter);

		for (const controller of this.controllers) {
			const proxy = new TestAdapterDelegateImpl(adapter, controller, this);
			this.localDelegates.add(proxy);
			controller.registerAdapterDelegate(proxy);
		}

		this.load(adapter);

		if (adapter.reload) {
			this.localAdapterSubscriptions.set(adapter, adapter.reload(() => this.load(adapter)));
		}
	}

	unregisterAdapter(adapter: TestAdapter): void {

		this.localAdapters.delete(adapter);

		if (this.localAdapterSubscriptions.has(adapter)) {
			this.localAdapterSubscriptions.get(adapter)!.dispose();
		}

		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.controller.unregisterAdapterDelegate(delegate);
				delegate.dispose();
				this.localDelegates.delete(delegate);
			}
		}
	}

	registerAdapterDelegate(adapter: TestAdapterDelegate): void {

		this.remoteAdapters.add(adapter);

		for (const controller of this.controllers) {
			const proxy = new TestAdapterDelegateImpl2(adapter, controller);
			this.remoteDelegates.add(proxy);
			controller.registerAdapterDelegate(proxy);
		}

		this.remoteAdapterSubscriptions.set(adapter, adapter.tests(event => {
			for (const delegate of this.remoteDelegates) {
				if (delegate.adapter === adapter) {
					delegate.testsEmitter.fire(event);
				}
			}
		}));
	}

	unregisterAdapterDelegate(adapter: TestAdapterDelegate): void {

		this.remoteAdapters.delete(adapter);

		if (this.remoteAdapterSubscriptions.has(adapter)) {
			this.remoteAdapterSubscriptions.get(adapter)!.dispose();
		}

		for (const delegate of this.remoteDelegates) {
			if (delegate.adapter === adapter) {
				delegate.controller.unregisterAdapterDelegate(delegate);
				delegate.dispose();
				this.remoteDelegates.delete(delegate);
			}
		}
	}

	async load(adapter: TestAdapter): Promise<void> {

		this.localTests.delete(adapter);

		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.testsEmitter.fire({ type: 'started' });
			}
		}

		var suite = await adapter.load();
		this.localTests.set(adapter, suite);

		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.testsEmitter.fire({ type: 'finished', suite });
			}
		}
	}

	async run(tests: TestSuiteInfo | TestInfo, adapter: TestAdapter): Promise<void> {
		
		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.testStatesEmitter.fire({ type: 'started', tests });
			}
		}

		await adapter.run(tests);

		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.testStatesEmitter.fire({ type: 'finished' });
			}
		}
	}

	async debug(tests: TestSuiteInfo | TestInfo, adapter: TestAdapter): Promise<void> {
		
		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.testStatesEmitter.fire({ type: 'started', tests });
			}
		}

		await adapter.debug(tests);

		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.testStatesEmitter.fire({ type: 'finished' });
			}
		}
	}
}
