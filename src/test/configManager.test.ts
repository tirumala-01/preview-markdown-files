import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigManager } from '../configManager';

suite('ConfigManager Test Suite', () => {
    let configManager: ConfigManager;

    setup(() => {
        configManager = new ConfigManager();
    });

    teardown(() => {
        configManager.dispose();
    });

    test('config returns default values', () => {
        const config = configManager.config;

        // Check that we get a valid config object
        assert.strictEqual(typeof config.enabled, 'boolean');
        assert.strictEqual(typeof config.openPreviewToSide, 'boolean');
        assert.strictEqual(typeof config.autoClosePreview, 'boolean');
        assert.strictEqual(typeof config.openOnGitDiff, 'boolean');
        assert.strictEqual(typeof config.previewOnlyMode, 'boolean');
        assert.strictEqual(typeof config.preserveFocus, 'boolean');
        assert.strictEqual(typeof config.languages, 'string');
    });

    test('config has expected default values', () => {
        const config = configManager.config;

        // These are the defaults defined in package.json
        assert.strictEqual(config.enabled, true);
        assert.strictEqual(config.openPreviewToSide, true);
        assert.strictEqual(config.autoClosePreview, true);
        assert.strictEqual(config.openOnGitDiff, false);
        assert.strictEqual(config.previewOnlyMode, false);
        assert.strictEqual(config.preserveFocus, true);
        // Default languages should include markdown
        assert.ok(config.languages.includes('markdown'));
    });

    test('enabledLanguages contains markdown by default', () => {
        const languages = configManager.enabledLanguages;

        assert.ok(languages instanceof Set);
        assert.ok(languages.has('markdown'));
    });

    test('isLanguageEnabled returns true for markdown', () => {
        assert.strictEqual(configManager.isLanguageEnabled('markdown'), true);
    });

    test('isLanguageEnabled returns false for unsupported language', () => {
        assert.strictEqual(configManager.isLanguageEnabled('javascript'), false);
        assert.strictEqual(configManager.isLanguageEnabled('python'), false);
        assert.strictEqual(configManager.isLanguageEnabled(''), false);
    });

    test('dispose cleans up resources', () => {
        const manager = new ConfigManager();
        assert.doesNotThrow(() => {
            manager.dispose();
        });
    });

    test('multiple ConfigManager instances work independently', () => {
        const manager1 = new ConfigManager();
        const manager2 = new ConfigManager();

        // Both should return valid configs
        assert.ok(manager1.config);
        assert.ok(manager2.config);

        // Clean up
        manager1.dispose();
        manager2.dispose();
    });
});

suite('ConfigManager Event Tests', () => {
    let configManager: ConfigManager;

    setup(() => {
        configManager = new ConfigManager();
    });

    teardown(() => {
        configManager.dispose();
    });

    test('onConfigChanged event is available', () => {
        // The event should be a function that accepts a listener
        assert.ok(configManager.onConfigChanged);
        assert.strictEqual(typeof configManager.onConfigChanged, 'function');
    });

    test('onConfigChanged can be subscribed to', () => {
        let called = false;

        const disposable = configManager.onConfigChanged(() => {
            called = true;
        });

        // Clean up subscription
        disposable.dispose();

        // Note: We can't easily trigger config changes in tests without
        // actually modifying VS Code settings, which could affect other tests
        assert.strictEqual(typeof disposable.dispose, 'function');
    });
});

suite('ConfigManager Toggle Tests', () => {
    let configManager: ConfigManager;
    let originalEnabled: boolean;
    let originalPreviewOnly: boolean;

    setup(async () => {
        configManager = new ConfigManager();
        // Save original values
        originalEnabled = configManager.config.enabled;
        originalPreviewOnly = configManager.config.previewOnlyMode;
    });

    teardown(async () => {
        // Restore original values
        const config = vscode.workspace.getConfiguration('previewMarkdown');
        await config.update('enabled', originalEnabled, vscode.ConfigurationTarget.Global);
        await config.update('previewOnlyMode', originalPreviewOnly, vscode.ConfigurationTarget.Global);
        configManager.dispose();
    });

    test('toggleEnabled changes the enabled state', async () => {
        const before = configManager.config.enabled;

        await configManager.toggleEnabled();

        // Wait a bit for config change to propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        // Reload config
        const after = configManager.config.enabled;
        assert.notStrictEqual(before, after, 'Enabled state should have toggled');
    });

    test('togglePreviewOnlyMode changes the previewOnlyMode state', async () => {
        const before = configManager.config.previewOnlyMode;

        await configManager.togglePreviewOnlyMode();

        // Wait a bit for config change to propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        const after = configManager.config.previewOnlyMode;
        assert.notStrictEqual(before, after, 'PreviewOnlyMode state should have toggled');
    });
});
