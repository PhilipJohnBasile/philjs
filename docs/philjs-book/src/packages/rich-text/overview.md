# @philjs/rich-text

Notion-style block-based rich text editor with slash commands, floating toolbar, drag-and-drop, and export to HTML/Markdown.

## Installation

```bash
npm install @philjs/rich-text
```

## Features

- **Block-Based Editing** - Paragraphs, headings, lists, code, images
- **Slash Commands** - Quick block insertion with `/`
- **Floating Toolbar** - Context-aware formatting options
- **Drag & Drop** - Reorder blocks by dragging
- **Collaborative Editing** - Real-time multi-user support
- **Export Formats** - JSON, HTML, Markdown
- **Custom Extensions** - Add your own block types

## Quick Start

```typescript
import { createRichTextEditor } from '@philjs/rich-text';

const editor = createRichTextEditor({
  container: document.getElementById('editor'),
  initialContent: [
    { type: 'heading1', content: [{ type: 'text', text: 'Welcome' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Start typing...' }] },
  ],
  onChange: (blocks) => {
    console.log('Content changed:', blocks);
  },
});
```

## Editor Component

### Creating an Editor

```typescript
import { Editor, createRichTextEditor } from '@philjs/rich-text';

// Using the Editor component
function MyEditor() {
  return (
    <Editor
      initialContent={content}
      placeholder="Start typing..."
      autoFocus={true}
      onChange={(blocks) => saveContent(blocks)}
      onSelectionChange={(selection) => updateToolbar(selection)}
    />
  );
}

// Or create programmatically
const editor = createRichTextEditor({
  container: document.getElementById('editor'),
  initialContent: [],
  placeholder: 'Type / for commands...',
  autoFocus: true,
  onChange: handleChange,
});
```

### Editor Options

```typescript
interface EditorOptions {
  container: HTMLElement;
  initialContent?: Block[];
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  onChange?: (blocks: Block[]) => void;
  onSelectionChange?: (selection: Selection) => void;
  extensions?: Extension[];
  keyBindings?: KeyBinding[];
  slashCommands?: SlashCommand[];
  toolbar?: ToolbarConfig;
  collaboration?: CollaborationConfig;
}
```

## Block Types

### Available Block Types

```typescript
type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'checkList'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'video'
  | 'embed'
  | 'table'
  | 'callout';
```

### Creating Blocks

```typescript
import { createBlock, createTextNode } from '@philjs/rich-text';

// Simple paragraph
const paragraph = createBlock('paragraph', [
  createTextNode('Hello, world!'),
]);

// Heading with formatted text
const heading = createBlock('heading1', [
  createTextNode('Welcome to '),
  createTextNode('PhilJS', [{ type: 'bold' }]),
]);

// Code block with language
const codeBlock = createBlock('code', [
  createTextNode('const x = 42;'),
], { language: 'javascript' });

// Image block
const image = createBlock('image', [], {
  src: '/images/photo.jpg',
  alt: 'A beautiful sunset',
});

// Divider
const divider = createBlock('divider');
```

### Text Marks (Formatting)

```typescript
// Available text marks
type TextMark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string } }
  | { type: 'highlight'; attrs: { color: string } };

// Creating formatted text
const formattedText = createTextNode('important', [
  { type: 'bold' },
  { type: 'highlight', attrs: { color: 'yellow' } },
]);

const link = createTextNode('Click here', [
  { type: 'link', attrs: { href: 'https://example.com' } },
]);
```

## Slash Commands

### Built-in Commands

Type `/` to open the command menu:

| Command | Description |
|---------|-------------|
| `/text` | Plain text paragraph |
| `/h1`, `/h2`, `/h3` | Headings |
| `/bullet` | Bulleted list |
| `/numbered` | Numbered list |
| `/todo` | Checklist |
| `/quote` | Block quote |
| `/code` | Code block |
| `/divider` | Horizontal divider |
| `/image` | Image |
| `/table` | Table |
| `/callout` | Callout box |

### Custom Slash Commands

```typescript
import { defaultSlashCommands } from '@philjs/rich-text';

const customCommands = [
  ...defaultSlashCommands,
  {
    name: 'video',
    label: 'Video',
    description: 'Embed a video',
    icon: '🎬',
    keywords: ['video', 'youtube', 'embed'],
    handler: (editor) => {
      const url = prompt('Enter video URL:');
      editor.insertBlock({
        type: 'video',
        attrs: { url },
      });
    },
  },
  {
    name: 'alert',
    label: 'Alert',
    description: 'Important alert box',
    icon: '⚠️',
    keywords: ['alert', 'warning', 'important'],
    handler: (editor) => {
      editor.insertBlock({
        type: 'callout',
        attrs: { variant: 'warning' },
      });
    },
  },
];

const editor = createRichTextEditor({
  container,
  slashCommands: customCommands,
});
```

