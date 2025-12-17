---
title: "Getting Started with PhilJS"
date: "2024-01-15"
author: "John Doe"
excerpt: "Learn how to build lightning-fast web apps with PhilJS"
tags: ["philjs", "tutorial", "getting-started"]
---

# Getting Started with PhilJS

PhilJS is a revolutionary framework that combines the best ideas from React, Solid, and Qwik.

## Why PhilJS?

Here are the key benefits:

1. **Zero hydration** - Apps are interactive immediately
2. **Fine-grained reactivity** - Only what changes updates
3. **Built-in SSG** - Static generation out of the box

## Code Example

```typescript
import { signal } from 'philjs-core';

const count = signal(0);

<button onClick={() => count.set(c => c + 1)}>
  Clicked {count()} times
</button>
```

This is just the beginning. PhilJS makes building fast web apps effortless.

## Getting Started

To create a new PhilJS project:

```bash
pnpm create philjs my-app
cd my-app
pnpm dev
```

## Next Steps

- Explore the documentation
- Try the interactive examples
- Build something amazing!
