# @philjs/editor

Rich text editor for PhilJS applications, built as pure Web Components with no React dependency.

## Introduction

`@philjs/editor` provides a powerful, customizable rich text editing experience using native Web Components. Unlike traditional React-based editors, this package works seamlessly with any framework or vanilla JavaScript applications.

**Key Features:**
- Pure Web Components - no React required
- Built-in toolbar with common formatting options
- Extensible architecture with TipTap-based extensions
- Shadow DOM encapsulation for style isolation
- CSS variable-based theming
- Full TypeScript support

## Installation

```bash
npm install @philjs/editor
```

## PhilEditor Web Component

The `<phil-editor>` element is the core component for rich text editing.

### Basic Usage

```html
<phil-editor placeholder="Start writing..." autofocus></phil-editor>
```

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `placeholder` | `string` | Placeholder text shown when editor is empty (default: "Start typing...") |
| `readonly` | `boolean` | When present, disables editing |
| `autofocus` | `boolean` | When present, focuses the editor on mount |

### Configuration Interface

Configure the editor programmatically using the `EditorConfig` interface:

```typescript
interface EditorConfig {
  content?: string;           // Initial HTML content
  extensions?: string[];      // Extensions to enable
  placeholder?: string;       // Placeholder text
  autofocus?: boolean | 'start' | 'end';  // Auto-focus behavior
  editable?: boolean;         // Enable/disable editing
  class?: string;             // Custom CSS class
  onUpdate?: (content: string) => void;   // Content change callback
  onFocus?: () => void;       // Focus callback
  onBlur?: () => void;        // Blur callback
}
```

### Configuration Example

```typescript
import { PhilEditor } from '@philjs/editor';

const editor = document.querySelector('phil-editor') as PhilEditor;

editor.configure({
  content: '<p>Hello, world!</p>',
  placeholder: 'Write something amazing...',
  autofocus: 'end',
  onUpdate: (html) => {
    console.log('Content updated:', html);
  },
  onFocus: () => {
    console.log('Editor focused');
  },
  onBlur: () => {
    console.log('Editor blurred');
  }
});
```

### Events

The editor emits the following custom events:

| Event | Detail | Description |
|-------|--------|-------------|
| `update` | `string` (HTML content) | Fired when content changes |
| `editor-focus` | None | Fired when editor gains focus |
| `editor-blur` | None | Fired when editor loses focus |

```typescript
const editor = document.querySelector('phil-editor') as PhilEditor;

editor.addEventListener('update', (e: CustomEvent) => {
  console.log('New content:', e.detail);
});

editor.addEventListener('editor-focus', () => {
  console.log('Editor focused');
});

editor.addEventListener('editor-blur', () => {
  console.log('Editor lost focus');
});
```

## Editor Instance API

The `PhilEditor` component exposes methods for programmatic content manipulation.

### Content Methods

#### getHTML()

Returns the current content as HTML.

```typescript
const html: string = editor.getHTML();
// Returns: "<p>Hello, <strong>world</strong>!</p>"
```

#### getText()

Returns the current content as plain text (no HTML tags).

```typescript
const text: string = editor.getText();
// Returns: "Hello, world!"
```

#### setContent(content: string)

Sets the editor content from an HTML string.

```typescript
editor.setContent('<h1>New Title</h1><p>New paragraph content.</p>');
```

#### clearContent()

Clears all content from the editor.

```typescript
editor.clearContent();
```

### Focus Methods

#### focus()

Focuses the editor.

```typescript
editor.focus();
```

#### blur()

Removes focus from the editor.

```typescript
editor.blur();
```

#### isFocused()

Returns whether the editor currently has focus.

```typescript
const focused: boolean = editor.isFocused();
```

### State Methods

#### isEmpty()

Returns whether the editor is empty (no text content).

```typescript
const empty: boolean = editor.isEmpty();
```

#### getCharacterCount()

Returns the number of characters in the editor.

```typescript
const count: number = editor.getCharacterCount();
console.log(`${count} characters`);
```

#### getWordCount()

Returns the number of words in the editor.

```typescript
const count: number = editor.getWordCount();
console.log(`${count} words`);
```

## Formatting Commands

The editor provides methods for applying text formatting.

### Text Formatting

```typescript
// Bold text
editor.bold();

// Italic text
editor.italic();

// Underlined text
editor.underline();

// Strikethrough text
editor.strikethrough();
```

