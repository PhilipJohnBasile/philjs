# @philjs/editor

Rich text and code editor components for React applications. Provides a flexible, extensible editor with support for markdown, code highlighting, and collaborative editing.

## Installation

```bash
npm install @philjs/editor
# or
yarn add @philjs/editor
# or
pnpm add @philjs/editor
```

## Basic Usage

```tsx
import { RichTextEditor, CodeEditor } from '@philjs/editor';

function App() {
  const [content, setContent] = useState('');

  return (
    <div>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Start writing..."
      />

      <CodeEditor
        language="typescript"
        value={code}
        onChange={setCode}
      />
    </div>
  );
}
```

## Features

- **Rich Text Editing** - Full WYSIWYG editor with formatting toolbar
- **Code Editor** - Syntax highlighting for 100+ languages
- **Markdown Support** - Write in markdown with live preview
- **Slash Commands** - Quick actions via `/` commands
- **Mentions** - @mention users and entities
- **Embeds** - Embed images, videos, and links
- **Tables** - Insert and edit tables
- **Code Blocks** - Syntax-highlighted code blocks
- **Collaboration** - Real-time collaborative editing
- **History** - Undo/redo with full history
- **Extensions** - Plugin system for custom functionality
- **Theming** - Light/dark mode and custom themes
- **Mobile Support** - Touch-friendly editing experience

## Components

| Component | Description |
|-----------|-------------|
| `RichTextEditor` | Full-featured rich text editor |
| `CodeEditor` | Code editor with syntax highlighting |
| `MarkdownEditor` | Markdown editor with preview |
| `InlineEditor` | Minimal inline text editor |
| `EditorToolbar` | Customizable formatting toolbar |

## Extensions

```tsx
import { RichTextEditor, BoldExtension, LinkExtension } from '@philjs/editor';

<RichTextEditor
  extensions={[BoldExtension, LinkExtension, CustomExtension]}
/>
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./extensions, ./utils
- Source files: packages/philjs-editor/src/index.ts, packages/philjs-editor/src/extensions/index.ts

### Public API
- Direct exports: EditorConfig, EditorInstance, PhilEditor, createEditorConfig, getCharacterCount, getWordCount, sanitizeContent
- Re-exported names: BlockMath, CodeBlock, CodeBlockOptions, CustomVideo, Emoji, EmojiOptions, Image, ImageExtensionOptions, ImageUpload, ImageUploadOptions, InlineMath, Link, LinkOptions, LinkPreviewData, MathOptions, Table, TableCell, TableHeader, TableOptions, TableRow, TaskItem, TaskList, TaskListOptions, VideoOptions, Vimeo, Youtube, bulletListToTaskList, checkAllTasks, codeBlockShortcuts, commonEmojis, createCodeBlockExtension, createImageExtension, createLinkExtension, createLinkPreviewPlugin, createMathExtensions, createTableExtensions, createTaskListExtensions, createVideoExtensions, detectVideoPlatform, emojiCategories, emojiPickerStyles, emojiToShortcode, getAllTasks, getDomain, getEmoji, getLinkAtSelection, getSupportedLanguages, getTableInfo, getTaskStats, insertEmoji, insertImageByUrl, insertVideo, isExternalUrl, isInTable, isValidUrl, linkCommands, linkShortcuts, linkStyles, lowlight, mathShortcuts, mathStyles, mathSymbols, mathTemplates, normalizeUrl, pickAndUploadImage, registerLanguage, renderLatex, replaceShortcodes, searchEmojis, tableCommands, tableShortcuts, taskListCommands, taskListShortcuts, taskListStyles, taskListToBulletList, toggleTaskAtPosition, uncheckAllTasks, validateLatex
- Re-exported modules: ./code-block.js, ./emoji.js, ./image.js, ./link.js, ./math.js, ./table.js, ./task-list.js, ./video.js
<!-- API_SNAPSHOT_END -->

## License

MIT
