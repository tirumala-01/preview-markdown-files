import * as vscode from 'vscode';

/**
 * Detects whether the current editor context is a git diff/compare view.
 * This is important because we typically don't want to auto-open preview
 * when the user is reviewing changes in a diff view.
 */
export class DiffDetector {
    /**
     * Check if the currently active tab is a diff editor.
     * Uses VS Code's Tab API to inspect the tab input type.
     *
     * @returns true if the active tab is showing a diff view
     */
    isDiffEditor(): boolean {
        const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;

        if (!activeTab) {
            return false;
        }

        // TabInputTextDiff indicates a side-by-side or inline diff view
        // This covers git diffs, file comparisons, etc.
        return activeTab.input instanceof vscode.TabInputTextDiff;
    }

    /**
     * Check if a specific document is currently open in a diff view.
     * Searches all tab groups for diff tabs containing this URI.
     *
     * @param uri The document URI to check
     * @returns true if the document is shown in any diff tab
     */
    isDocumentInDiffView(uri: vscode.Uri): boolean {
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputTextDiff) {
                    const diffInput = tab.input;
                    // Check both original and modified sides of the diff
                    if (diffInput.original.toString() === uri.toString() ||
                        diffInput.modified.toString() === uri.toString()) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Get information about a diff view tab for a given URI.
     *
     * @param uri The document URI to find in diff views
     * @returns The diff tab if found, undefined otherwise
     */
    findDiffTab(uri: vscode.Uri): vscode.Tab | undefined {
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputTextDiff) {
                    const diffInput = tab.input;
                    if (diffInput.original.toString() === uri.toString() ||
                        diffInput.modified.toString() === uri.toString()) {
                        return tab;
                    }
                }
            }
        }
        return undefined;
    }
}