### Block Formatting

```typescript
// Headings (levels 1-6)
editor.heading(1);  // <h1>
editor.heading(2);  // <h2>
editor.heading(3);  // <h3>
editor.heading(4);  // <h4>
editor.heading(5);  // <h5>
editor.heading(6);  // <h6>

// Regular paragraph
editor.paragraph();

// Blockquote
editor.blockquote();

// Code block
editor.codeBlock();
```

### Lists

```typescript
// Bullet list
editor.bulletList();

// Numbered list
editor.orderedList();
```

### Links

```typescript
// Create a link
editor.link('https://example.com');

// Remove link from selection
editor.unlink();
```

### History

```typescript
// Undo last change
editor.undo();

// Redo last undone change
editor.redo();
```

### Complete Toolbar Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Rich Text Editor</title>
</head>
<body>
  <div class="toolbar">
    <button onclick="editor.bold()"><b>B</b></button>
    <button onclick="editor.italic()"><i>I</i></button>
    <button onclick="editor.underline()"><u>U</u></button>
    <button onclick="editor.strikethrough()"><s>S</s></button>
    <span class="separator"></span>
    <button onclick="editor.heading(1)">H1</button>
    <button onclick="editor.heading(2)">H2</button>
    <button onclick="editor.paragraph()">P</button>
    <span class="separator"></span>
    <button onclick="editor.bulletList()">Bullet</button>
    <button onclick="editor.orderedList()">Numbered</button>
    <span class="separator"></span>
    <button onclick="editor.blockquote()">Quote</button>
    <button onclick="editor.codeBlock()">Code</button>
    <span class="separator"></span>
    <button onclick="promptLink()">Link</button>
    <button onclick="editor.unlink()">Unlink</button>
    <span class="separator"></span>
    <button onclick="editor.undo()">Undo</button>
    <button onclick="editor.redo()">Redo</button>
  </div>

  <phil-editor id="editor" placeholder="Start writing..."></phil-editor>

  <script type="module">
    import { PhilEditor } from '@philjs/editor';

    const editor = document.getElementById('editor');

    window.editor = editor;
    window.promptLink = () => {
      const url = prompt('Enter URL:');
      if (url) editor.link(url);
    };
  </script>
</body>
</html>
```

## Extensions

Extend the editor with additional functionality using TipTap-based extensions.

### Code Block Extension

Syntax-highlighted code blocks powered by lowlight/highlight.js.

```typescript
import {
  createCodeBlockExtension,
  getSupportedLanguages,
  registerLanguage,
  codeBlockShortcuts
} from '@philjs/editor/extensions';

// Create with default options
const codeBlock = createCodeBlockExtension();

// Create with custom options
const codeBlock = createCodeBlockExtension({
  defaultLanguage: 'typescript',
  lineNumbers: true
});

// Get supported languages
const languages = getSupportedLanguages();

// Register additional language
import rust from 'highlight.js/lib/languages/rust';
registerLanguage('rust', rust);
```

**CodeBlockOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `languages` | `string[]` | Common languages | Languages to support |
| `defaultLanguage` | `string` | `'plaintext'` | Default language for new blocks |
| `lineNumbers` | `boolean` | `false` | Show line numbers |
| `lowlight` | `Lowlight` | Built-in instance | Custom lowlight instance |

**Keyboard Shortcuts:**
- `Mod-Alt-c` - Toggle code block
- `Mod-Enter` - Exit code block

### Link Extension

Smart links with auto-detection, validation, and optional previews.

```typescript
import {
  createLinkExtension,
  createLinkPreviewPlugin,
  isValidUrl,
  normalizeUrl,
  isExternalUrl,
  getDomain,
  linkCommands,
  getLinkAtSelection
} from '@philjs/editor/extensions';

// Create with default options
const link = createLinkExtension();

// Create with custom options
const link = createLinkExtension({
  openOnClick: true,
  autolink: true,
  protocols: ['http', 'https', 'mailto'],
  noopener: true,
  previews: false
});

