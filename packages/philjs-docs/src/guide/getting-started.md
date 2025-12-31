# Getting Started

## Prerequisites

- Node.js 24+ (Node 25 supported)
- (Optional) Rust 1.70+ for Rust components

## Quick Start

\`\`\`bash
pnpm create philjs@latest my-app
cd my-app
pnpm dev
\`\`\`

## Manual Setup

\`\`\`bash
pnpm add @philjs/core
\`\`\`

\`\`\`tsx
import { signal, render } from '@philjs/core';

function App() {
  const count = signal(0);
  return (
    <button onClick={() => count.set(c => c + 1)}>
      Count: {count()}
    </button>
  );
}

render(<App />, document.getElementById('root')!);
\`\`\`
