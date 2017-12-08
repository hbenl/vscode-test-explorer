import * as fs from 'fs-extra';

export class TestFileCache {

	private cachedFiles = new Map<string, string | undefined>();

	async getFile(name: string): Promise<string | undefined> {

		if (this.cachedFiles.has(name)) {

			return this.cachedFiles.get(name);

		} else {

			const content = await fs.readFile(name, 'utf8');
			this.cachedFiles.set(name, content);
			return content;

		}
	}
}