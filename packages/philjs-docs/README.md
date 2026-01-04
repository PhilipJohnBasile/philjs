
# @philjs/docs

Autonomous Documentation Generator.

## Features
- **Self-Writing**: Analyzes AST and generates Markdown.
- **Always Up-to-Date**: Runs on pre-commit to ensure docs match code.

## Usage
```typescript
import { generateDocs } from '@philjs/docs';
await generateDocs('./src/index.ts');
```
