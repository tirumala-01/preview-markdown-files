# Auto Preview Markdown

Automatically open and close markdown preview in VS Code with smart features that no other extension offers.

## Features

### Auto-Open Preview
When you open a markdown file, the preview automatically opens beside it. No more manually triggering `Ctrl+Shift+V`!

### Auto-Close Preview (Unique)
When you close a markdown file, its preview automatically closes too. Keep your workspace clean without manually closing preview tabs.

### Git Diff Awareness (Unique)
The extension detects when you're viewing a git diff and won't open a preview. Review your changes without the preview getting in the way.

### Preview-Only Mode / Reader Mode (Unique)
Want to just read markdown without seeing the source? Enable preview-only mode for a clean reading experience:
- Only shows the preview, hides the source editor
- Displays one preview at a time (like a document reader)
- Opening a new file smoothly replaces the current preview

### Preserve Focus (Unique)
Keep your cursor in the source editor after opening the preview. Continue typing without switching focus.

### Multi-Language Support
Works with:
- Markdown (`.md`, `.markdown`, `.mdown`, `.mkd`)
- AsciiDoc (`.adoc`, `.asciidoc`) - requires [AsciiDoc extension](https://marketplace.visualstudio.com/items?itemName=asciidoctor.asciidoctor-vscode)
- reStructuredText (`.rst`, `.rest`) - requires [reStructuredText extension](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `previewMarkdown.enabled` | `true` | Enable/disable the extension |
| `previewMarkdown.openPreviewToSide` | `true` | Open preview to the side (`true`) or in same editor group (`false`) |
| `previewMarkdown.autoClosePreview` | `true` | Automatically close preview when markdown file is closed |
| `previewMarkdown.openOnGitDiff` | `false` | Open preview when viewing git diff |
| `previewMarkdown.previewOnlyMode` | `false` | Reader mode: show only preview, one file at a time |
| `previewMarkdown.preserveFocus` | `true` | Keep focus in the source editor after opening preview |
| `previewMarkdown.languages` | `"markdown"` | Comma-separated list of languages: `markdown`, `asciidoc`, `restructuredtext` |

## Commands & Keyboard Shortcuts

| Command | Shortcut (Windows/Linux) | Shortcut (Mac) | Description |
|---------|--------------------------|----------------|-------------|
| `Auto Preview: Toggle Auto Preview Markdown` | `Ctrl+Shift+Alt+M` | `Cmd+Shift+Alt+M` | Enable or disable the extension |
| `Auto Preview: Toggle Preview-Only Mode` | `Ctrl+Shift+Alt+P` | `Cmd+Shift+Alt+P` | Toggle between source+preview or preview-only |

Access commands via:
- **Keyboard shortcuts** (when editing a markdown/asciidoc/rst file)
- **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)

> **Note:** Keyboard shortcuts are only active when you're focused on a supported file (markdown, asciidoc, or restructuredtext).

## Usage Examples

### Basic Usage
1. Install the extension
2. Open any `.md` file
3. Preview automatically opens to the side

### Preview-Only Mode (for reading)
1. Open settings (`Ctrl+,` / `Cmd+,`)
2. Search for `previewMarkdown.previewOnlyMode`
3. Enable it
4. Now when you open markdown files, only the preview shows

### Working with Git Diffs
The extension automatically detects git diffs. When you click on a changed `.md` file in the Source Control panel, the preview won't open, letting you focus on reviewing changes.

### Multi-Language Setup
To enable AsciiDoc and reStructuredText support:
1. Install the respective extensions from the marketplace
2. Open settings
3. Set `previewMarkdown.languages` to `"markdown, asciidoc, restructuredtext"`

## Requirements

- VS Code 1.75.0 or higher
- For AsciiDoc: [AsciiDoc extension](https://marketplace.visualstudio.com/items?itemName=asciidoctor.asciidoctor-vscode)
- For reStructuredText: [reStructuredText extension](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)

## Known Issues

- Preview tab labels must match the pattern `Preview filename.ext` for auto-close to work correctly
- When using Remote SSH/WSL/Containers, ensure the extension is installed in the remote environment

## Release Notes

### 1.0.0

Initial release with:
- Auto-open preview on markdown file open
- Auto-close preview when source file closes
- Git diff awareness
- Preview-only mode
- Preserve focus option
- Multi-language support (markdown, asciidoc, restructuredtext)
- Keyboard shortcuts for quick toggling

## Contributing

Found a bug or have a feature request? Please open an issue on the [GitHub repository](https://github.com/your-repo/preview-markdown-files).

## License

MIT - see [LICENSE](LICENSE) for details.
