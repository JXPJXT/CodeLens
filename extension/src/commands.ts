import * as vscode from 'vscode';
import { analyzeCode, getReview } from './api';
import { highlightLines, clearHighlights } from './highlighter';
import { showPanel } from './panel';

export function registerCommands(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    context.subscriptions.push(vscode.commands.registerCommand('codelens.explainLine', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const line = editor.selection.active.line;
        const code = editor.document.getText();
        const language = editor.document.languageId;

        outputChannel.appendLine(`Explaining line ${line + 1} for ${language} file`);
        const review = await getReview(code, language, line);
        
        if (review) {
            showPanel(context.extensionUri, { type: 'review', comment: review.comment, score: 0, code });
        } else {
            outputChannel.appendLine("Failed to get review");
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('codelens.scanFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText();
        const language = editor.document.languageId;

        outputChannel.appendLine(`Scanning ${language} file`);
        const result = await analyzeCode(code, language);

        if (result) {
            highlightLines(editor, result.risky_lines);
            showPanel(context.extensionUri, { 
                type: 'scan', 
                score: result.risk_score, 
                riskyLines: result.risky_lines,
                code 
            });
        } else {
            outputChannel.appendLine("Failed to scan file");
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('codelens.clearAll', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) clearHighlights(editor);
    }));
}
