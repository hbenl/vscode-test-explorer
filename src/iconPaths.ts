import { ExtensionContext } from 'vscode';

export class IconPaths {

	pending: string;
	scheduled: string;
	running: string;
	passed: string;
	failed: string;
	passedFaint: string;
	failedFaint: string;

	constructor(context: ExtensionContext) {
		this.pending = context.asAbsolutePath('icons/pending.svg'),
		this.scheduled = context.asAbsolutePath('icons/scheduled.svg'),
		this.running = context.asAbsolutePath('icons/running.svg'),
		this.passed = context.asAbsolutePath('icons/passed.svg'),
		this.failed = context.asAbsolutePath('icons/failed.svg'),
		this.passedFaint = context.asAbsolutePath('icons/passed-faint.svg'),
		this.failedFaint = context.asAbsolutePath('icons/failed-faint.svg')
	}
}