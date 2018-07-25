import { TestAdapter, TestController } from 'vscode-test-adapter-api';
import { TestAdapterProxy } from './testAdapterProxy';

export class Hub implements TestController {

	private controllers = new Set<TestController>();
	private adapters = new Set<TestAdapter>();
	private proxies = new Set<TestAdapterProxy>();

	registerController(controller: TestController): void {

		this.controllers.add(controller);

		for (const adapter of this.adapters) {
			const proxy = new TestAdapterProxy(adapter, controller, this);
			this.proxies.add(proxy);
			controller.registerAdapter(proxy);
		}
	}

	unregisterController(controller: TestController): void {

		this.controllers.delete(controller);

		for (const proxy of this.proxies) {
			if (proxy.controller === controller) {
				controller.unregisterAdapter(proxy);
				proxy.dispose();
				this.proxies.delete(proxy);
			}
		}
	}

	registerAdapter(adapter: TestAdapter): void {

		this.adapters.add(adapter);

		for (const controller of this.controllers) {
			const proxy = new TestAdapterProxy(adapter, controller, this);
			this.proxies.add(proxy);
			controller.registerAdapter(proxy);
		}
	}

	unregisterAdapter(adapter: TestAdapter): void {

		this.adapters.delete(adapter);

		for (const proxy of this.proxies) {
			if (proxy.originalAdapter === adapter) {
				proxy.controller.unregisterAdapter(proxy);
				proxy.dispose();
				this.proxies.delete(proxy);
			}
		}
	}
}
