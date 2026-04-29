import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { disposeDecorations } from './highlighter';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel("CodeLens AI");
    outputChannel.appendLine("CodeLens AI is now active.");

    registerCommands(context, outputChannel);

    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'c' || document.languageId === 'python' || document.languageId === 'javascript') {
            vscode.commands.executeCommand('codelens.scanFile');
        }
    });
}

export function deactivate() {
    disposeDecorations();
}
