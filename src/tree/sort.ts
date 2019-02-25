import { TreeNode } from './treeNode';

export type SortSetting = 'byLabel' | 'byLocation' | 'byLabelWithSuitesFirst' | 'byLocationWithSuitesFirst';

export function getCompareFn(sortSetting: SortSetting | undefined): ((a: TreeNode, b: TreeNode) => number) | undefined {
	switch (sortSetting) {

		case 'byLabel':
			return compareLabel;

		case 'byLocation':
			return compareLocation;

		case 'byLabelWithSuitesFirst':
			return compareWithSuitesFirst(compareLabel);

		case 'byLocationWithSuitesFirst':
			return compareWithSuitesFirst(compareLocation);

		default:
			return undefined;
	}
}

function compareLabel(a: TreeNode, b: TreeNode): number {
	return a.info.label.localeCompare(b.info.label);
}

function compareLocation(a: TreeNode, b: TreeNode): number {

	if (a.fileUri) {
		if (b.fileUri) {
			const compared = a.fileUri.localeCompare(b.fileUri);
			if (compared !== 0) {
				return compared;
			}
		} else {
			return -1;
		}
	} else if (b.fileUri) {
		return 1;
	}

	if (a.info.line !== undefined) { //TODO is line === 0 possible?
		if (b.info.line !== undefined) {
			const compared = a.info.line - b.info.line;
			if (compared !== 0) {
				return compared;
			}
		} else {
			return -1;
		}
	} else if (b.info.line !== undefined) {
		return 1;
	}

	return compareLabel(a, b);
}

function compareWithSuitesFirst(compareFn: (a: TreeNode, b: TreeNode) => number): (a: TreeNode, b: TreeNode) => number {
	return function(a: TreeNode, b: TreeNode) {

		if (a.info.type === 'suite') {
			if (b.info.type === 'test') {
				return -1;
			}
		} else if (b.info.type === 'suite') {
			return 1;
		}
	
		return compareFn(a, b);
	}
}
