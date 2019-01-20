import { TreeNode } from './treeNode';

export type CurrentNodeState = 'pending' | 'scheduled' | 'running' | 'passed' | 'failed' | 'running-failed' |
	'skipped' | 'always-skipped' | 'duplicate' | 'errored';

export type PreviousNodeState = 'pending' | 'passed' | 'failed' | 'skipped' | 'always-skipped' | 'duplicate' | 'errored';

export interface NodeState {
	current: CurrentNodeState,
	previous: PreviousNodeState,
	autorun: boolean
}

export function defaultState(skipped?: boolean): NodeState {
	return {
		current: skipped ? 'always-skipped' : 'pending',
		previous: skipped ? 'always-skipped' : 'pending',
		autorun: false
	};
}

export function parentNodeState(children: TreeNode[]): NodeState {
	return {
		current: parentCurrentNodeState(children),
		previous: parentPreviousNodeState(children),
		autorun: false
	};
}

export function parentCurrentNodeState(children: TreeNode[]): CurrentNodeState {

	if (children.length === 0) {

		return 'pending';

	} else if (children.every((child) => (child.state.current.endsWith('skipped')))) {

		if (children.some((child) => (child.state.current === 'skipped'))) {

			return 'skipped';

		} else {

			return 'always-skipped';

		}

	} else if (children.some((child) => (child.state.current === 'running'))) {

		if (children.some((child) => child.state.current.endsWith('failed') || (child.state.current === 'errored'))) {

			return 'running-failed';

		} else {

			return 'running';

		}

	} else if (children.some((child) => (child.state.current === 'scheduled'))) {

		if (children.some((child) => child.state.current.endsWith('failed') || (child.state.current === 'errored'))) {

			return 'running-failed';

		} else if (children.some((child) => (child.state.current === 'passed'))) {

			return 'running';

		} else {

			return 'scheduled';

		}

	} else if (children.some((child) => (child.state.current === 'running-failed'))) {

		return 'running-failed';

	} else if (children.some((child) => (child.state.current === 'errored'))) {

		return 'errored';

	} else if (children.some((child) => (child.state.current === 'failed'))) {

		return 'failed';

	} else if (children.some((child) => (child.state.current === 'passed'))) {

		return 'passed';

	} else {

		return 'pending';

	}
}

export function parentPreviousNodeState(children: TreeNode[]): PreviousNodeState {

	if (children.length === 0) {

		return 'pending';

	} else if (children.every((child) => (child.state.previous.endsWith('skipped')))) {

		if (children.some((child) => (child.state.previous === 'skipped'))) {

			return 'skipped';

		} else {

			return 'always-skipped';

		}

	} else if (children.some((child) => (child.state.previous === 'errored'))) {

		return 'errored';

	} else if (children.some((child) => (child.state.previous === 'failed'))) {

		return 'failed';

	} else if (children.some((child) => (child.state.previous === 'passed'))) {

		return 'passed';

	} else {

		return 'pending';

	}
}

export function parentAutorunFlag(children: TreeNode[]): boolean {
	return children.some(child => child.state.autorun);
}

export type StateIconType = 'pending' | 'pendingAutorun' | 'scheduled' | 'running' |
	'runningFailed' | 'passed' | 'passedAutorun' | 'failed' | 'failedAutorun' | 'skipped' |
	'passedFaint' | 'passedFaintAutorun' | 'failedFaint' | 'failedFaintAutorun'  |
	'duplicate' | 'errored' | 'erroredFaint';

export function stateIcon(state: NodeState): StateIconType {

	switch (state.current) {

		case 'scheduled':

			return 'scheduled';

		case 'running':

			return 'running';

		case 'running-failed':

			return 'runningFailed';

		case 'passed':

			return state.autorun ? 'passedAutorun' : 'passed';

		case 'failed':

			return state.autorun ? 'failedAutorun' : 'failed';

		case 'skipped':
		case 'always-skipped':

			return 'skipped';

		case 'duplicate':

			return 'duplicate';

		case 'errored':

			return 'errored';

		default:

			switch (state.previous) {

				case 'passed':

					return state.autorun ? 'passedFaintAutorun' : 'passedFaint';

				case 'failed':

					return state.autorun ? 'failedFaintAutorun' : 'failedFaint';

				case 'skipped':
				case 'always-skipped':

					return 'skipped';

				case 'duplicate':

					return 'duplicate';

				case 'errored':

					return 'erroredFaint';

				default:

					return state.autorun ? 'pendingAutorun' : 'pending';
			}
	}
}
