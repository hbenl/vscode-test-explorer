import { TestAdapter, TestController, TestHub as ITestHub, TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';
import { TestAdapter as LegacyTestAdapter } from 'vscode-test-adapter-api/out/legacy';
import { TestAdapterDelegateImpl, TestAdapterDelegateImpl2 } from './testAdapterDelegate';
import { IDisposable } from '../util';

export class TestHub implements ITestHub {

	private controllers = new Set<TestController>();

	private localAdapters = new Set<LegacyTestAdapter>();
	private localAdapterSubscriptions = new Map<LegacyTestAdapter, IDisposable>();
	private localDelegates = new Set<TestAdapterDelegateImpl>();
	private localTests = new Map<LegacyTestAdapter, TestSuiteInfo | undefined>();

	private remoteAdapters = new Set<TestAdapter>();
	private remoteAdapterSubscriptions = new Map<TestAdapter, IDisposable>();
	private remoteDelegates = new Set<TestAdapterDelegateImpl2>();
	private remoteTests = new Map<TestAdapter, TestSuiteInfo | undefined>();

	registerTestController(controller: TestController): void {

		this.controllers.add(controller);

		for (const adapter of this.localAdapters) {

			const delegate = new TestAdapterDelegateImpl(adapter, controller, this);
			this.localDelegates.add(delegate);
			controller.registerTestAdapter(delegate);

			delegate.testsEmitter.fire({ type: 'started' });
			if (this.localTests.has(adapter)) {
				delegate.testsEmitter.fire({ type: 'finished', suite: this.localTests.get(adapter) });
			}
		}

		for (const adapter of this.remoteAdapters) {

			const delegate = new TestAdapterDelegateImpl2(adapter, controller);
			this.remoteDelegates.add(delegate);
			controller.registerTestAdapter(delegate);

			delegate.testsEmitter.fire({ type: 'started' });
			if (this.remoteTests.has(adapter)) {
				delegate.testsEmitter.fire({ type: 'finished', suite: this.remoteTests.get(adapter) });
			}
		}
	}

	unregisterTestController(controller: TestController): void {

		this.controllers.delete(controller);

		for (const delegate of this.localDelegates) {
			if (delegate.controller === controller) {
				controller.unregisterTestAdapter(delegate);
				delegate.dispose();
				this.localDelegates.delete(delegate);
			}
		}

		for (const delegate of this.remoteDelegates) {
			if (delegate.controller === controller) {
				controller.unregisterTestAdapter(delegate);
				delegate.dispose();
				this.remoteDelegates.delete(delegate);
			}
		}
	}

	registerAdapter(adapter: LegacyTestAdapter): void {

		this.localAdapters.add(adapter);

		for (const controller of this.controllers) {
			const proxy = new TestAdapterDelegateImpl(adapter, controller, this);
			this.localDelegates.add(proxy);
			controller.registerTestAdapter(proxy);
		}

		this.load(adapter);

		if (adapter.reload) {
			this.localAdapterSubscriptions.set(adapter, adapter.reload(() => this.load(adapter)));
		}
	}

	unregisterAdapter(adapter: LegacyTestAdapter): void {

		this.localAdapters.delete(adapter);

		if (this.localAdapterSubscriptions.has(adapter)) {
			this.localAdapterSubscriptions.get(adapter)!.dispose();
		}

		for (const delegate of this.localDelegates) {
			if (delegate.adapter === adapter) {
				delegate.controller.unregisterTestAdapter(delegate);
				delegate.dispose();
				this.localDelegates.delete(delegate);
			}
		}
	}

	registerTestAdapter(adapter: TestAdapter): void {

		this.remoteAdapters.add(adapter);

		for (const controller of this.controllers) {
			const proxy = new TestAdapterDelegateImpl2(adapter, controller);
			this.remoteDelegates.add(proxy);
			controller.registerTestAdapter(proxy);
		}

		this.remoteAdapterSubscriptions.set(adapter, adapter.tests(event => {
			for (const delegate of this.remoteDelegates) {
				if (delegate.adapter === adapter) {
					delegate.testsEmitter.fire(event);
				}
			}
		}));
	}

	unregisterTestAdapter(adapter: TestAdapter): void {

		this.remoteAdapters.delete(adapter);

		if (this.remoteAdapterSubscriptions.has(adapter)) {
			this.remoteAdapterSubscriptions.get(adapter)!.dispose();
		}

		for (const delegate of this.remoteDelegates) {
			if (delegate.adapter === adapter) {
				delegate.controller.unregisterTestAdapter(delegate);
				delegate.dispose();
				this.remoteDelegates.delete(delegate);
			}
		}
	}

	async load(adapter: LegacyTestAdapter): Promise<void> {

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

	async run(tests: TestSuiteInfo | TestInfo, adapter: LegacyTestAdapter): Promise<void> {
		
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

	async debug(tests: TestSuiteInfo | TestInfo, adapter: LegacyTestAdapter): Promise<void> {
		
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
