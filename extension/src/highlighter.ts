import * as vscode from 'vscode';
import { LineRisk } from './api';

const decorators = new Map<string, vscode.TextEditorDecorationType>([
    ['high', vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.15)',
        isWholeLine: true
    })],
    ['medium', vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 165, 0, 0.15)',
        isWholeLine: true
    })],
    ['low', vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
        isWholeLine: true
    })]
]);

export function highlightLines(editor: vscode.TextEditor, riskyLines: LineRisk[]) {
    clearHighlights(editor);
    
    const high: vscode.Range[] = [];
    const medium: vscode.Range[] = [];
    const low: vscode.Range[] = [];

    riskyLines.forEach(risk => {
        const range = editor.document.lineAt(risk.line).range;
        if (risk.score > 0.7) {
            high.push(range);
        } else if (risk.score > 0.3) {
            medium.push(range);
        } else {
            low.push(range);
        }
    });

    editor.setDecorations(decorators.get('high')!, high);
    editor.setDecorations(decorators.get('medium')!, medium);
    editor.setDecorations(decorators.get('low')!, low);
}

export function clearHighlights(editor: vscode.TextEditor) {
    for (const decoration of decorators.values()) {
        editor.setDecorations(decoration, []);
    }
}

export function disposeDecorations() {
    for (const decoration of decorators.values()) {
        decoration.dispose();
    }
}