// Link preview plugin (requires fetch function)
const previewPlugin = createLinkPreviewPlugin(async (url) => {
  const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
  return response.json();
});
```

**LinkOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `openOnClick` | `boolean` | `true` | Open links when clicked |
| `autolink` | `boolean` | `true` | Auto-detect URLs |
| `validate` | `function` | `isValidUrl` | URL validation function |
| `protocols` | `string[]` | `['http', 'https', 'mailto', 'tel']` | Allowed protocols |
| `noopener` | `boolean` | `true` | Add `rel="noopener noreferrer"` |
| `linkClass` | `string` | `'philjs-link'` | CSS class for links |
| `previews` | `boolean` | `false` | Enable link previews |

**Helper Functions:**
```typescript
// Validate a URL
isValidUrl('https://example.com');  // true

// Normalize URL (add protocol if missing)
normalizeUrl('example.com');  // 'https://example.com'

// Check if external
isExternalUrl('https://other-site.com');  // true

// Extract domain
getDomain('https://example.com/path');  // 'example.com'
```

**Keyboard Shortcuts:**
- `Mod-k` - Insert/edit link
- `Mod-Shift-k` - Remove link

### Table Extension

Full-featured tables with headers, merging, and resizing.

```typescript
import {
  createTableExtensions,
  tableCommands,
  tableShortcuts,
  isInTable,
  getTableInfo
} from '@philjs/editor/extensions';

// Create table extensions
const tableExts = createTableExtensions({
  resizable: true,
  cellSelection: true,
  defaultRows: 3,
  defaultCols: 3,
  withHeaderRow: true,
  cellMinWidth: 100
});
```

**TableOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `resizable` | `boolean` | `true` | Allow column resizing |
| `cellSelection` | `boolean` | `true` | Allow cell selection |
| `defaultRows` | `number` | `3` | Default rows for new tables |
| `defaultCols` | `number` | `3` | Default columns for new tables |
| `withHeaderRow` | `boolean` | `true` | Include header row |
| `cellMinWidth` | `number` | `100` | Minimum cell width in pixels |

**Table Commands:**
```typescript
// Insert table
tableCommands.insertTable(editor, { rows: 4, cols: 3, withHeaderRow: true });

// Column operations
tableCommands.addColumnBefore(editor);
tableCommands.addColumnAfter(editor);
tableCommands.deleteColumn(editor);

// Row operations
tableCommands.addRowBefore(editor);
tableCommands.addRowAfter(editor);
tableCommands.deleteRow(editor);

// Cell operations
tableCommands.mergeCells(editor);
tableCommands.splitCell(editor);
tableCommands.toggleHeaderRow(editor);
tableCommands.toggleHeaderColumn(editor);

// Navigation
tableCommands.goToNextCell(editor);
tableCommands.goToPreviousCell(editor);

// Delete entire table
tableCommands.deleteTable(editor);

// Check if in table
if (isInTable(editor)) {
  const info = getTableInfo(editor);
  console.log(`${info.rows} rows, ${info.cols} columns`);
}
```

**Keyboard Shortcuts:**
- `Mod-Alt-t` - Insert table
- `Mod-Alt-Left/Right` - Add column before/after
- `Mod-Alt-Up/Down` - Add row before/after
- `Mod-Alt-m` - Merge cells
- `Mod-Alt-s` - Split cell

### Task List Extension

Interactive checkbox lists with completion tracking.

```typescript
import {
  createTaskListExtensions,
  taskListCommands,
  getTaskStats,
  getAllTasks,
  checkAllTasks,
  uncheckAllTasks
} from '@philjs/editor/extensions';

// Create task list extensions
const taskExts = createTaskListExtensions({
  nested: true,
  onToggle: (id, checked) => {
    console.log(`Task ${id} is now ${checked ? 'complete' : 'incomplete'}`);
  }
});
```

**TaskListOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `nested` | `boolean` | `true` | Allow nested task lists |
| `checkboxClass` | `string` | - | Custom checkbox CSS class |
| `onToggle` | `function` | - | Callback when task is toggled |

**Task Commands and Utilities:**
```typescript
// Toggle task list
taskListCommands.toggleTaskList(editor);

// Check/uncheck current task
taskListCommands.checkTask(editor);
taskListCommands.uncheckTask(editor);
taskListCommands.toggleTask(editor);

// Get statistics
const stats = getTaskStats(editor);
console.log(`${stats.completed}/${stats.total} tasks complete (${stats.percentage}%)`);

// Get all tasks
const tasks = getAllTasks(editor);
tasks.forEach(task => {
  console.log(`${task.checked ? '[x]' : '[ ]'} ${task.text}`);
});

