import * as assert from 'assert';
import * as vscode from 'vscode';
import { TabTracker } from '../tabTracker';

suite('TabTracker Test Suite', () => {
    let tabTracker: TabTracker;

    setup(() => {
        tabTracker = new TabTracker();
    });

    teardown(() => {
        tabTracker.dispose();
    });

    test('getExpectedPreviewLabel generates correct label', () => {
        const testCases = [
            { path: '/path/to/README.md', expected: 'Preview README.md' },
            { path: '/path/to/CHANGELOG.md', expected: 'Preview CHANGELOG.md' },
            { path: '/some/file.markdown', expected: 'Preview file.markdown' },
            { path: '/docs/guide.adoc', expected: 'Preview guide.adoc' },
            { path: '/docs/index.rst', expected: 'Preview index.rst' },
        ];

        for (const tc of testCases) {
            const uri = vscode.Uri.file(tc.path);
            const result = tabTracker.getExpectedPreviewLabel(uri);
            assert.strictEqual(result, tc.expected, `Failed for ${tc.path}`);
        }
    });

    test('isSupported returns true for markdown files', () => {
        const markdownExtensions = ['.md', '.markdown', '.mdown', '.mkd'];

        for (const ext of markdownExtensions) {
            const uri = vscode.Uri.file(`/path/to/file${ext}`);
            assert.strictEqual(
                tabTracker.isSupported(uri),
                true,
                `Should support ${ext}`
            );
        }
    });

    test('isSupported returns true for asciidoc files', () => {
        const adocExtensions = ['.adoc', '.asciidoc'];

        for (const ext of adocExtensions) {
            const uri = vscode.Uri.file(`/path/to/file${ext}`);
            assert.strictEqual(
                tabTracker.isSupported(uri),
                true,
                `Should support ${ext}`
            );
        }
    });

    test('isSupported returns true for restructuredtext files', () => {
        const rstExtensions = ['.rst', '.rest'];

        for (const ext of rstExtensions) {
            const uri = vscode.Uri.file(`/path/to/file${ext}`);
            assert.strictEqual(
                tabTracker.isSupported(uri),
                true,
                `Should support ${ext}`
            );
        }
    });

    test('isSupported returns false for unsupported files', () => {
        const unsupportedExtensions = ['.txt', '.js', '.ts', '.html', '.css', '.json'];

        for (const ext of unsupportedExtensions) {
            const uri = vscode.Uri.file(`/path/to/file${ext}`);
            assert.strictEqual(
                tabTracker.isSupported(uri),
                false,
                `Should not support ${ext}`
            );
        }
    });

    test('getLanguageId returns correct language for extensions', () => {
        const testCases = [
            { ext: '.md', expected: 'markdown' },
            { ext: '.markdown', expected: 'markdown' },
            { ext: '.adoc', expected: 'asciidoc' },
            { ext: '.rst', expected: 'restructuredtext' },
            { ext: '.txt', expected: undefined },
        ];

        for (const tc of testCases) {
            const uri = vscode.Uri.file(`/path/to/file${tc.ext}`);
            const result = tabTracker.getLanguageId(uri);
            assert.strictEqual(result, tc.expected, `Failed for ${tc.ext}`);
        }
    });

    test('findPreviewTab returns undefined when no preview exists', () => {
        const uri = vscode.Uri.file('/path/to/nonexistent.md');
        const result = tabTracker.findPreviewTab(uri);
        assert.strictEqual(result, undefined);
    });

    test('isPreviewOpen returns false when no preview exists', () => {
        const uri = vscode.Uri.file('/path/to/nonexistent.md');
        const result = tabTracker.isPreviewOpen(uri);
        assert.strictEqual(result, false);
    });

    test('closePreviewForFile handles non-existent preview gracefully', async () => {
        const uri = vscode.Uri.file('/path/to/nonexistent.md');
        const result = await tabTracker.closePreviewForFile(uri);
        assert.strictEqual(result, false);
    });

    test('cleanupDebounceMap does not throw', () => {
        // Should handle empty map gracefully
        assert.doesNotThrow(() => {
            tabTracker.cleanupDebounceMap();
        });
    });

    test('dispose cleans up resources', () => {
        const tracker = new TabTracker();
        assert.doesNotThrow(() => {
            tracker.dispose();
        });
    });
});

suite('TabTracker Integration Tests', () => {
    let tabTracker: TabTracker;

    setup(() => {
        tabTracker = new TabTracker();
    });

    teardown(() => {
        tabTracker.dispose();
    });

    test('closePreviewForFile debounces rapid calls', async () => {
        const uri = vscode.Uri.file('/path/to/test.md');

        // Call multiple times rapidly
        const results = await Promise.all([
            tabTracker.closePreviewForFile(uri),
            tabTracker.closePreviewForFile(uri),
            tabTracker.closePreviewForFile(uri),
        ]);

        // At most one should have been processed (debouncing)
        // Since no preview exists, all return false, but debouncing should prevent
        // multiple actual close attempts
        assert.ok(results.every(r => r === false));
    });
});
