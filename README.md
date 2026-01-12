# Auto Preview Markdown

Acknowledgement: https://github.com/hnw/vscode-auto-open-markdown-preview

A VS Code extension that automatically opens and closes markdown preview panels, streamlining your documentation workflow.

## Features

- **Auto-Open Preview** - Automatically opens preview when you open a markdown file
- **Auto-Close Preview** - Closes preview tab when the source file is closed
- **Preview-Only Mode** - Reader mode that shows only the preview, hiding the source editor
- **Smart Diff Detection** - Avoids opening previews when viewing git diffs
- **Multi-Language Support** - Works with Markdown, AsciiDoc, and reStructuredText

## Installation

Install from the VS Code Marketplace or run:
```
ext install preview-markdown-files
```

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Toggle Auto Preview | `Ctrl+Shift+Alt+M` | Enable/disable the extension |
| Toggle Preview-Only Mode | `Ctrl+Shift+Alt+P` | Toggle reader mode |

> On Mac, use `Cmd` instead of `Ctrl`

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `previewMarkdown.enabled` | `true` | Enable/disable the extension |
| `previewMarkdown.openPreviewToSide` | `true` | Open preview to the side |
| `previewMarkdown.autoClosePreview` | `true` | Close preview when source closes |
| `previewMarkdown.openOnGitDiff` | `false` | Open preview on git diffs |
| `previewMarkdown.previewOnlyMode` | `false` | Show only preview (reader mode) |
| `previewMarkdown.preserveFocus` | `true` | Keep focus in source editor |
| `previewMarkdown.languages` | `"markdown"` | Enabled languages (comma-separated) |

### Supported Languages

- `markdown` - `.md`, `.markdown`, `.mdown`, `.mkd`
- `asciidoc` - `.adoc`, `.asciidoc`
- `restructuredtext` - `.rst`, `.rest`

## License

MIT
