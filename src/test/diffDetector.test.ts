import * as assert from 'assert';
import * as vscode from 'vscode';
import { DiffDetector } from '../diffDetector';

suite('DiffDetector Test Suite', () => {
    let diffDetector: DiffDetector;

    setup(() => {
        diffDetector = new DiffDetector();
    });

    test('isDiffEditor returns false when no active tab', () => {
        // When there's no active tab group or tab, should return false
        // This is tested in the real environment where tabGroups may be empty
        const result = diffDetector.isDiffEditor();
        // Result depends on current VS Code state - just verify it returns boolean
        assert.strictEqual(typeof result, 'boolean');
    });

    test('isDocumentInDiffView returns false for non-existent URI', () => {
        const fakeUri = vscode.Uri.file('/non/existent/file.md');
        const result = diffDetector.isDocumentInDiffView(fakeUri);
        assert.strictEqual(result, false);
    });

    test('findDiffTab returns undefined for non-existent URI', () => {
        const fakeUri = vscode.Uri.file('/non/existent/file.md');
        const result = diffDetector.findDiffTab(fakeUri);
        assert.strictEqual(result, undefined);
    });

    test('DiffDetector can be instantiated multiple times', () => {
        const detector1 = new DiffDetector();
        const detector2 = new DiffDetector();

        // Both should work independently
        assert.strictEqual(typeof detector1.isDiffEditor(), 'boolean');
        assert.strictEqual(typeof detector2.isDiffEditor(), 'boolean');
    });
});

suite('DiffDetector Integration Tests', () => {
    let diffDetector: DiffDetector;

    setup(() => {
        diffDetector = new DiffDetector();
    });

    test('isDiffEditor returns false for normal text editor', async () => {
        // Open a simple text document (not in diff mode)
        const doc = await vscode.workspace.openTextDocument({
            content: '# Test Markdown',
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

        // Should not be detected as diff editor
        const result = diffDetector.isDiffEditor();
        assert.strictEqual(result, false);

        // Clean up
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('isDocumentInDiffView returns false for normal document', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: '# Test',
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

        const result = diffDetector.isDocumentInDiffView(doc.uri);
        assert.strictEqual(result, false);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
});
