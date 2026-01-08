import * as vscode from 'vscode';
import { ExtensionConfig, SupportedLanguage } from './types';

const CONFIG_SECTION = 'previewMarkdown';

/**
 * Manages extension configuration settings.
 * Provides reactive access to settings with automatic updates when changed.
 */
export class ConfigManager implements vscode.Disposable {
    private _config: ExtensionConfig;
    private _enabledLanguages: Set<SupportedLanguage>;
    private _disposables: vscode.Disposable[] = [];
    private _onConfigChanged = new vscode.EventEmitter<ExtensionConfig>();

    /** Event fired when configuration changes */
    public readonly onConfigChanged = this._onConfigChanged.event;

    constructor() {
        this._config = this.loadConfig();
        this._enabledLanguages = this.parseLanguages(this._config.languages);

        // Watch for configuration changes
        this._disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(CONFIG_SECTION)) {
                    this._config = this.loadConfig();
                    this._enabledLanguages = this.parseLanguages(this._config.languages);
                    this._onConfigChanged.fire(this._config);
                }
            })
        );
    }

    /** Current configuration snapshot */
    get config(): ExtensionConfig {
        return this._config;
    }

    /** Set of enabled language IDs */
    get enabledLanguages(): Set<SupportedLanguage> {
        return this._enabledLanguages;
    }

    /**
     * Check if a language is enabled in settings
     */
    isLanguageEnabled(languageId: string): boolean {
        return this._enabledLanguages.has(languageId as SupportedLanguage);
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfig(): ExtensionConfig {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        return {
            enabled: config.get<boolean>('enabled', true),
            openPreviewToSide: config.get<boolean>('openPreviewToSide', true),
            autoClosePreview: config.get<boolean>('autoClosePreview', true),
            openOnGitDiff: config.get<boolean>('openOnGitDiff', false),
            previewOnlyMode: config.get<boolean>('previewOnlyMode', false),
            preserveFocus: config.get<boolean>('preserveFocus', true),
            languages: config.get<string>('languages', 'markdown')
        };
    }

    /**
     * Parse comma-separated language string into a Set
     */
    private parseLanguages(languagesStr: string): Set<SupportedLanguage> {
        const validLanguages: SupportedLanguage[] = ['markdown', 'asciidoc', 'restructuredtext'];
        const parsed = languagesStr
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => validLanguages.includes(s as SupportedLanguage)) as SupportedLanguage[];

        return new Set(parsed.length > 0 ? parsed : ['markdown']);
    }

    /**
     * Toggle the enabled setting
     */
    async toggleEnabled(): Promise<void> {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const current = config.get<boolean>('enabled', true);
        await config.update('enabled', !current, vscode.ConfigurationTarget.Global);
    }

    /**
     * Toggle preview-only mode
     */
    async togglePreviewOnlyMode(): Promise<void> {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const current = config.get<boolean>('previewOnlyMode', false);
        await config.update('previewOnlyMode', !current, vscode.ConfigurationTarget.Global);
    }

    dispose(): void {
        this._onConfigChanged.dispose();
        this._disposables.forEach(d => d.dispose());
    }
}
