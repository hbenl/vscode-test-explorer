import * as vscode from 'vscode';

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

	constructor(context: vscode.ExtensionContext) {
		const useFilledIcons = vscode.workspace.getConfiguration('testExplorer').get('filledIcons') === true;
		const iconsPath = useFilledIcons ? 'icons/filled' : 'icons';
		this.pending = {
			dark: context.asAbsolutePath('icons/pending-dark.svg'),
			light: context.asAbsolutePath('icons/pending-light.svg')
		};
		this.pendingAutorun = {
			dark: context.asAbsolutePath('icons/pending-autorun-dark.svg'),
			light: context.asAbsolutePath('icons/pending-autorun-light.svg')
		};
		this.scheduled = {
			dark: context.asAbsolutePath('icons/scheduled-dark.svg'),
			light: context.asAbsolutePath('icons/scheduled-light.svg')
		};
		this.running = {
			dark: context.asAbsolutePath('icons/running-dark.svg'),
			light: context.asAbsolutePath('icons/running-light.svg')
		};
		this.runningFailed = {
			dark: context.asAbsolutePath('icons/running-failed-dark.svg'),
			light: context.asAbsolutePath('icons/running-failed-light.svg')
		};
		this.passed = {
			dark: context.asAbsolutePath(`${iconsPath}/passed-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/passed-light.svg`)
		};
		this.failed = {
			dark: context.asAbsolutePath(`${iconsPath}/failed-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/failed-light.svg`)
		};
		this.passedFaint = {
			dark: context.asAbsolutePath(`${iconsPath}/passed-faint-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/passed-faint-light.svg`)
		};
		this.failedFaint = {
			dark: context.asAbsolutePath(`${iconsPath}/failed-faint-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/failed-faint-light.svg`)
		};
		this.passedAutorun = {
			dark: context.asAbsolutePath(`${iconsPath}/passed-autorun-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/passed-autorun-light.svg`)
		};
		this.failedAutorun = {
			dark: context.asAbsolutePath(`${iconsPath}/failed-autorun-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/failed-autorun-light.svg`)
		};
		this.passedFaintAutorun = {
			dark: context.asAbsolutePath(`${iconsPath}/passed-faint-autorun-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/passed-faint-autorun-light.svg`)
		};
		this.failedFaintAutorun = {
			dark: context.asAbsolutePath(`${iconsPath}/failed-faint-autorun-dark.svg`),
			light: context.asAbsolutePath(`${iconsPath}/failed-faint-autorun-light.svg`)
		};
		this.skipped = {
			dark: context.asAbsolutePath('icons/skipped-dark.svg'),
			light: context.asAbsolutePath('icons/skipped-light.svg')
		};
		this.duplicate = {
			dark: context.asAbsolutePath('icons/duplicate-dark.svg'),
			light: context.asAbsolutePath('icons/duplicate-light.svg')
		};
		this.errored = {
			dark: context.asAbsolutePath('icons/errored-dark.svg'),
			light: context.asAbsolutePath('icons/errored-light.svg')
		};
		this.erroredFaint = {
			dark: context.asAbsolutePath('icons/errored-faint-dark.svg'),
			light: context.asAbsolutePath('icons/errored-faint-light.svg')
		};
	}
}