### Slash Command Menu Component

```typescript
import { SlashCommandMenu } from '@philjs/rich-text';

<SlashCommandMenu
  commands={commands}
  isOpen={menuOpen}
  position={menuPosition}
  selectedIndex={selectedIndex}
  onSelect={(command) => command.handler(editor)}
  onClose={() => setMenuOpen(false)}
/>
```

## Floating Toolbar

### Configuration

```typescript
import { FloatingToolbar } from '@philjs/rich-text';

const toolbarConfig = {
  items: [
    { type: 'bold', icon: 'B', tooltip: 'Bold (Ctrl+B)' },
    { type: 'italic', icon: 'I', tooltip: 'Italic (Ctrl+I)' },
    { type: 'underline', icon: 'U', tooltip: 'Underline (Ctrl+U)' },
    { type: 'strike', icon: 'S', tooltip: 'Strikethrough' },
    { type: 'divider' },
    { type: 'code', icon: '<>', tooltip: 'Inline code' },
    { type: 'link', icon: '🔗', tooltip: 'Add link' },
    { type: 'divider' },
    { type: 'highlight', icon: '✨', tooltip: 'Highlight' },
  ],
};

<FloatingToolbar
  editor={editor}
  config={toolbarConfig}
  isVisible={hasSelection}
  position={toolbarPosition}
/>
```

### Custom Toolbar Items

```typescript
const customToolbarItems = [
  ...defaultToolbarItems,
  {
    type: 'custom',
    icon: '📝',
    tooltip: 'Add comment',
    onClick: (editor, selection) => {
      const comment = prompt('Enter comment:');
      editor.addComment(selection, comment);
    },
  },
];
```

## Block Rendering

### Custom Block Renderer

```typescript
import { BlockRenderer } from '@philjs/rich-text';

function CustomBlockRenderer({ block, editor }) {
  switch (block.type) {
    case 'callout':
      return (
        <div class={`callout callout-${block.attrs?.variant || 'info'}`}>
          <span class="callout-icon">{block.attrs?.icon || 'ℹ️'}</span>
          <div class="callout-content">
            <BlockRenderer
              blocks={block.children}
              editor={editor}
            />
          </div>
        </div>
      );

    case 'code':
      return (
        <pre data-language={block.attrs?.language}>
          <code>{getBlockText(block)}</code>
        </pre>
      );

    default:
      return <BlockRenderer block={block} editor={editor} />;
  }
}
```

## Editor Commands

### Text Formatting

```typescript
// Toggle formatting
editor.toggleBold();
editor.toggleItalic();
editor.toggleUnderline();
editor.toggleStrike();
editor.toggleCode();

// Set link
editor.setLink('https://example.com');
editor.unsetLink();

// Highlight
editor.setHighlight('yellow');
editor.unsetHighlight();
```

### Block Operations

```typescript
// Insert block at cursor
editor.insertBlock({ type: 'paragraph' });

// Convert current block
editor.setBlockType('heading1');

// Delete current block
editor.deleteBlock();

// Move block
editor.moveBlockUp();
editor.moveBlockDown();

// Duplicate block
editor.duplicateBlock();
```

### Selection

```typescript
// Get selection
const selection = editor.getSelection();

// Select all
editor.selectAll();

// Focus editor
editor.focus();

// Blur editor
editor.blur();
```

## Import/Export

### Export to HTML

```typescript
import { serializeToHTML } from '@philjs/rich-text';

const blocks = editor.getContent();
const html = serializeToHTML(blocks);

console.log(html);
// <h1>Welcome</h1>
// <p>This is a <strong>paragraph</strong> with <em>formatting</em>.</p>
```

### Export to Markdown

```typescript
import { serializeToMarkdown } from '@philjs/rich-text';

const blocks = editor.getContent();
const markdown = serializeToMarkdown(blocks);

console.log(markdown);
// # Welcome
//
// This is a **paragraph** with *formatting*.
```

### Import from HTML

```typescript
import { parseHTML } from '@philjs/rich-text';

const html = '<h1>Title</h1><p>Content here</p>';
const blocks = parseHTML(html);

editor.setContent(blocks);
```

### Export to JSON

```typescript
// Get content as JSON
const json = JSON.stringify(editor.getContent());

// Load from JSON
const blocks = JSON.parse(json);
editor.setContent(blocks);
```

## Keyboard Shortcuts

### Default Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+K` | Add link |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Tab` | Indent list |
| `Shift+Tab` | Outdent list |
| `Enter` | New block |
| `Backspace` | Delete block (if empty) |
| `/` | Open slash commands |

### Custom Key Bindings

