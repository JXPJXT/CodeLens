import * as vscode from 'vscode';
import { sendFeedback } from './api';

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function showPanel(extensionUri: vscode.Uri, data: any) {
    if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.Two);
    } else {
        currentPanel = vscode.window.createWebviewPanel(
            'codelensReview',
            'CodeLens Review',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        currentPanel.onDidDispose(() => { currentPanel = undefined; });
        
        currentPanel.webview.onDidReceiveMessage(message => {
            if (message.command === 'feedback') {
                sendFeedback(data.code, data.score, message.correct);
                vscode.window.showInformationMessage('Thank you for your feedback!');
            }
        });
    }

    currentPanel.webview.html = getWebviewContent(data);
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderMarkdown(text: string): string {
    let html = escapeHtml(text);

    // Code blocks with syntax highlighting placeholder
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
        return `<div class="code-block"><div class="code-lang">${lang || 'code'}</div><pre><code>${code.trim()}</code></pre></div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');

    // Bullet points
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="list-item"><span class="list-num">$1.</span> $2</div>');
    html = html.replace(/^\s*-\s+(.+)$/gm, '<div class="list-item bullet">• $1</div>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
}

function getWebviewContent(data: any): string {
    const scorePercent = Math.round((data.score || 0) * 100);
    
    let riskLevel = 'Low';
    let riskColor = '#4ade80';
    let riskBg = 'rgba(74, 222, 128, 0.1)';
    let riskIcon = '✅';
    if (scorePercent > 60) {
        riskLevel = 'High';
        riskColor = '#f87171';
        riskBg = 'rgba(248, 113, 113, 0.1)';
        riskIcon = '🔴';
    } else if (scorePercent > 30) {
        riskLevel = 'Medium';
        riskColor = '#fb923c';
        riskBg = 'rgba(251, 146, 60, 0.1)';
        riskIcon = '🟡';
    }
    
    let content = '';
    if (data.type === 'scan') {
        const riskyLines = (data.riskyLines || []).slice(0, 15);
        const highCount = riskyLines.filter((r: any) => r.score > 0.7).length;
        const medCount = riskyLines.filter((r: any) => r.score > 0.3 && r.score <= 0.7).length;
        const lowCount = riskyLines.filter((r: any) => r.score <= 0.3).length;

        const lineItems = riskyLines.map((r: any) => {
            const pct = (r.score * 100).toFixed(0);
            let dotColor = '#4ade80';
            let severity = 'low';
            if (r.score > 0.7) { dotColor = '#f87171'; severity = 'high'; }
            else if (r.score > 0.3) { dotColor = '#fb923c'; severity = 'med'; }
            return `
                <div class="line-item ${severity}">
                    <div class="line-left">
                        <span class="dot" style="background:${dotColor}"></span>
                        <span class="line-label">Line ${r.line + 1}</span>
                    </div>
                    <div class="line-bar-wrap">
                        <div class="line-bar" style="width:${pct}%; background:${dotColor}"></div>
                    </div>
                    <span class="line-pct" style="color:${dotColor}">${pct}%</span>
                </div>`;
        }).join('');

        content = `
            <div class="risk-card" style="border-color:${riskColor}; background:${riskBg}">
                <div class="risk-header">
                    <span class="risk-icon">${riskIcon}</span>
                    <div>
                        <div class="risk-title">${riskLevel} Risk</div>
                        <div class="risk-subtitle">Overall vulnerability score</div>
                    </div>
                    <div class="risk-score" style="color:${riskColor}">${scorePercent}%</div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${scorePercent}%; background:${riskColor}"></div>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-chip high-chip"><span class="stat-dot high-dot"></span>${highCount} High</div>
                <div class="stat-chip med-chip"><span class="stat-dot med-dot"></span>${medCount} Medium</div>
                <div class="stat-chip low-chip"><span class="stat-dot low-dot"></span>${lowCount} Low</div>
            </div>

            <div class="section-title">Risky Lines</div>
            <div class="lines-list">${lineItems}</div>
        `;
    } else {
        content = `
            <div class="review-header">
                <span class="review-icon">🤖</span>
                <div>
                    <div class="review-title">AI Code Review</div>
                    <div class="review-subtitle">Powered by Llama 3.1</div>
                </div>
            </div>
            <div class="review-body">${renderMarkdown(data.comment || '')}</div>
        `;
    }

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    line-height: 1.6;
                }

                /* Risk Card */
                .risk-card {
                    border: 1px solid;
                    border-radius: 12px;
                    padding: 18px;
                    margin-bottom: 16px;
                }
                .risk-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .risk-icon { font-size: 28px; }
                .risk-title { font-size: 16px; font-weight: 700; }
                .risk-subtitle { font-size: 11px; opacity: 0.6; margin-top: 2px; }
                .risk-score {
                    margin-left: auto;
                    font-size: 32px;
                    font-weight: 800;
                    font-variant-numeric: tabular-nums;
                }
                .progress-track {
                    width: 100%;
                    height: 6px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 3px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.6s ease;
                }

                /* Stats */
                .stats-row {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                .stat-chip {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .stat-dot { width: 8px; height: 8px; border-radius: 50%; }
                .high-dot { background: #f87171; }
                .med-dot { background: #fb923c; }
                .low-dot { background: #4ade80; }

                /* Lines List */
                .section-title {
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.5;
                    margin-bottom: 10px;
                }
                .lines-list { display: flex; flex-direction: column; gap: 6px; }
                .line-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    transition: background 0.15s;
                }
                .line-item:hover { background: rgba(255,255,255,0.06); }
                .line-left { display: flex; align-items: center; gap: 8px; min-width: 80px; }
                .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .line-label { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
                .line-bar-wrap {
                    flex: 1;
                    height: 4px;
                    background: rgba(255,255,255,0.06);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .line-bar { height: 100%; border-radius: 2px; }
                .line-pct { font-size: 12px; font-weight: 700; min-width: 36px; text-align: right; }

                /* Review */
                .review-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 18px;
                    padding-bottom: 14px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }
                .review-icon { font-size: 28px; }
                .review-title { font-size: 16px; font-weight: 700; }
                .review-subtitle { font-size: 11px; opacity: 0.5; margin-top: 2px; }
                .review-body { font-size: 13px; line-height: 1.7; }
                .review-body p { margin-bottom: 10px; }
                .review-body h3 { font-size: 15px; margin: 16px 0 8px; }
                .review-body h4 { font-size: 14px; margin: 14px 0 6px; }
                .review-body strong { color: #60a5fa; }
                .review-body .list-item {
                    padding: 4px 0 4px 8px;
                    border-left: 2px solid rgba(255,255,255,0.1);
                    margin: 4px 0;
                }
                .review-body .list-num { font-weight: 700; color: #60a5fa; }

                /* Code blocks */
                .code-block {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    margin: 12px 0;
                    overflow: hidden;
                }
                .code-lang {
                    padding: 4px 12px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.4;
                    background: rgba(255,255,255,0.03);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .code-block pre {
                    padding: 12px;
                    margin: 0;
                    overflow-x: auto;
                    font-size: 12px;
                    line-height: 1.5;
                }
                .code-block code {
                    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
                }
                .inline-code {
                    background: rgba(255,255,255,0.08);
                    padding: 1px 5px;
                    border-radius: 4px;
                    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
                    font-size: 12px;
                }

                /* Feedback */
                .feedback-bar {
                    margin-top: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .feedback-label { font-size: 12px; opacity: 0.5; }
                .fb-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.04);
                    color: var(--vscode-foreground);
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .fb-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
                .fb-btn.yes:hover { background: rgba(74, 222, 128, 0.15); border-color: #4ade80; color: #4ade80; }
                .fb-btn.no:hover { background: rgba(248, 113, 113, 0.15); border-color: #f87171; color: #f87171; }
            </style>
        </head>
        <body>
            ${content}
            <div class="feedback-bar">
                <span class="feedback-label">Was this helpful?</span>
                <button class="fb-btn yes" onclick="sendFeedback(true)">👍 Correct</button>
                <button class="fb-btn no" onclick="sendFeedback(false)">👎 Wrong</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function sendFeedback(correct) {
                    vscode.postMessage({ command: 'feedback', correct: correct });
                }
            </script>
        </body>
        </html>
    `;
}
