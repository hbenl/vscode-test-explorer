import { TreeNode } from './tree/treeNode';
import { TestNode } from './tree/testNode';

export function* allTests(treeNode: TreeNode): IterableIterator<TestNode> {
	if (treeNode.info.type === 'suite') {
		for (const child of treeNode.children) {
			yield* allTests(child);
		}
	} else {
		yield <TestNode>treeNode;
	}
}
