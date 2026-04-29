"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = registerCommands;
const vscode = require("vscode");
const api_1 = require("./api");
const highlighter_1 = require("./highlighter");
const panel_1 = require("./panel");
function registerCommands(context, outputChannel) {
    context.subscriptions.push(vscode.commands.registerCommand('codelens.explainLine', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const line = editor.selection.active.line;
        const code = editor.document.getText();
        const language = editor.document.languageId;
        outputChannel.appendLine(`Explaining line ${line + 1} for ${language} file`);
        const review = await (0, api_1.getReview)(code, language, line);
        if (review) {
            (0, panel_1.showPanel)(context.extensionUri, { type: 'review', comment: review.comment, score: 0, code });
        }
        else {
            outputChannel.appendLine("Failed to get review");
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codelens.scanFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const code = editor.document.getText();
        const language = editor.document.languageId;
        outputChannel.appendLine(`Scanning ${language} file`);
        const result = await (0, api_1.analyzeCode)(code, language);
        if (result) {
            (0, highlighter_1.highlightLines)(editor, result.risky_lines);
            (0, panel_1.showPanel)(context.extensionUri, {
                type: 'scan',
                score: result.risk_score,
                riskyLines: result.risky_lines,
                code
            });
        }
        else {
            outputChannel.appendLine("Failed to scan file");
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codelens.clearAll', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor)
            (0, highlighter_1.clearHighlights)(editor);
    }));
}
//# sourceMappingURL=commands.js.map