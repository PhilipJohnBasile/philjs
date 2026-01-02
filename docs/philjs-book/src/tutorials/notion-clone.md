# Building a Notion Clone with Nexus

In this tutorial, we'll build a fully-featured Notion-like application using `@philjs/nexus`. By the end, you'll have:

- A block-based editor with rich text
- Real-time collaboration with presence indicators
- AI-powered writing assistance
- Offline support with automatic sync
- Full-text search across all documents

**Time**: ~60 minutes
**Prerequisites**: Familiarity with PhilJS basics, TypeScript

## What We're Building

Our Notion clone will have:

1. **Workspace** - A sidebar with pages and nested pages
2. **Block Editor** - Paragraphs, headings, lists, code blocks, images
3. **Collaboration** - See who's editing, live cursors
4. **AI Assistant** - Summarize, expand, translate, fix grammar
5. **Offline Mode** - Works without internet, syncs when back online

## Project Setup

```bash
# Create a new PhilJS project
npx create-philjs notion-clone --template nexus

cd notion-clone
npm install
```

Or add Nexus to an existing project:

```bash
npm install @philjs/nexus @philjs/ui
```

## Step 1: Configure Nexus

Create `src/nexus.ts`:

```typescript
import { createNexusApp, NexusApp } from '@philjs/nexus';

// Type definitions for our app
export interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'code' | 'image';
  content: string;
  properties?: Record<string, unknown>;
}

export interface Page {
  id: string;
  title: string;
  icon?: string;
  parentId?: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

export interface Workspace {
  id: string;
  name: string;
  pages: string[]; // Page IDs
}

// Create the Nexus app
export const app: NexusApp = createNexusApp({
  // Local storage with encryption
  local: {
    adapter: 'indexeddb',
    dbName: 'notion-clone',
    encryption: true,
  },

  // Remote sync (optional - works offline without this)
  remote: {
    adapter: 'supabase',
    url: import.meta.env.VITE_SUPABASE_URL,
    auth: {
      apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    syncStrategy: 'realtime',
    conflictResolution: 'crdt',
  },

  // AI capabilities
  ai: {
    provider: 'anthropic',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    cache: true,
    trackCosts: true,
    dailyBudget: 5, // $5/day limit
  },

  // Real-time collaboration
  collab: {
    presence: true,
    cursors: true,
    websocketUrl: import.meta.env.VITE_COLLAB_URL,
  },
});

// Initialize on app start
export async function initApp() {
  await app.connect();
  console.log('Nexus connected:', app.isConnected());
}
```

## Step 2: Build the Workspace Sidebar

Create `src/components/Sidebar.tsx`:

```typescript
import { useNexusCollection, useNexusSync } from '@philjs/nexus';
import { createSignal } from '@philjs/core';
import type { Page } from '../nexus';

export function Sidebar({ onSelectPage }: { onSelectPage: (id: string) => void }) {
  const { items: pages, add, remove, loading } = useNexusCollection<Page>('pages');
  const { status, isOnline } = useNexusSync();
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set());

  async function createPage(parentId?: string) {
    const id = crypto.randomUUID();
    await add({
      id,
      title: 'Untitled',
      parentId,
      blocks: [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onSelectPage(id);
  }

  function toggleExpand(id: string) {
    const next = new Set(expanded());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  }

  // Build tree structure
  const rootPages = () => pages().filter(p => !p.parentId);
  const childPages = (parentId: string) => pages().filter(p => p.parentId === parentId);

  function renderPage(page: Page, depth = 0) {
    const children = childPages(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded().has(page.id);

    return (
      <div key={page.id}>
        <div
          class="sidebar-item"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectPage(page.id)}
        >
          {hasChildren && (
            <button
              class="expand-btn"
              onClick={(e) => { e.stopPropagation(); toggleExpand(page.id); }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <span class="page-icon">{page.icon || '📄'}</span>
          <span class="page-title">{page.title || 'Untitled'}</span>
          <button
            class="add-subpage"
            onClick={(e) => { e.stopPropagation(); createPage(page.id); }}
          >
            +
          </button>
        </div>
        {isExpanded && children.map(child => renderPage(child, depth + 1))}
      </div>
    );
  }

  return (
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Workspace</h2>
        <div class="sync-status">
          {isOnline() ? (
            status().state === 'syncing' ? '🔄' : '🟢'
          ) : '🔴'}
          {status().pendingChanges > 0 && (
            <span class="pending">{status().pendingChanges} pending</span>
          )}
        </div>
      </div>

      <nav class="page-list">
        {loading() ? (
          <div class="loading">Loading...</div>
        ) : (
          rootPages().map(page => renderPage(page))
        )}
      </nav>

      <button class="new-page-btn" onClick={() => createPage()}>
        + New Page
      </button>
    </aside>
  );
}
```

