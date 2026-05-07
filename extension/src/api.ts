import * as vscode from 'vscode';

export interface LineRisk {
    line: number;
    score: number;
}

export interface AnalyzeResponse {
    risk_score: number;
    is_buggy: boolean;
    risky_lines: LineRisk[];
    mode: string;
}

export interface ReviewResponse {
    comment: string;
    prompt_type: string;
    cached: boolean;
}

function getBackendUrl(): string {
    const config = vscode.workspace.getConfiguration('codelens');
    return config.get<string>('backendUrl', 'http://localhost:8000');
}

export async function analyzeCode(code: string, language: string): Promise<AnalyzeResponse | null> {
    try {
        const response = await fetch(`${getBackendUrl()}/analyze/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json() as AnalyzeResponse;
    } catch (e: any) {
        return null;
    }
}

export async function getReview(code: string, language: string, line?: number): Promise<ReviewResponse | null> {
    try {
        const response = await fetch(`${getBackendUrl()}/review/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language, line })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json() as ReviewResponse;
    } catch (e: any) {
        return null;
    }
}

export async function sendFeedback(code: string, prediction: number, correct: boolean): Promise<void> {
    try {
        await fetch(`${getBackendUrl()}/feedback/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, prediction, correct })
        });
    } catch (e) {
        // Silent fail
    }
}

export interface FixResponse {
    fixed_code: string;
    explanation: string;
}

export async function getFix(code: string, language: string): Promise<FixResponse | null> {
    try {
        const response = await fetch(`${getBackendUrl()}/fix/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json() as FixResponse;
    } catch (e: any) {
        return null;
    }
}
