import * as vscode from 'vscode';
import * as path from 'path';
import { SupportedLanguage, PREVIEW_VIEW_TYPES, FILE_EXTENSIONS } from './types';
import { logger } from './logger';

/**
 * Tracks the relationship between source files and their preview tabs.
 * Used to close preview tabs when their corresponding source files are closed.
 *
 * Key insight: VS Code preview tabs have a specific label format "Preview filename.md"
 * and use TabInputWebview with a viewType like "markdown.preview".
 */
export class TabTracker implements vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];

    // Debounce tracking to handle VS Code firing multiple events
    private _lastProcessedClose: Map<string, number> = new Map();
    private readonly DEBOUNCE_MS = 100;

    constructor() {}

    /**
     * Get the expected preview tab label for a source file.
     * VS Code formats preview labels as "Preview filename.ext"
     */
    getExpectedPreviewLabel(uri: vscode.Uri): string {
        const filename = path.basename(uri.fsPath);
        return `Preview ${filename}`;
    }

    /**
     * Check if a URI is a supported markup file based on extension.
     */
    isSupported(uri: vscode.Uri): boolean {
        const ext = path.extname(uri.fsPath).toLowerCase();
        return ext in FILE_EXTENSIONS;
    }

    /**
     * Get the language ID for a URI based on file extension.
     */
    getLanguageId(uri: vscode.Uri): SupportedLanguage | undefined {
        const ext = path.extname(uri.fsPath).toLowerCase();
        return FILE_EXTENSIONS[ext];
    }

    /**
     * Find the preview tab for a given source file URI.
     * Searches all tab groups for a WebView tab with matching label.
     *
     * @param uri The source document URI
     * @returns The preview tab if found
     */
    findPreviewTab(uri: vscode.Uri): vscode.Tab | undefined {
        const expectedLabel = this.getExpectedPreviewLabel(uri);
        const languageId = this.getLanguageId(uri);

        if (!languageId) {
            return undefined;
        }

        const expectedViewType = PREVIEW_VIEW_TYPES[languageId];

        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputWebview) {
                    // Match by label (most reliable) or viewType
                    if (tab.label === expectedLabel) {
                        return tab;
                    }
                    // Fallback: check viewType if label doesn't match exactly
                    if (tab.input.viewType === expectedViewType &&
                        tab.label.includes(path.basename(uri.fsPath))) {
                        return tab;
                    }
                }
            }
        }
        return undefined;
    }

    /**
     * Check if a preview is already open for the given source file.
     */
    isPreviewOpen(uri: vscode.Uri): boolean {
        return this.findPreviewTab(uri) !== undefined;
    }

    /**
     * Close the preview tab for a given source file.
     * Uses debouncing to prevent duplicate close attempts.
     *
     * @param uri The source document URI whose preview should be closed
     * @returns true if a preview was found and close was initiated
     */
    async closePreviewForFile(uri: vscode.Uri): Promise<boolean> {
        const key = uri.toString();
        const now = Date.now();
        const lastProcessed = this._lastProcessedClose.get(key) || 0;

        // Debounce: skip if we just processed this URI
        if (now - lastProcessed < this.DEBOUNCE_MS) {
            return false;
        }
        this._lastProcessedClose.set(key, now);

        const previewTab = this.findPreviewTab(uri);
        if (previewTab) {
            try {
                await vscode.window.tabGroups.close(previewTab);
                logger.debug(`Closed preview for ${path.basename(uri.fsPath)}`);
                return true;
            } catch (error) {
                // Tab may have already been closed
                logger.debug(`Could not close preview (may already be closed)`, error);
                return false;
            }
        }
        return false;
    }

    /**
     * Clean up old debounce entries to prevent memory leaks.
     * Called periodically or when the map gets large.
     */
    cleanupDebounceMap(): void {
        const now = Date.now();
        const cutoff = now - (this.DEBOUNCE_MS * 10);

        for (const [key, timestamp] of this._lastProcessedClose.entries()) {
            if (timestamp < cutoff) {
                this._lastProcessedClose.delete(key);
            }
        }
    }

    dispose(): void {
        this._lastProcessedClose.clear();
        this._disposables.forEach(d => d.dispose());
    }
}
