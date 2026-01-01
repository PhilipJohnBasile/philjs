# @philjs/llm-ui

Streaming chat UI components for PhilJS - ChatGPT-style interfaces, markdown, code blocks, tool calls

<!-- PACKAGE_GUIDE_START -->
## Overview

Streaming chat UI components for PhilJS - ChatGPT-style interfaces, markdown, code blocks, tool calls

## Focus Areas

- philjs, llm, chat, streaming, ui, markdown, ai, chatgpt

## Entry Points

- packages/philjs-llm-ui/src/index.ts

## Quick Start

```ts
import { // Core classes
  ChatContainer, // Hooks
  useChat, // Types
  type ChatMessage } from '@philjs/llm-ui';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- // Core classes
  ChatContainer
- // Hooks
  useChat
- // Types
  type ChatMessage
- ChatConfig
- ChatInput
- ChatInputConfig
- MarkdownRenderer
- MessageComponent
- MessageComponentConfig
- StreamingText
- StreamingTextConfig
- ThinkingIndicator
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/llm-ui
```
## Usage

```ts
import { // Core classes
  ChatContainer, // Hooks
  useChat, // Types
  type ChatMessage } from '@philjs/llm-ui';
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
- Source files: packages/philjs-llm-ui/src/index.ts

### Public API
- Direct exports: // Core classes
  ChatContainer, // Hooks
  useChat, // Types
  type ChatMessage, ChatConfig, ChatInput, ChatInputConfig, MarkdownRenderer, MessageComponent, MessageComponentConfig, StreamingText, StreamingTextConfig, ThinkingIndicator, ToolCallDisplay, UseChatResult, useStreamingText
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
