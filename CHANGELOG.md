# Changelog

All notable changes to the "Auto Preview Markdown" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added

- **Auto-open preview**: Automatically opens markdown preview when you open a markdown file
- **Auto-close preview**: Automatically closes the preview tab when the source markdown file is closed
- **Git diff awareness**: Detects when you're viewing a git diff and skips opening preview
- **Preview-only mode**: Option to show only the preview panel and close the source editor
- **Preserve focus**: Option to keep focus in the source editor after opening preview
- **Multi-language support**: Support for markdown, AsciiDoc, and reStructuredText
- **Configurable settings**: 7 settings to customize behavior
- **Toggle commands**: Commands to enable/disable extension and preview-only mode
- **Keyboard shortcuts**: Quick access to toggle commands
  - `Ctrl+Shift+Alt+M` / `Cmd+Shift+Alt+M` - Toggle extension
  - `Ctrl+Shift+Alt+P` / `Cmd+Shift+Alt+P` - Toggle preview-only mode

### Settings

- `previewMarkdown.enabled` - Enable/disable the extension (default: `true`)
- `previewMarkdown.openPreviewToSide` - Open preview to the side (default: `true`)
- `previewMarkdown.autoClosePreview` - Auto-close preview with source (default: `true`)
- `previewMarkdown.openOnGitDiff` - Open preview in git diff view (default: `false`)
- `previewMarkdown.previewOnlyMode` - Show only preview, hide source (default: `false`)
- `previewMarkdown.preserveFocus` - Keep focus in source editor (default: `true`)
- `previewMarkdown.languages` - Enabled languages (default: `"markdown"`)

### Technical

- Uses VS Code Tab API for reliable tab tracking
- Implements debouncing to handle VS Code's event batching
- Supports remote development (SSH, WSL, Containers)
- Comprehensive error handling with output channel logging

## [Unreleased]

### Planned

- Extension icon
- Status bar indicator showing extension state