```typescript
const customKeyBindings = [
  {
    key: 'Ctrl+Shift+H',
    handler: (editor) => {
      editor.setBlockType('heading1');
      return true; // Prevent default
    },
  },
  {
    key: 'Ctrl+Shift+C',
    handler: (editor) => {
      editor.setBlockType('code');
      return true;
    },
  },
];

const editor = createRichTextEditor({
  container,
  keyBindings: customKeyBindings,
});
```

## Collaborative Editing

### Setup Collaboration

```typescript
const editor = createRichTextEditor({
  container,
  collaboration: {
    enabled: true,
    documentId: 'doc-123',
    provider: 'websocket',
    url: 'wss://collab.example.com',
    user: {
      id: 'user-1',
      name: 'John Doe',
      color: '#FF5733',
    },
  },
});
```

### Collaborative Features

```typescript
// Listen for collaborator changes
editor.on('collaboratorJoined', (user) => {
  console.log(`${user.name} joined`);
});

editor.on('collaboratorLeft', (user) => {
  console.log(`${user.name} left`);
});

// Get collaborators
const collaborators = editor.getCollaborators();

// Show remote cursors
editor.showRemoteCursors(true);
```

## Types Reference

```typescript
// Block structure
interface Block {
  id: string;
  type: BlockType;
  content?: TextNode[];
  attrs?: Record<string, unknown>;
  children?: Block[];
}

// Text node
interface TextNode {
  type: 'text';
  text: string;
  marks?: TextMark[];
}

// Editor state
interface EditorState {
  blocks: Block[];
  selection: Selection | null;
}

// Selection
interface Selection {
  anchor: Position;
  head: Position;
  isCollapsed: boolean;
}

// Position
interface Position {
  blockId: string;
  offset: number;
}

// Slash command
interface SlashCommand {
  name: string;
  label: string;
  description: string;
  icon?: string;
  keywords: string[];
  handler: (editor: EditorInstance) => void;
}

// Toolbar item
interface ToolbarItem {
  type: string;
  icon?: string;
  tooltip?: string;
  onClick?: (editor: EditorInstance, selection: Selection) => void;
}

// Collaboration user
interface CollaborationUser {
  id: string;
  name: string;
  color: string;
}

// Export options
interface ExportOptions {
  format: 'json' | 'html' | 'markdown';
  includeMetadata?: boolean;
}
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `createRichTextEditor(options)` | Create editor instance |
| `createBlock(type, content?, attrs?)` | Create a block |
| `createTextNode(text, marks?)` | Create text node |
| `parseHTML(html)` | Parse HTML to blocks |
| `serializeToHTML(blocks)` | Export to HTML |
| `serializeToMarkdown(blocks)` | Export to Markdown |

### Components

| Component | Description |
|-----------|-------------|
| `Editor` | Main editor component |
| `BlockRenderer` | Renders blocks |
| `SlashCommandMenu` | Command menu |
| `FloatingToolbar` | Selection toolbar |

### Editor Methods

| Method | Description |
|--------|-------------|
| `getContent()` | Get all blocks |
| `setContent(blocks)` | Set content |
| `insertBlock(block)` | Insert block |
| `deleteBlock()` | Delete current block |
| `setBlockType(type)` | Change block type |
| `toggleBold()` | Toggle bold |
| `toggleItalic()` | Toggle italic |
| `setLink(url)` | Add link |
| `getSelection()` | Get selection |
| `focus()` | Focus editor |

## Examples

### Blog Post Editor

```typescript
import { createRichTextEditor, serializeToHTML } from '@philjs/rich-text';

function BlogEditor() {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = createRichTextEditor({
      container: editorRef.current,
      initialContent: [
        { type: 'heading1', content: [{ type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      ],
      placeholder: 'Write your story...',
      onChange: (blocks) => {
        autosave(blocks);
      },
    });

    return () => editor.destroy();
  }, []);

  const publish = async () => {
    const blocks = editor.getContent();
    const html = serializeToHTML(blocks);
    await api.publishPost({ content: html });
  };

  return (
    <div class="blog-editor">
      <div ref={editorRef} class="editor-container" />
      <button onClick={publish}>Publish</button>
    </div>
  );
}
```

### Document with Comments

```typescript
function DocumentEditor() {
  const [comments, setComments] = useState([]);

  const handleAddComment = (selection) => {
    const commentText = prompt('Add comment:');
    if (commentText) {
      setComments([...comments, {
        id: crypto.randomUUID(),
        selection,
        text: commentText,
        author: currentUser.name,
        timestamp: new Date(),
      }]);
    }
  };

  return (
    <div class="document-editor">
      <Editor
        initialContent={document.content}
        toolbar={{
          items: [
            ...defaultToolbarItems,
            {
              type: 'comment',
              icon: '💬',
              tooltip: 'Add comment',
              onClick: handleAddComment,
            },
          ],
        }}
      />
      <CommentsSidebar comments={comments} />
    </div>
  );
}
```