// Bulk operations
checkAllTasks(editor);    // Check all tasks
uncheckAllTasks(editor);  // Uncheck all tasks
```

**Keyboard Shortcuts:**
- `Mod-Shift-9` - Toggle task list
- `Mod-Enter` - Toggle task completion

### Image Extension

Image support with drag-drop, paste, and upload capabilities.

```typescript
import {
  createImageExtension,
  insertImageByUrl,
  pickAndUploadImage
} from '@philjs/editor/extensions';

// Create with upload function
const imageExts = createImageExtension({
  uploadFn: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url;
  },
  maxSize: 5 * 1024 * 1024,  // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Or use an endpoint
const imageExts = createImageExtension({
  uploadEndpoint: '/api/images/upload',
  uploadHeaders: {
    'Authorization': 'Bearer token123'
  }
});
```

**ImageExtensionOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `uploadFn` | `function` | - | Custom upload function |
| `uploadEndpoint` | `string` | - | Upload API endpoint |
| `uploadHeaders` | `object` | `{}` | Headers for upload request |
| `maxSize` | `number` | `10MB` | Maximum file size |
| `allowedTypes` | `string[]` | Common image types | Allowed MIME types |
| `inline` | `boolean` | `false` | Allow inline images |
| `allowResize` | `boolean` | `true` | Allow image resizing |
| `defaultWidth` | `string` | `'100%'` | Default image width |

**Helper Functions:**
```typescript
// Insert image by URL
insertImageByUrl(editor, 'https://example.com/image.jpg', 'Alt text');

// Open file picker and upload
await pickAndUploadImage(editor, async (file) => {
  // Your upload logic here
  return 'https://example.com/uploaded-image.jpg';
});
```

### Math Extension

LaTeX equation support with KaTeX rendering.

```typescript
import {
  createMathExtensions,
  renderLatex,
  validateLatex,
  mathSymbols,
  mathTemplates
} from '@philjs/editor/extensions';

// Create math extensions
const mathExts = createMathExtensions({
  katexOptions: {
    throwOnError: false,
    strict: false
  }
});
```

**MathOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `katexOptions` | `object` | `{}` | KaTeX configuration |
| `inlineDelimiters` | `[string, string]` | `['$', '$']` | Inline math delimiters |
| `blockDelimiters` | `[string, string]` | `['$$', '$$']` | Block math delimiters |
| `autoRender` | `boolean` | `true` | Auto-render delimited math |

**Input Rules:**
- Type `$x^2$` for inline math
- Type `$$\int_0^1 f(x) dx$$` for block math

**Helper Functions:**
```typescript
// Render LaTeX to HTML
const html = await renderLatex('\\frac{a}{b}', true);  // displayMode = true

// Validate LaTeX syntax
const result = await validateLatex('\\sqrt{x}');
if (!result.valid) {
  console.error(result.error);
}

// Quick symbol insertion
console.log(mathSymbols.alpha);   // \\alpha
console.log(mathSymbols.sum);     // \\sum
console.log(mathSymbols.sqrt);    // \\sqrt{}

// Use templates
console.log(mathTemplates.fraction);   // \\frac{numerator}{denominator}
console.log(mathTemplates.integral);   // \\int_{a}^{b} f(x) \\, dx
console.log(mathTemplates.matrix);     // \\begin{pmatrix}...
```

**Keyboard Shortcuts:**
- `Mod-m` - Insert inline math
- `Mod-Shift-m` - Insert block math

### Video Extension

Embed videos from YouTube, Vimeo, or custom sources.

```typescript
import {
  createVideoExtensions,
  detectVideoPlatform,
  insertVideo
} from '@philjs/editor/extensions';

// Create video extensions
const videoExts = createVideoExtensions({
  youtube: true,
  vimeo: true,
  customVideo: true,
  width: 640,
  height: 360,
  allowFullscreen: true
});
```

**VideoOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `youtube` | `boolean` | `true` | Enable YouTube embeds |
| `vimeo` | `boolean` | `true` | Enable Vimeo embeds |
| `customVideo` | `boolean` | `true` | Enable custom video |
| `width` | `number` | `640` | Default video width |
| `height` | `number` | `360` | Default video height |
| `allowFullscreen` | `boolean` | `true` | Allow fullscreen |
| `autoplay` | `boolean` | `false` | Autoplay (muted) |

**Helper Functions:**
```typescript
// Detect video platform
detectVideoPlatform('https://youtube.com/watch?v=123');  // 'youtube'
detectVideoPlatform('https://vimeo.com/123456');          // 'vimeo'
detectVideoPlatform('https://example.com/video.mp4');     // 'custom'

// Insert video (auto-detects platform)
insertVideo(editor, 'https://youtube.com/watch?v=dQw4w9WgXcQ');
```

### Emoji Extension

Emoji picker and shortcode support.

```typescript
import {
  Emoji,
  commonEmojis,
  emojiCategories,
  getEmoji,
  searchEmojis,
  insertEmoji,
  replaceShortcodes
} from '@philjs/editor/extensions';

// Use the extension
const emojiExt = Emoji.configure({
  enableShortcodes: true,
  trigger: ':'
});
```

**EmojiOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `emojis` | `object` | `commonEmojis` | Custom emoji map |
| `enableShortcodes` | `boolean` | `true` | Enable `:shortcode:` replacement |
| `trigger` | `string` | `':'` | Suggestion trigger character |

**Shortcode Usage:**
Type `:smile:` and it will be replaced with the corresponding emoji.

**Helper Functions:**
```typescript
// Get emoji by shortcode
getEmoji('heart');  // '❤️'

// Search emojis
const results = searchEmojis('heart');
// [{ shortcode: 'heart', emoji: '❤️' }, { shortcode: 'orange_heart', emoji: '🧡' }, ...]

// Insert emoji
insertEmoji(editor, '🎉');

// Replace all shortcodes in text
replaceShortcodes('I :heart: this :rocket:');  // 'I ❤️ this 🚀'

// Access categories for picker
console.log(emojiCategories.smileys);   // ['smile', 'grin', 'laugh', ...]
console.log(emojiCategories.gestures);  // ['thumbsup', 'thumbsdown', ...]
```

## Styling and Theming

The editor uses CSS custom properties (variables) for easy theming.

### CSS Variables

```css
phil-editor {
  /* Border */
  --editor-border: #e0e0e0;

  /* Toolbar */
  --editor-toolbar-bg: #f5f5f5;

  /* Buttons */
  --editor-button-bg: #ffffff;
  --editor-button-hover: #e8e8e8;

  /* Content */
  --editor-placeholder: #999999;
  --editor-code-bg: #f5f5f5;

  /* Accent color */
  --editor-accent: #3b82f6;
}
```

### Dark Theme Example

```css
phil-editor.dark-theme {
  --editor-border: #374151;
  --editor-toolbar-bg: #1f2937;
  --editor-button-bg: #374151;
  --editor-button-hover: #4b5563;
  --editor-placeholder: #6b7280;
  --editor-code-bg: #1f2937;
  --editor-accent: #60a5fa;
}

phil-editor.dark-theme .editor-content {
  background: #111827;
  color: #f9fafb;
}
```

### Custom Styling

```css
/* Increase content area height */
phil-editor .editor-content {
  min-height: 400px;
}

/* Style blockquotes */
phil-editor .editor-content blockquote {
  border-left-width: 4px;
  font-style: italic;
  color: #64748b;
}

/* Style code blocks */
phil-editor .editor-content pre {
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

/* Style links */
phil-editor .editor-content a {
  color: #2563eb;
  text-decoration: underline;
}
```

## Complete Usage Examples

### Blog Post Editor

```html
<!DOCTYPE html>
<html>
<head>
  <title>Blog Editor</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .editor-wrapper {
      margin-top: 1rem;
    }
    phil-editor {
      --editor-accent: #059669;
    }
    .stats {
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
    .actions {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
    }
    .save-btn {
      background: #059669;
      color: white;
    }
    .preview-btn {
      background: #e5e7eb;
    }
  </style>
</head>
<body>
  <h1>Write a Blog Post</h1>

  <div class="editor-wrapper">
    <phil-editor
      id="editor"
      placeholder="Start writing your blog post..."
      autofocus
    ></phil-editor>

    <div class="stats" id="stats">0 words, 0 characters</div>
  </div>

  <div class="actions">
    <button class="save-btn" onclick="saveDraft()">Save Draft</button>
    <button class="preview-btn" onclick="preview()">Preview</button>
  </div>

  <script type="module">
    import { PhilEditor } from '@philjs/editor';

    const editor = document.getElementById('editor');
    const stats = document.getElementById('stats');

    // Update stats on content change
    editor.addEventListener('update', () => {
      const words = editor.getWordCount();
      const chars = editor.getCharacterCount();
      stats.textContent = `${words} words, ${chars} characters`;
    });

    // Save draft to localStorage
    window.saveDraft = () => {
      const content = editor.getHTML();
      localStorage.setItem('blog-draft', content);
      alert('Draft saved!');
    };

    // Load existing draft
    const draft = localStorage.getItem('blog-draft');
    if (draft) {
      editor.setContent(draft);
    }

    // Preview in new window
    window.preview = () => {
      const html = editor.getHTML();
      const win = window.open('', '_blank');
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview</title>
          <style>
            body { font-family: Georgia, serif; max-width: 700px; margin: 2rem auto; line-height: 1.8; }
            h1, h2, h3 { font-family: system-ui, sans-serif; }
            blockquote { border-left: 3px solid #059669; margin-left: 0; padding-left: 1rem; }
            pre { background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
          </style>
        </head>
        <body>${html}</body>
        </html>
      `);
    };
  </script>
</body>
</html>
```

### TypeScript Integration

```typescript
import {
  PhilEditor,
  EditorConfig,
  createEditorConfig,
  getCharacterCount,
  getWordCount,
  sanitizeContent
} from '@philjs/editor';

// Type-safe editor reference
const editorEl = document.querySelector<PhilEditor>('phil-editor');

if (editorEl) {
  // Create typed configuration
  const config: EditorConfig = createEditorConfig({
    content: '<p>Initial content</p>',
    placeholder: 'Type here...',
    autofocus: true,
    onUpdate: (html: string) => {
      // Sanitize content before saving
      const safe = sanitizeContent(html);
      saveToServer(safe);
    }
  });

  editorEl.configure(config);

  // Type-safe method calls
  const html: string = editorEl.getHTML();
  const text: string = editorEl.getText();
  const empty: boolean = editorEl.isEmpty();
  const wordCount: number = editorEl.getWordCount();

  // Formatting
  editorEl.bold();
  editorEl.heading(2);
  editorEl.link('https://example.com');
}

async function saveToServer(content: string): Promise<void> {
  await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
}
```

### With Extensions

```typescript
import { PhilEditor } from '@philjs/editor';
import {
  createCodeBlockExtension,
  createLinkExtension,
  createTableExtensions,
  createTaskListExtensions,
  createImageExtension,
  createMathExtensions,
  createVideoExtensions,
  Emoji
} from '@philjs/editor/extensions';

// Configure extensions
const extensions = [
  createCodeBlockExtension({ defaultLanguage: 'typescript' }),
  createLinkExtension({ autolink: true, previews: true }),
  ...createTableExtensions({ resizable: true }),
  ...createTaskListExtensions({ nested: true }),
  ...createImageExtension({
    uploadFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await res.json();
      return url;
    }
  }),
  ...createMathExtensions(),
  ...createVideoExtensions(),
  Emoji.configure({ enableShortcodes: true })
];

// Use with TipTap editor instance
// Note: The PhilEditor web component uses a simplified API
// For full extension support, integrate with TipTap directly
```

## Utility Functions

The package exports several utility functions:

```typescript
import {
  createEditorConfig,
  getCharacterCount,
  getWordCount,
  sanitizeContent
} from '@philjs/editor';

// Create config with defaults
const config = createEditorConfig({
  content: '<p>Hello</p>',
  autofocus: true
});

// Get character count from HTML string
const chars = getCharacterCount('<p>Hello <strong>world</strong></p>');
// Returns: 11

// Get word count from HTML string
const words = getWordCount('<p>Hello world</p>');
// Returns: 2

// Sanitize HTML (remove scripts, event handlers, javascript: URLs)
const safe = sanitizeContent('<p onclick="alert()">Hello</p><script>evil()</script>');
// Returns: '<p>Hello</p>'
```

## Browser Support

- Chrome 67+
- Firefox 63+
- Safari 10.1+
- Edge 79+

Web Components v1 and Shadow DOM support is required.

## Related Packages

- [`@philjs/forms`](../forms/overview.md) - Form handling with rich text integration
- [`@philjs/content`](../content/overview.md) - Content management utilities
- [`@philjs/rich-text`](../rich-text/overview.md) - Additional rich text utilities