## Step 3: Build the Block Editor

Create `src/components/BlockEditor.tsx`:

```typescript
import { createSignal, createEffect } from '@philjs/core';
import { useNexusDocument, useNexusPresence } from '@philjs/nexus';
import type { Page, Block } from '../nexus';

interface BlockEditorProps {
  pageId: string;
}

export function BlockEditor({ pageId }: BlockEditorProps) {
  const { data: page, set, loading, error } = useNexusDocument<Page>(`pages/${pageId}`);
  const { users, updateCursor } = useNexusPresence();
  const [focusedBlock, setFocusedBlock] = createSignal<string | null>(null);

  // Track cursor position for collaboration
  function handleMouseMove(e: MouseEvent) {
    updateCursor({ x: e.clientX, y: e.clientY, documentId: pageId });
  }

  // Update a specific block
  async function updateBlock(blockId: string, content: string) {
    const current = page();
    if (!current) return;

    const blocks = current.blocks.map(b =>
      b.id === blockId ? { ...b, content } : b
    );
    await set({ ...current, blocks, updatedAt: Date.now() });
  }

  // Change block type
  async function changeBlockType(blockId: string, type: Block['type']) {
    const current = page();
    if (!current) return;

    const blocks = current.blocks.map(b =>
      b.id === blockId ? { ...b, type } : b
    );
    await set({ ...current, blocks, updatedAt: Date.now() });
  }

  // Add a new block after the current one
  async function addBlockAfter(afterId: string) {
    const current = page();
    if (!current) return;

    const index = current.blocks.findIndex(b => b.id === afterId);
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type: 'paragraph',
      content: '',
    };

    const blocks = [
      ...current.blocks.slice(0, index + 1),
      newBlock,
      ...current.blocks.slice(index + 1),
    ];
    await set({ ...current, blocks, updatedAt: Date.now() });
    setFocusedBlock(newBlock.id);
  }

  // Delete a block
  async function deleteBlock(blockId: string) {
    const current = page();
    if (!current || current.blocks.length <= 1) return;

    const blocks = current.blocks.filter(b => b.id !== blockId);
    await set({ ...current, blocks, updatedAt: Date.now() });
  }

  // Handle keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent, block: Block) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlockAfter(block.id);
    } else if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      deleteBlock(block.id);
    } else if (e.key === '/' && block.content === '') {
      // Show block type menu (implement separately)
    }
  }

  if (loading()) return <div class="editor-loading">Loading...</div>;
  if (error()) return <div class="editor-error">Error: {error()?.message}</div>;
  if (!page()) return <div class="editor-empty">Page not found</div>;

  return (
    <div class="block-editor" onMouseMove={handleMouseMove}>
      {/* Collaborative cursors */}
      <div class="cursors">
        {users().map(user => user.cursor && (
          <div
            key={user.id}
            class="cursor"
            style={{
              left: `${user.cursor.x}px`,
              top: `${user.cursor.y}px`,
              backgroundColor: user.color,
            }}
          >
            <span class="cursor-label">{user.name}</span>
          </div>
        ))}
      </div>

      {/* Page title */}
      <input
        class="page-title-input"
        value={page()?.title}
        placeholder="Untitled"
        onInput={(e) => set({ ...page()!, title: e.currentTarget.value })}
      />

      {/* Blocks */}
      <div class="blocks">
        {page()?.blocks.map(block => (
          <BlockComponent
            key={block.id}
            block={block}
            focused={focusedBlock() === block.id}
            onFocus={() => setFocusedBlock(block.id)}
            onChange={(content) => updateBlock(block.id, content)}
            onChangeType={(type) => changeBlockType(block.id, type)}
            onKeyDown={(e) => handleKeyDown(e, block)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual block component
function BlockComponent({
  block,
  focused,
  onFocus,
  onChange,
  onChangeType,
  onKeyDown,
}: {
  block: Block;
  focused: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
  onChangeType: (type: Block['type']) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}) {
  const [showMenu, setShowMenu] = createSignal(false);

  const Tag = {
    paragraph: 'p',
    heading1: 'h1',
    heading2: 'h2',
    heading3: 'h3',
    bullet: 'li',
    numbered: 'li',
    code: 'pre',
    image: 'div',
  }[block.type] as keyof HTMLElementTagNameMap;

  const className = `block block-${block.type}`;

  if (block.type === 'image') {
    return (
      <div class={className}>
        <img src={block.content} alt="" />
      </div>
    );
  }

  return (
    <div class={className}>
      <div class="block-handle" onClick={() => setShowMenu(!showMenu())}>
        ⋮⋮
      </div>

      {showMenu() && (
        <div class="block-menu">
          <button onClick={() => { onChangeType('paragraph'); setShowMenu(false); }}>Text</button>
          <button onClick={() => { onChangeType('heading1'); setShowMenu(false); }}>H1</button>
          <button onClick={() => { onChangeType('heading2'); setShowMenu(false); }}>H2</button>
          <button onClick={() => { onChangeType('heading3'); setShowMenu(false); }}>H3</button>
          <button onClick={() => { onChangeType('bullet'); setShowMenu(false); }}>Bullet</button>
          <button onClick={() => { onChangeType('code'); setShowMenu(false); }}>Code</button>
        </div>
      )}

      <Tag
        contentEditable
        class="block-content"
        innerHTML={block.content}
        onFocus={onFocus}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
```

