import { ExtensionContext } from 'vscode';

export type IconPath = string | { dark: string, light: string };

export class IconPaths {

	pending: IconPath;
	pendingAutorun: IconPath;
	scheduled: IconPath;
	running: IconPath;
	runningFailed: IconPath;
	passed: IconPath;
	failed: IconPath;
	passedFaint: IconPath;
	failedFaint: IconPath;
	passedAutorun: IconPath;
	failedAutorun: IconPath;
	passedFaintAutorun: IconPath;
	failedFaintAutorun: IconPath;
	skipped: IconPath;
	duplicate: IconPath;
	errored: IconPath;
	erroredFaint: IconPath;

	constructor(context: ExtensionContext) {
		this.pending = context.asAbsolutePath('icons/pending.svg');
		this.pendingAutorun = {
			dark: context.asAbsolutePath('icons/pending-autorun-dark.svg'),
			light: context.asAbsolutePath('icons/pending-autorun-light.svg')
		};
		this.scheduled = context.asAbsolutePath('icons/scheduled.svg');
		this.running = context.asAbsolutePath('icons/running.svg');
		this.runningFailed = context.asAbsolutePath('icons/running-failed.svg');
		this.passed = context.asAbsolutePath('icons/passed.svg');
		this.failed = context.asAbsolutePath('icons/failed.svg');
		this.passedFaint = context.asAbsolutePath('icons/passed-faint.svg');
		this.failedFaint = context.asAbsolutePath('icons/failed-faint.svg')
		this.passedAutorun = {
			dark: context.asAbsolutePath('icons/passed-autorun-dark.svg'),
			light: context.asAbsolutePath('icons/passed-autorun-light.svg')
		};
		this.failedAutorun = {
			dark: context.asAbsolutePath('icons/failed-autorun-dark.svg'),
			light: context.asAbsolutePath('icons/failed-autorun-light.svg')
		};
		this.passedFaintAutorun = {
			dark: context.asAbsolutePath('icons/passed-faint-autorun-dark.svg'),
			light: context.asAbsolutePath('icons/passed-faint-autorun-light.svg')
		};
		this.failedFaintAutorun = {
			dark: context.asAbsolutePath('icons/failed-faint-autorun-dark.svg'),
			light: context.asAbsolutePath('icons/failed-faint-autorun-light.svg')
		};
		this.skipped = context.asAbsolutePath('icons/skipped.svg');
		this.duplicate = context.asAbsolutePath('icons/duplicate.svg');
		this.errored = context.asAbsolutePath('icons/errored.svg');
		this.erroredFaint = context.asAbsolutePath('icons/errored-faint.svg');
	}
}