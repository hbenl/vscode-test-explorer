import { TreeItem, ItemState, CurrentItemState, PreviousItemState } from './tree';
import { IconPaths } from './iconPaths';

export function parentItemState(children: TreeItem[]): ItemState {
	return { 
		current: parentCurrentItemState(children),
		previous: parentPreviousItemState(children)
	};
}

export function parentCurrentItemState(children: TreeItem[]): CurrentItemState {

	if (children.length === 0) {

		return 'pending';

	} else if (children.some((child) => ((child.state.current === 'scheduled') || (child.state.current === 'running')))) {

		return 'running';

	} else if (children.some((child) => (child.state.current === 'failed'))) {

		return 'failed';

	} else if (children.some((child) => (child.state.current === 'pending'))) {

		return 'pending';

	} else {

		return 'passed';

	}
}

export function parentPreviousItemState(children: TreeItem[]): PreviousItemState {

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

export function stateIconPath(state: ItemState, iconPaths: IconPaths): string {

	switch (state.current) {

		case 'scheduled':

			return iconPaths.scheduled;

		case 'running':

			return iconPaths.running;

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