## Step 4: Add AI Writing Assistant

Create `src/components/AIAssistant.tsx`:

```typescript
import { createSignal } from '@philjs/core';
import { useNexusAI, useNexusAIStream } from '@philjs/nexus';

interface AIAssistantProps {
  selectedText: string;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
}

export function AIAssistant({ selectedText, onInsert, onReplace }: AIAssistantProps) {
  const { generate, loading, error, usage } = useNexusAI();
  const { stream, content: streamContent, loading: streaming } = useNexusAIStream();
  const [mode, setMode] = createSignal<'quick' | 'stream'>('quick');

  const actions = [
    { label: 'Improve writing', prompt: 'Improve this text while keeping the same meaning:\n\n' },
    { label: 'Fix grammar', prompt: 'Fix any grammar and spelling errors in this text:\n\n' },
    { label: 'Make shorter', prompt: 'Make this text more concise:\n\n' },
    { label: 'Make longer', prompt: 'Expand this text with more detail:\n\n' },
    { label: 'Simplify', prompt: 'Simplify this text for easier reading:\n\n' },
    { label: 'Translate to Spanish', prompt: 'Translate this text to Spanish:\n\n' },
    { label: 'Summarize', prompt: 'Summarize this text in 2-3 sentences:\n\n' },
  ];

  async function runAction(promptPrefix: string) {
    const fullPrompt = promptPrefix + selectedText;

    if (mode() === 'stream') {
      await stream(fullPrompt);
      onReplace(streamContent());
    } else {
      const result = await generate(fullPrompt, {
        systemPrompt: 'You are a helpful writing assistant. Return only the improved text, no explanations.',
        temperature: 0.3,
      });
      onReplace(result);
    }
  }

  async function continueWriting() {
    const prompt = `Continue writing from where this text leaves off. Match the style and tone:\n\n${selectedText}`;
    await stream(prompt);
    onInsert(streamContent());
  }

  if (!selectedText) {
    return null;
  }

  return (
    <div class="ai-assistant">
      <div class="ai-header">
        <span>AI Assistant</span>
        <label>
          <input
            type="checkbox"
            checked={mode() === 'stream'}
            onChange={(e) => setMode(e.currentTarget.checked ? 'stream' : 'quick')}
          />
          Stream response
        </label>
      </div>

      <div class="ai-actions">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={() => runAction(action.prompt)}
            disabled={loading() || streaming()}
          >
            {action.label}
          </button>
        ))}
        <button
          class="continue-btn"
          onClick={continueWriting}
          disabled={loading() || streaming()}
        >
          Continue writing...
        </button>
      </div>

      {(loading() || streaming()) && (
        <div class="ai-loading">
          {streaming() ? streamContent() : 'Thinking...'}
        </div>
      )}

      {error() && (
        <div class="ai-error">Error: {error()?.message}</div>
      )}

      <div class="ai-usage">
        Tokens: {usage().tokens} | Cost: ${usage().cost.toFixed(4)}
      </div>
    </div>
  );
}
```

## Step 5: Add Presence Indicators

Create `src/components/PresenceBar.tsx`:

```typescript
import { useNexusPresence } from '@philjs/nexus';

export function PresenceBar() {
  const { users } = useNexusPresence();

  return (
    <div class="presence-bar">
      {users().map(user => (
        <div
          key={user.id}
          class="presence-avatar"
          style={{ backgroundColor: user.color }}
          title={`${user.name}${user.typing ? ' (typing...)' : ''}`}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user.name.charAt(0).toUpperCase()}</span>
          )}
          {user.typing && <span class="typing-indicator">...</span>}
        </div>
      ))}
    </div>
  );
}
```

## Step 6: Build the Main App

Create `src/App.tsx`:

