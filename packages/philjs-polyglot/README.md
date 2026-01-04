
# @philjs/polyglot

Language Bridge & Code Generators.

## Features
- **Pydantic**: Python-to-TypeScript interface generator.
- **Backbone**: Legacy Backbone.js Model/Collection adapters.
- **Java**: Maven plugin configuration generator.

## Usage
```typescript
import { pydanticToTs } from '@philjs/polyglot';
const tsInterface = pydanticToTs(pythonCode);
```
