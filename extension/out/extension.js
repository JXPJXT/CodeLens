"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const commands_1 = require("./commands");
const highlighter_1 = require("./highlighter");
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel("CodeLens AI");
    outputChannel.appendLine("CodeLens AI is now active.");
    (0, commands_1.registerCommands)(context, outputChannel);
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'c' || document.languageId === 'python' || document.languageId === 'javascript') {
            vscode.commands.executeCommand('codelens.scanFile');
        }
    });
}
function deactivate() {
    (0, highlighter_1.disposeDecorations)();
}
//# sourceMappingURL=extension.js.map