```typescript
import { createSignal, onMount } from '@philjs/core';
import { initApp } from './nexus';
import { Sidebar } from './components/Sidebar';
import { BlockEditor } from './components/BlockEditor';
import { AIAssistant } from './components/AIAssistant';
import { PresenceBar } from './components/PresenceBar';

export function App() {
  const [ready, setReady] = createSignal(false);
  const [selectedPageId, setSelectedPageId] = createSignal<string | null>(null);
  const [selectedText, setSelectedText] = createSignal('');

  onMount(async () => {
    await initApp();
    setReady(true);
  });

  // Track text selection for AI assistant
  function handleSelectionChange() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
    }
  }

  if (!ready()) {
    return <div class="app-loading">Loading Nexus...</div>;
  }

  return (
    <div class="app" onMouseUp={handleSelectionChange}>
      <Sidebar onSelectPage={setSelectedPageId} />

      <main class="main-content">
        <header class="header">
          <PresenceBar />
        </header>

        {selectedPageId() ? (
          <BlockEditor pageId={selectedPageId()!} />
        ) : (
          <div class="no-page-selected">
            Select a page or create a new one
          </div>
        )}

        <AIAssistant
          selectedText={selectedText()}
          onInsert={(text) => {
            // Insert at cursor position
            document.execCommand('insertText', false, text);
            setSelectedText('');
          }}
          onReplace={(text) => {
            // Replace selected text
            document.execCommand('insertText', false, text);
            setSelectedText('');
          }}
        />
      </main>
    </div>
  );
}
```

## Step 7: Add Styles

Create `src/styles.css`:

```css
/* Layout */
.app {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.sidebar {
  width: 260px;
  background: #f7f6f3;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Sidebar */
.sidebar-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sync-status {
  font-size: 12px;
}

.page-list {
  flex: 1;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  gap: 4px;
}

.sidebar-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.new-page-btn {
  margin: 16px;
  padding: 8px;
  background: none;
  border: 1px dashed #ccc;
  cursor: pointer;
}

/* Block Editor */
.block-editor {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 96px;
  position: relative;
}

.page-title-input {
  width: 100%;
  font-size: 40px;
  font-weight: 700;
  border: none;
  outline: none;
  margin-bottom: 24px;
}

.block {
  position: relative;
  padding: 4px 0;
}

.block-handle {
  position: absolute;
  left: -24px;
  opacity: 0;
  cursor: grab;
  color: #999;
}

.block:hover .block-handle {
  opacity: 1;
}

.block-content {
  outline: none;
  min-height: 1.5em;
}

.block-content:empty::before {
  content: "Type '/' for commands...";
  color: #aaa;
}

/* Block types */
.block-heading1 .block-content { font-size: 30px; font-weight: 700; }
.block-heading2 .block-content { font-size: 24px; font-weight: 600; }
.block-heading3 .block-content { font-size: 20px; font-weight: 600; }
.block-code .block-content {
  font-family: monospace;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
}

/* Cursors */
.cursors {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1000;
}

.cursor {
  position: absolute;
  width: 2px;
  height: 20px;
  transition: all 50ms ease;
}

.cursor-label {
  position: absolute;
  top: -20px;
  left: 0;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  color: white;
  background: inherit;
  white-space: nowrap;
}

/* Presence */
.presence-bar {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
}

.presence-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  position: relative;
}

.typing-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 10px;
}

/* AI Assistant */
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
}

.ai-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-actions button {
  padding: 6px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.ai-actions button:hover {
  background: #e0e0e0;
}

.ai-loading {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 14px;
}

.ai-usage {
  margin-top: 12px;
  font-size: 11px;
  color: #888;
}
```

## Step 8: Set Up Environment Variables

Create `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
VITE_COLLAB_URL=wss://your-collab-server.com
```

## Step 9: Run the App

```bash
npm run dev
```

Open http://localhost:5173 and you should see your Notion clone!

## What You've Built

You now have a fully-featured Notion clone with:

| Feature | How It Works |
|---------|--------------|
| **Offline editing** | All changes go to IndexedDB first, sync when online |
| **Real-time sync** | CRDTs merge changes automatically without conflicts |
| **AI writing** | Claude helps improve, expand, translate your text |
| **Collaboration** | See others' cursors and presence in real-time |
| **Cost tracking** | AI usage is tracked with daily budget limits |

## Next Steps

- **Add search**: Use `app.search()` for full-text search across documents
- **Add comments**: Create a `comments` collection linked to blocks
- **Add databases**: Use `useNexusCollection` for table views
- **Add templates**: Pre-populate pages with common block structures
- **Deploy**: See the [Deployment Guide](../deployment/overview.md)

## Complete Source Code

Find the complete source code on GitHub: [philjs/examples/notion-clone](https://github.com/philjs/examples/notion-clone)
