# Build a Notion Clone with PhilJS Nexus

In this tutorial, you'll build a fully-featured Notion-like document editor with:
- ✅ Real-time collaboration (multiple users editing simultaneously)
- ✅ Local-first data (works offline, syncs when online)
- ✅ Rich text editing with blocks
- ✅ Presence indicators (see who's editing)
- ✅ AI-powered writing assistance

**Time to complete**: ~45 minutes
**Prerequisites**: Basic TypeScript and PhilJS knowledge

---

## 1. Project Setup

```bash
pnpm create philjs notion-clone
cd notion-clone
pnpm add @philjs/nexus @philjs/collab @philjs/ai
```

## 2. Create the Document Store

```typescript
// src/stores/document.ts
import { createNexusApp, useDocument, usePresence } from '@philjs/nexus';
import { signal } from '@philjs/core';

// Initialize Nexus with local-first + collaboration
export const nexus = createNexusApp({
  appId: 'notion-clone',
  local: {
    adapter: 'indexeddb',
    database: 'notion-docs',
  },
  remote: {
    adapter: 'websocket',
    url: 'wss://your-sync-server.com',
  },
  collab: {
    enabled: true,
    presence: true,
  },
});

// Document type definition
export interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'image';
  content: string;
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}
```

## 3. Build the Editor Component

```typescript
// src/components/Editor.tsx
import { signal, memo, effect } from '@philjs/core';
import { useDocument, usePresence, useAI } from '@philjs/nexus';
import type { Document, Block } from '../stores/document';

interface EditorProps {
  documentId: string;
}

export function Editor(props: EditorProps) {
  // Load document with CRDT-backed state
  const doc = useDocument<Document>(props.documentId);
  
  // Real-time presence
  const presence = usePresence({
    roomId: `doc:${props.documentId}`,
    userInfo: { name: 'Anonymous', color: '#' + Math.floor(Math.random()*16777215).toString(16) },
  });
  
  // AI writing assistant
  const ai = useAI();
  
  // Local editing state
  const activeBlockId = signal<string | null>(null);
  
  // Derived: online users count
  const onlineCount = memo(() => Object.keys(presence.users()).length);
  
  // Track cursor position for presence
  effect(() => {
    const blockId = activeBlockId();
    if (blockId) {
      presence.track({ cursor: { blockId } });
    }
  });
  
  // Add a new block
  const addBlock = (type: Block['type'] = 'paragraph') => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: '',
    };
    
    doc.update((d) => {
      d.blocks.push(newBlock);
      d.updatedAt = Date.now();
    });
    
    activeBlockId.set(newBlock.id);
  };
  
  // Update block content (with CRDT conflict resolution)
  const updateBlock = (blockId: string, content: string) => {
    doc.update((d) => {
      const block = d.blocks.find(b => b.id === blockId);
      if (block) {
        block.content = content;
        d.updatedAt = Date.now();
      }
    });
  };
  
  // AI-powered continue writing
  const continueWriting = async (blockId: string) => {
    const block = doc.data()?.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const continuation = await ai.complete({
      prompt: block.content,
      maxTokens: 100,
    });
    
    updateBlock(blockId, block.content + continuation);
  };
  
  return (
    <div class="editor">
      {/* Header with presence */}
      <header class="editor-header">
        <input
          type="text"
          class="document-title"
          value={doc.data()?.title ?? 'Untitled'}
          onInput={(e) => doc.update(d => { d.title = e.target.value; })}
        />
        <div class="presence-bar">
          <span>{onlineCount()} online</span>
          <div class="avatars">
            {Object.values(presence.users()).map((user) => (
              <div 
                class="avatar" 
                style={{ backgroundColor: user.info.color }}
                title={user.info.name}
              />
            ))}
          </div>
        </div>
      </header>
      
      {/* Block editor */}
      <div class="blocks">
        {doc.data()?.blocks.map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
            isActive={activeBlockId() === block.id}
            cursors={presence.getCursorsAt({ blockId: block.id })}
            onFocus={() => activeBlockId.set(block.id)}
            onChange={(content) => updateBlock(block.id, content)}
            onAIAssist={() => continueWriting(block.id)}
          />
        ))}
      </div>
      
      {/* Add block button */}
      <button class="add-block" onClick={() => addBlock()}>
        + Add block
      </button>
      
      {/* Sync status */}
      <footer class="sync-status">
        {doc.syncing() ? '⏳ Syncing...' : '✅ Synced'}
        {doc.offline() && ' (Offline - changes saved locally)'}
      </footer>
    </div>
  );
}
```

## Key Concepts Covered

| Feature | PhilJS Package | Description |
|:--------|:---------------|:------------|
| Local-first data | `@philjs/nexus` | IndexedDB storage, offline support |
| Real-time sync | `@philjs/nexus` | WebSocket-based CRDT sync |
| Presence | `@philjs/collab` | See other users' cursors |
| AI assistance | `@philjs/ai` | LLM-powered writing help |
| Fine-grained reactivity | `@philjs/core` | Signals for efficient updates |
