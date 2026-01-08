import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { DiffDetector } from './diffDetector';
import { TabTracker } from './tabTracker';
import { SupportedLanguage, PREVIEW_COMMANDS, FILE_EXTENSIONS } from './types';
import { logger } from './logger';
import * as path from 'path';

/**
 * Core manager for handling markdown preview opening and closing.
 * Implements all the unique features:
 * - Auto-open preview when markdown files open
 * - Auto-close preview when source file closes
 * - Git diff awareness (skip preview in diff mode)
 * - Preview-only mode (hide source editor)
 * - Preserve focus (keep cursor in source)
 */
export class PreviewManager implements vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];

    // Track documents we've already opened previews for to avoid duplicates
    private _openedPreviews: Set<string> = new Set();

    // Track URIs closed by preview-only mode (to prevent auto-close from killing preview)
    private _previewOnlyClosedUris: Set<string> = new Set();

    // Debounce document opens to handle VS Code's event batching
    private _pendingOpens: Map<string, NodeJS.Timeout> = new Map();
    private readonly OPEN_DEBOUNCE_MS = 50;

    constructor(
        private readonly configManager: ConfigManager,
        private readonly diffDetector: DiffDetector,
        private readonly tabTracker: TabTracker
    ) {
        this.registerEventListeners();
    }

    /**
     * Register all VS Code event listeners
     */
    private registerEventListeners(): void {
        // Listen for document opens to trigger auto-preview
        this._disposables.push(
            vscode.workspace.onDidOpenTextDocument(doc => {
                this.handleDocumentOpen(doc);
            })
        );

        // Listen for tab changes to handle auto-close
        this._disposables.push(
            vscode.window.tabGroups.onDidChangeTabs(event => {
                this.handleTabChanges(event);
            })
        );

        // Listen for active editor changes (for edge cases)
        this._disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.handleEditorActivation(editor);
                }
            })
        );

        // Clean up tracking when documents are fully closed
        this._disposables.push(
            vscode.workspace.onDidCloseTextDocument(doc => {
                // Remove from our tracking set
                this._openedPreviews.delete(doc.uri.toString());
            })
        );
    }

    /**
     * Handle document open event - potentially open preview
     */
    private handleDocumentOpen(document: vscode.TextDocument): void {
        const config = this.configManager.config;

        // Quick exit checks
        if (!config.enabled) {
            return;
        }

        // Check if it's a supported language
        if (!this.isSupportedDocument(document)) {
            return;
        }

        // Check if language is enabled in settings
        const languageId = this.getLanguageId(document);
        if (!languageId || !this.configManager.isLanguageEnabled(languageId)) {
            return;
        }

        // Debounce the open to handle VS Code's event batching
        const key = document.uri.toString();
        const existing = this._pendingOpens.get(key);
        if (existing) {
            clearTimeout(existing);
        }

        const timeout = setTimeout(() => {
            this._pendingOpens.delete(key);
            this.openPreviewIfNeeded(document);
        }, this.OPEN_DEBOUNCE_MS);

        this._pendingOpens.set(key, timeout);
    }

    /**
     * Open preview for a document if conditions are met
     */
    private async openPreviewIfNeeded(document: vscode.TextDocument): Promise<void> {
        const config = this.configManager.config;
        const key = document.uri.toString();

        // Skip if we already opened a preview for this document
        if (this._openedPreviews.has(key)) {
            return;
        }

        // Skip if preview is already open (unless in preview-only mode where we replace it)
        if (!config.previewOnlyMode && this.tabTracker.isPreviewOpen(document.uri)) {
            this._openedPreviews.add(key);
            return;
        }

        // Check git diff mode
        if (!config.openOnGitDiff && this.diffDetector.isDiffEditor()) {
            return;
        }

        // Check if document is in a diff view
        if (!config.openOnGitDiff && this.diffDetector.isDocumentInDiffView(document.uri)) {
            return;
        }

        // Get the appropriate preview command
        const languageId = this.getLanguageId(document);
        if (!languageId) {
            return;
        }

        const commands = PREVIEW_COMMANDS[languageId];
        const command = config.openPreviewToSide ? commands.toSide : commands.sameGroup;

        // Track that we're opening a preview
        this._openedPreviews.add(key);

        try {
            // Store active editor for focus restoration
            const activeEditor = vscode.window.activeTextEditor;
            const activeViewColumn = activeEditor?.viewColumn;

            // Handle preview-only mode: close existing previews first for single-preview experience
            if (config.previewOnlyMode) {
                await this.closeAllMarkdownPreviews();
            }

            // Open the preview
            await vscode.commands.executeCommand(command, document.uri);

            // Handle preview-only mode: close the source file
            if (config.previewOnlyMode) {
                await this.closeSourceEditor(document.uri);
            }
            // Handle preserve focus
            else if (config.preserveFocus && activeEditor && activeViewColumn) {
                // Restore focus to the source editor
                await this.delay(50);
                await vscode.window.showTextDocument(activeEditor.document, {
                    viewColumn: activeViewColumn,
                    preserveFocus: false
                });
            }
        } catch (error) {
            // Command might not be available (e.g., asciidoc extension not installed)
            this._openedPreviews.delete(key);

            if (error instanceof Error && error.message.includes('command')) {
                // Likely missing extension for asciidoc/rst
                logger.warn(`Preview command not available for ${languageId}. Is the required extension installed?`);
            } else {
                logger.error(`Failed to open preview for ${path.basename(document.uri.fsPath)}`, error);
            }
        }
    }

    /**
     * Handle tab changes - close preview when source closes
     */
    private handleTabChanges(event: vscode.TabChangeEvent): void {
        const config = this.configManager.config;

        if (!config.enabled || !config.autoClosePreview) {
            return;
        }

        // Process closed tabs
        for (const closedTab of event.closed) {
            // Check if it's a text file tab (not diff, not webview)
            if (closedTab.input instanceof vscode.TabInputText) {
                const uri = closedTab.input.uri;
                const key = uri.toString();

                if (this.tabTracker.isSupported(uri)) {
                    // Check if this was closed by preview-only mode
                    // If so, DON'T close the preview - that's the whole point!
                    if (this._previewOnlyClosedUris.has(key)) {
                        logger.debug(`Skipping auto-close for preview-only mode: ${path.basename(uri.fsPath)}`);
                        this._previewOnlyClosedUris.delete(key);
                        // Don't remove from _openedPreviews - preview is still "open" for this file
                        continue;
                    }

                    // Close the corresponding preview
                    this.tabTracker.closePreviewForFile(uri);
                    // Clean up tracking
                    this._openedPreviews.delete(key);
                }
            }
        }

        // Periodic cleanup
        if (Math.random() < 0.1) {
            this.tabTracker.cleanupDebounceMap();
        }
    }

    /**
     * Handle editor activation for edge cases.
     * This handles cases where a document is shown but onDidOpenTextDocument
     * might not fire (e.g., switching between already-open tabs).
     */
    private handleEditorActivation(editor: vscode.TextEditor): void {
        const config = this.configManager.config;

        if (!config.enabled) {
            return;
        }

        // In preview-only mode, skip editor activation handling entirely.
        // We only react to document opens, not focus changes.
        if (config.previewOnlyMode) {
            return;
        }

        const document = editor.document;
        if (!this.isSupportedDocument(document)) {
            return;
        }

        const languageId = this.getLanguageId(document);
        if (!languageId || !this.configManager.isLanguageEnabled(languageId)) {
            return;
        }

        const key = document.uri.toString();

        // Skip if there's already a pending open or we've handled this document
        if (this._pendingOpens.has(key) || this._openedPreviews.has(key)) {
            return;
        }

        // Only open if preview isn't already open
        if (!this.tabTracker.isPreviewOpen(document.uri)) {
            this.openPreviewIfNeeded(document);
        }
    }

    /**
     * Close the source editor tab for preview-only mode.
     * Marks the URI so auto-close doesn't kill the preview.
     */
    private async closeSourceEditor(uri: vscode.Uri): Promise<void> {
        const key = uri.toString();

        // Mark this URI as intentionally closed by preview-only mode
        // This prevents handleTabChanges from auto-closing the preview
        this._previewOnlyClosedUris.add(key);

        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputText) {
                    if (tab.input.uri.toString() === key) {
                        try {
                            await vscode.window.tabGroups.close(tab);
                            logger.debug(`Closed source editor for preview-only mode: ${path.basename(uri.fsPath)}`);
                            return;
                        } catch (error) {
                            logger.debug(`Could not close source editor (may already be closed)`, error);
                            // Remove from tracking if close failed
                            this._previewOnlyClosedUris.delete(key);
                        }
                    }
                }
            }
        }
    }

    /**
     * Close all markdown/markup preview tabs.
     * Used in preview-only mode to ensure only one preview is shown at a time.
     */
    private async closeAllMarkdownPreviews(): Promise<void> {
        const previewViewTypes = ['markdown.preview', 'asciidoc.preview', 'restructuredtext.preview'];
        const tabsToClose: vscode.Tab[] = [];

        // Collect all preview tabs
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputWebview) {
                    // Check if it's a markdown-like preview
                    if (previewViewTypes.includes(tab.input.viewType) ||
                        tab.label.startsWith('Preview ')) {
                        tabsToClose.push(tab);
                    }
                }
            }
        }

        // Close all collected preview tabs
        if (tabsToClose.length > 0) {
            logger.debug(`Closing ${tabsToClose.length} existing preview(s) for preview-only mode`);
            try {
                await vscode.window.tabGroups.close(tabsToClose);
            } catch (error) {
                logger.debug(`Could not close some previews`, error);
            }
        }
    }

    /**
     * Check if a document is a supported markup file
     */
    private isSupportedDocument(document: vscode.TextDocument): boolean {
        // Check by language ID first (more reliable)
        const langId = document.languageId;
        if (langId === 'markdown' || langId === 'asciidoc' || langId === 'restructuredtext') {
            return true;
        }

        // Fallback to extension check
        const ext = path.extname(document.uri.fsPath).toLowerCase();
        return ext in FILE_EXTENSIONS;
    }

    /**
     * Get the language ID for a document
     */
    private getLanguageId(document: vscode.TextDocument): SupportedLanguage | undefined {
        const langId = document.languageId;
        if (langId === 'markdown' || langId === 'asciidoc' || langId === 'restructuredtext') {
            return langId;
        }

        // Fallback to extension
        const ext = path.extname(document.uri.fsPath).toLowerCase();
        return FILE_EXTENSIONS[ext];
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Manually trigger preview for current editor (useful for commands)
     */
    async openPreviewForActiveEditor(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (editor && this.isSupportedDocument(editor.document)) {
            // Force open even if already tracked
            this._openedPreviews.delete(editor.document.uri.toString());
            await this.openPreviewIfNeeded(editor.document);
        }
    }

    dispose(): void {
        // Clear pending timeouts
        for (const timeout of this._pendingOpens.values()) {
            clearTimeout(timeout);
        }
        this._pendingOpens.clear();
        this._openedPreviews.clear();
        this._previewOnlyClosedUris.clear();
        this._disposables.forEach(d => d.dispose());
    }
}
