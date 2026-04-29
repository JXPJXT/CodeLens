"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCode = analyzeCode;
exports.getReview = getReview;
exports.sendFeedback = sendFeedback;
const vscode = require("vscode");
function getBackendUrl() {
    const config = vscode.workspace.getConfiguration('codelens');
    return config.get('backendUrl', 'http://localhost:8000');
}
async function analyzeCode(code, language) {
    try {
        const response = await fetch(`${getBackendUrl()}/analyze/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language })
        });
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
    catch (e) {
        return null;
    }
}
async function getReview(code, language, line) {
    try {
        const response = await fetch(`${getBackendUrl()}/review/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language, line })
        });
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
    catch (e) {
        return null;
    }
}
async function sendFeedback(code, prediction, correct) {
    try {
        await fetch(`${getBackendUrl()}/feedback/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, prediction, correct })
        });
    }
    catch (e) {
        // Silent fail
    }
}
//# sourceMappingURL=api.js.map