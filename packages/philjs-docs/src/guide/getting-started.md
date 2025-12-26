# Getting Started

## Prerequisites

- Node.js 18+ or Bun 1.0+
- (Optional) Rust 1.70+ for Rust components

## Quick Start

\`\`\`bash
npm create philjs@latest my-app
cd my-app
npm run dev
\`\`\`

## Manual Setup

\`\`\`bash
npm install philjs-core
\`\`\`

\`\`\`tsx
import { signal, render } from 'philjs-core';

function App() {
  const count = signal(0);
  return (
    <button onClick={() => count.set(c => c + 1)}>
      Count: {count()}
    </button>
  );
}

render(() => <App />, document.getElementById('root')!);
\`\`\`
