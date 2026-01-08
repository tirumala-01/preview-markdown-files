import * as vscode from 'vscode';

/**
 * Extension configuration settings loaded from VS Code settings
 */
export interface ExtensionConfig {
    /** Enable/disable the extension */
    enabled: boolean;
    /** Open preview to the side (true) or in same editor group (false) */
    openPreviewToSide: boolean;
    /** Automatically close preview when markdown file is closed */
    autoClosePreview: boolean;
    /** Open preview when viewing git diff */
    openOnGitDiff: boolean;
    /** Show only the preview panel, close the source editor */
    previewOnlyMode: boolean;
    /** Keep focus in the source editor after opening preview */
    preserveFocus: boolean;
    /** Comma-separated list of enabled languages */
    languages: string;
}

/**
 * Supported language identifiers and their corresponding preview commands
 */
export type SupportedLanguage = 'markdown' | 'asciidoc' | 'restructuredtext';

/**
 * Map of language IDs to their preview commands
 */
export const PREVIEW_COMMANDS: Record<SupportedLanguage, { toSide: string; sameGroup: string }> = {
    'markdown': {
        toSide: 'markdown.showPreviewToSide',
        sameGroup: 'markdown.showPreview'
    },
    'asciidoc': {
        toSide: 'asciidoc.showPreviewToSide',
        sameGroup: 'asciidoc.showPreview'
    },
    'restructuredtext': {
        toSide: 'restructuredtext.showPreviewToSide',
        sameGroup: 'restructuredtext.showPreview'
    }
};

/**
 * Map of language IDs to expected preview viewType patterns
 */
export const PREVIEW_VIEW_TYPES: Record<SupportedLanguage, string> = {
    'markdown': 'markdown.preview',
    'asciidoc': 'asciidoc.preview',
    'restructuredtext': 'restructuredtext.preview'
};

/**
 * File extensions mapped to language IDs
 */
export const FILE_EXTENSIONS: Record<string, SupportedLanguage> = {
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.mdown': 'markdown',
    '.mkd': 'markdown',
    '.adoc': 'asciidoc',
    '.asciidoc': 'asciidoc',
    '.rst': 'restructuredtext',
    '.rest': 'restructuredtext'
};

/**
 * Represents a tracked preview-source relationship
 */
export interface TrackedPreview {
    /** URI of the source document */
    sourceUri: vscode.Uri;
    /** Language ID of the source document */
    languageId: SupportedLanguage;
    /** Timestamp when the preview was opened */
    openedAt: number;
}
