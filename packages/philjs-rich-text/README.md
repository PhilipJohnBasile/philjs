# @philjs/rich-text

Rich text block editor for PhilJS - Notion-style blocks, slash commands, collaborative editing

<!-- PACKAGE_GUIDE_START -->
## Overview

Rich text block editor for PhilJS - Notion-style blocks, slash commands, collaborative editing

## Focus Areas

- philjs, rich-text, editor, blocks, notion, prosemirror

## Entry Points

- packages/philjs-rich-text/src/index.ts

## Quick Start

```ts
import { createBlock, createTextNode, parseHTML } from '@philjs/rich-text';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- createBlock
- createTextNode
- parseHTML
- serializeToHTML
- serializeToMarkdown
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/rich-text
```
## Usage

```ts
import { createBlock, createTextNode, parseHTML } from '@philjs/rich-text';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-rich-text/src/index.ts

### Public API
- Direct exports: createBlock, createTextNode, parseHTML, serializeToHTML, serializeToMarkdown
- Re-exported names: Block, BlockRenderer, BlockType, CollaborationConfig, CollaborationUser, Cursor, Editor, EditorCommands, EditorConfig, EditorInstance, EditorOptions, EditorState, EditorView, ExportOptions, Extension, FloatingToolbar, FloatingToolbarOptions, ImportOptions, KeyBinding, NodeView, NodeViewFactory, Position, Selection, SlashCommand, SlashCommandMenu, SlashCommandMenuOptions, TextMark, TextNode, ToolbarConfig, ToolbarItem, createEditor, createRichTextEditor, defaultSlashCommands
- Re-exported modules: ./components/index.js, ./core/editor.js, ./extensions/defaultCommands.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT
