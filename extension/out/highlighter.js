"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightLines = highlightLines;
exports.clearHighlights = clearHighlights;
exports.disposeDecorations = disposeDecorations;
const vscode = require("vscode");
const decorators = new Map([
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
function highlightLines(editor, riskyLines) {
    clearHighlights(editor);
    const high = [];
    const medium = [];
    const low = [];
    riskyLines.forEach(risk => {
        const range = editor.document.lineAt(risk.line).range;
        if (risk.score > 0.7) {
            high.push(range);
        }
        else if (risk.score > 0.3) {
            medium.push(range);
        }
        else {
            low.push(range);
        }
    });
    editor.setDecorations(decorators.get('high'), high);
    editor.setDecorations(decorators.get('medium'), medium);
    editor.setDecorations(decorators.get('low'), low);
}
function clearHighlights(editor) {
    for (const decoration of decorators.values()) {
        editor.setDecorations(decoration, []);
    }
}
function disposeDecorations() {
    for (const decoration of decorators.values()) {
        decoration.dispose();
    }
}
//# sourceMappingURL=highlighter.js.map