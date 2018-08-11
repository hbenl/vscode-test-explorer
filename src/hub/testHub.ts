import { TestAdapter, TestController, TestExplorerExtension, TestSuiteInfo } from '../../../vscode-test-adapter-api/out';
import { TestAdapterDelegateImpl } from './testAdapterDelegate';
import { IDisposable } from '../util';

export class TestHub implements TestExplorerExtension {

	private controllers = new Set<TestController>();
	private adapters = new Set<TestAdapter>();
	private adapterSubscriptions = new Map<TestAdapter, IDisposable>();
	private delegates = new Set<TestAdapterDelegateImpl>();
	private tests = new Map<TestAdapter, TestSuiteInfo | undefined>();

	registerController(controller: TestController): void {

		this.controllers.add(controller);

		for (const adapter of this.adapters) {

			const delegate = new TestAdapterDelegateImpl(adapter, controller);
			this.delegates.add(delegate);
			controller.registerAdapterDelegate(delegate);

			delegate.testsEmitter.fire({ type: 'started' });
			if (this.tests.has(adapter)) {
				delegate.testsEmitter.fire({ type: 'finished', suite: this.tests.get(adapter) });
			}
		}
	}

	unregisterController(controller: TestController): void {

		this.controllers.delete(controller);

		for (const delegate of this.delegates) {
			if (delegate.controller === controller) {
				controller.unregisterAdapterDelegate(delegate);
				delegate.dispose();
				this.delegates.delete(delegate);
			}
		}
	}

	registerAdapter(adapter: TestAdapter): void {

		this.adapters.add(adapter);

		for (const controller of this.controllers) {
			const proxy = new TestAdapterDelegateImpl(adapter, controller);
			this.delegates.add(proxy);
			controller.registerAdapterDelegate(proxy);
		}

		this.loadTests(adapter);

		if (adapter.reload) {
			this.adapterSubscriptions.set(adapter, adapter.reload(() => this.loadTests(adapter)));
		}
	}

	unregisterAdapter(adapter: TestAdapter): void {

		this.adapters.delete(adapter);

		if (this.adapterSubscriptions.has(adapter)) {
			this.adapterSubscriptions.get(adapter)!.dispose();
		}

		for (const delegate of this.delegates) {
			if (delegate.adapter === adapter) {
				delegate.controller.unregisterAdapterDelegate(delegate);
				delegate.dispose();
				this.delegates.delete(delegate);
			}
		}
	}

	async loadTests(adapter: TestAdapter): Promise<void> {

		this.tests.delete(adapter);

		for (const delegate of this.delegates) {
			if (delegate.adapter === adapter) {
				delegate.testsEmitter.fire({ type: 'started' });
			}
		}

		var suite = await adapter.load();
		this.tests.set(adapter, suite);

		for (const delegate of this.delegates) {
			if (delegate.adapter === adapter) {
				delegate.testsEmitter.fire({ type: 'finished', suite });
			}
		}
	}
}
