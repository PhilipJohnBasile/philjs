#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const name = process.argv[2] || "my-philapp";
const dir = path.resolve(process.cwd(), name);

console.log(`Creating PhilJS app: ${name}`);

// Create directories
fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(path.join(dir, "src", "routes"), { recursive: true });

// Create README
fs.writeFileSync(
  path.join(dir, "README.md"),
  `# ${name}\n\nBuilt with PhilJS.\n\n## Getting Started\n\n\`\`\`bash\npnpm install\npnpm dev\n\`\`\``
);

// Create package.json
const packageJson = {
  name,
  version: "0.1.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview"
  },
  dependencies: {
    "philjs-core": "workspace:*",
    "philjs-router": "workspace:*",
    "philjs-ssr": "workspace:*",
    "philjs-islands": "workspace:*",
    "philjs-ai": "workspace:*"
  },
  devDependencies: {
    vite: "^5.4.11"
  }
};

fs.writeFileSync(
  path.join(dir, "package.json"),
  JSON.stringify(packageJson, null, 2)
);

// Create initial route
fs.writeFileSync(
  path.join(dir, "src", "routes", "index.tsx"),
  `export default function Home() {\n  return <h1>Welcome to PhilJS</h1>;\n}\n`
);

console.log(`\nSuccess! Created ${name}`);
console.log("\nNext steps:");
console.log(`  cd ${name}`);
console.log(`  pnpm install`);
console.log(`  pnpm dev`);
