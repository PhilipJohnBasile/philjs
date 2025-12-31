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
    "@philjs/core": "^0.1.0",
    "@philjs/router": "^0.1.0",
    "@philjs/ssr": "^0.1.0",
    "@philjs/islands": "^0.1.0",
    "@philjs/ai": "^0.1.0"
  },
  devDependencies: {
    "@types/node": "^25.0.0",
    typescript: "^6.0.0",
    vite: "^7.3.0"
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
