import { TreeNode } from './treeNode';
import { IconPaths, IconPath } from '../iconPaths';

export type CurrentNodeState = 'pending' | 'scheduled' | 'running' | 'passed' | 'failed' | 'running-failed';

export type PreviousNodeState = 'passed' | 'failed' | 'other';

export interface NodeState {
	current: CurrentNodeState,
	previous: PreviousNodeState
}

export function parentNodeState(children: TreeNode[]): NodeState {
	return {
		current: parentCurrentNodeState(children),
		previous: parentPreviousNodeState(children)
	};
}

export function parentCurrentNodeState(children: TreeNode[]): CurrentNodeState {

	if (children.length === 0) {

		return 'pending';

	} else if (children.some((child) => (child.state.current === 'running'))) {

		if (children.some((child) => (child.state.current === 'failed'))) {

			return 'running-failed';

		} else {

			return 'running';

		}

	} else if (children.some((child) => (child.state.current === 'scheduled'))) {

		if (children.some((child) => (child.state.current === 'failed'))) {

			return 'running-failed';

		} else if (children.some((child) => (child.state.current === 'passed'))) {

			return 'running';

		} else {

			return 'scheduled';

		}

	} else if (children.some((child) => (child.state.current === 'failed'))) {

		return 'failed';

	} else if (children.some((child) => (child.state.current === 'pending'))) {

		return 'pending';

	} else {

		return 'passed';

	}
}

export function parentPreviousNodeState(children: TreeNode[]): PreviousNodeState {

	if (children.length === 0) {

		return 'other';

	} else if (children.some((child) => (child.state.previous === 'failed'))) {

		return 'failed';

	} else if (children.some((child) => (child.state.previous === 'other'))) {

		return 'other';

	} else {

		return 'passed';

	}
}

export function stateIconPath(state: NodeState, iconPaths: IconPaths): IconPath {

	switch (state.current) {

		case 'scheduled':

			return iconPaths.scheduled;

		case 'running':

			return iconPaths.running;

		case 'running-failed':

			return iconPaths.runningFailed;

		case 'passed':

			return iconPaths.passed;

		case 'failed':

			return iconPaths.failed;

		default:

			switch (state.previous) {

				case 'passed':

					return iconPaths.passedFaint;

				case 'failed':

					return iconPaths.failedFaint;

				default:

					return iconPaths.pending;
			}
	}
}
