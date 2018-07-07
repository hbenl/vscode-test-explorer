import * as vscode from 'vscode';
import { IconPaths, IconPath } from './iconPaths';

export class StateDecorationTypes {

	readonly pending: vscode.TextEditorDecorationType;
	readonly pendingAutorun: vscode.TextEditorDecorationType;
	readonly scheduled: vscode.TextEditorDecorationType;
	readonly running: vscode.TextEditorDecorationType;
	readonly runningFailed: vscode.TextEditorDecorationType;
	readonly passed: vscode.TextEditorDecorationType;
	readonly failed: vscode.TextEditorDecorationType;
	readonly passedFaint: vscode.TextEditorDecorationType;
	readonly failedFaint: vscode.TextEditorDecorationType;
	readonly passedAutorun: vscode.TextEditorDecorationType;
	readonly failedAutorun: vscode.TextEditorDecorationType;
	readonly passedFaintAutorun: vscode.TextEditorDecorationType;
	readonly failedFaintAutorun: vscode.TextEditorDecorationType;
	readonly skipped: vscode.TextEditorDecorationType;

	readonly all: vscode.TextEditorDecorationType[];

	constructor(iconPaths: IconPaths) {
		this.pending = toDecorationType(iconPaths.pending);
		this.pendingAutorun = toDecorationType(iconPaths.pendingAutorun);
		this.scheduled = toDecorationType(iconPaths.scheduled);
		this.running = toDecorationType(iconPaths.running);
		this.runningFailed = toDecorationType(iconPaths.runningFailed);
		this.passed = toDecorationType(iconPaths.passed);
		this.failed = toDecorationType(iconPaths.failed);
		this.passedFaint = toDecorationType(iconPaths.passedFaint);
		this.failedFaint = toDecorationType(iconPaths.failedFaint);
		this.passedAutorun = toDecorationType(iconPaths.passedAutorun);
		this.failedAutorun = toDecorationType(iconPaths.failedAutorun);
		this.passedFaintAutorun = toDecorationType(iconPaths.passedFaintAutorun);
		this.failedFaintAutorun = toDecorationType(iconPaths.failedFaintAutorun);
		this.skipped = toDecorationType(iconPaths.skipped);

		this.all = [
			this.pending, this.pendingAutorun, this.scheduled, this.running, this.runningFailed,
			this.passed, this.failed, this.passedFaint, this.failedFaint, this.passedAutorun,
			this.failedAutorun, this.passedFaintAutorun, this.failedFaintAutorun, this.skipped
		];
	}
}

function toDecorationType(iconPath: IconPath): vscode.TextEditorDecorationType {
	return vscode.window.createTextEditorDecorationType(toDecorationRenderOptions(iconPath));
}

function toDecorationRenderOptions(iconPath: IconPath): vscode.DecorationRenderOptions {
	if (typeof iconPath === 'string') {
		return { gutterIconPath: iconPath };
	} else {
		return {
			dark: { gutterIconPath: iconPath.dark },
			light: { gutterIconPath: iconPath.light }
		}
	}
}
