import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { DiffDetector } from './diffDetector';
import { TabTracker } from './tabTracker';
import { PreviewManager } from './previewManager';
import { logger } from './logger';

// Module-level references for cleanup
let configManager: ConfigManager | undefined;
let diffDetector: DiffDetector | undefined;
let tabTracker: TabTracker | undefined;
let previewManager: PreviewManager | undefined;

/**
 * Extension activation - called when VS Code activates the extension.
 * Activation triggers are defined in package.json activationEvents:
 * - onLanguage:markdown
 * - onLanguage:asciidoc
 * - onLanguage:restructuredtext
 */
export function activate(context: vscode.ExtensionContext): void {
    logger.info('Extension activating...');

    try {
        // Initialize components
        configManager = new ConfigManager();
        diffDetector = new DiffDetector();
        tabTracker = new TabTracker();
        previewManager = new PreviewManager(configManager, diffDetector, tabTracker);

        // Register commands
        const toggleEnabledCommand = vscode.commands.registerCommand(
            'previewMarkdown.toggleEnabled',
            async () => {
                try {
                    await configManager?.toggleEnabled();
                    const enabled = configManager?.config.enabled;
                    vscode.window.showInformationMessage(
                        `Auto Preview Markdown: ${enabled ? 'Enabled' : 'Disabled'}`
                    );
                    logger.info(`Extension ${enabled ? 'enabled' : 'disabled'} by user`);
                } catch (error) {
                    logger.error('Failed to toggle extension', error);
                    vscode.window.showErrorMessage('Failed to toggle Auto Preview Markdown');
                }
            }
        );

        const togglePreviewOnlyCommand = vscode.commands.registerCommand(
            'previewMarkdown.togglePreviewOnlyMode',
            async () => {
                try {
                    await configManager?.togglePreviewOnlyMode();
                    const previewOnly = configManager?.config.previewOnlyMode;
                    vscode.window.showInformationMessage(
                        `Preview-Only Mode: ${previewOnly ? 'Enabled' : 'Disabled'}`
                    );
                    logger.info(`Preview-only mode ${previewOnly ? 'enabled' : 'disabled'} by user`);
                } catch (error) {
                    logger.error('Failed to toggle preview-only mode', error);
                    vscode.window.showErrorMessage('Failed to toggle Preview-Only Mode');
                }
            }
        );

        // Add all disposables to context for cleanup
        context.subscriptions.push(
            { dispose: () => logger.dispose() },
            configManager,
            tabTracker,
            previewManager,
            toggleEnabledCommand,
            togglePreviewOnlyCommand
        );

        // Handle already-open documents (extension activated after files were opened)
        processExistingDocuments();

        logger.info('Extension activated successfully');
    } catch (error) {
        logger.error('Failed to activate extension', error);
        vscode.window.showErrorMessage('Auto Preview Markdown failed to activate. Check the output channel for details.');
        throw error;
    }
}

/**
 * Process documents that were already open when the extension activated.
 * This handles the case where the user opens a markdown file before the
 * extension is loaded.
 */
function processExistingDocuments(): void {
    // Small delay to let VS Code finish initializing
    setTimeout(() => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const doc = activeEditor.document;
            const supportedLanguages = ['markdown', 'asciidoc', 'restructuredtext'];

            if (supportedLanguages.includes(doc.languageId)) {
                // Trigger the preview manager to check this document
                previewManager?.openPreviewForActiveEditor();
            }
        }
    }, 100);
}

/**
 * Extension deactivation - called when VS Code shuts down or disables the extension.
 * Cleanup is handled automatically by disposables in context.subscriptions.
 */
export function deactivate(): void {
    logger.info('Extension deactivating...');

    // Clear references
    configManager = undefined;
    diffDetector = undefined;
    tabTracker = undefined;
    previewManager = undefined;
}
