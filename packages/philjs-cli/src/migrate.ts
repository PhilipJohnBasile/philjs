/**
 * PhilJS Migrate Command
 * Migrate from React, Vue, or Svelte to PhilJS
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import prompts from 'prompts';

type Framework = 'react' | 'vue' | 'svelte';

const MIGRATION_GUIDES: Record<Framework, { name: string; description: string }> = {
  react: {
    name: 'React',
    description: 'Migrate from React to PhilJS',
  },
  vue: {
    name: 'Vue',
    description: 'Migrate from Vue to PhilJS',
  },
  svelte: {
    name: 'Svelte',
    description: 'Migrate from Svelte to PhilJS',
  },
};

export async function migrateProject(framework?: string): Promise<void> {
  console.log(pc.cyan('\n🔄 PhilJS Migration Tool\n'));

  let sourceFramework: Framework;
  if (framework && framework in MIGRATION_GUIDES) {
    sourceFramework = framework as Framework;
  } else {
    const response = await prompts({
      type: 'select',
      name: 'framework',
      message: 'Migrate from:',
      choices: Object.entries(MIGRATION_GUIDES).map(([key, { name, description }]) => ({
        title: `${name} - ${description}`,
        value: key,
      })),
    }, {
      onCancel: () => {
        console.log(pc.red('\n✖ Cancelled\n'));
        process.exit(1);
      }
    });
    sourceFramework = response.framework;
  }

  console.log(pc.cyan(`\n📦 Analyzing ${MIGRATION_GUIDES[sourceFramework].name} project...\n`));

  // Detect project structure
  const analysis = await analyzeProject(sourceFramework);

  console.log(pc.dim(`Found ${analysis.components.length} component(s)`));
  console.log(pc.dim(`Found ${analysis.hooks.length} hook(s)`));
  console.log(pc.dim(`Found ${analysis.routes.length} route(s)\n`));

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Generate migration report and conversion suggestions?',
    initial: true,
  });

  if (!confirm) {
    console.log(pc.red('\n✖ Cancelled\n'));
    process.exit(1);
  }

  // Generate migration report
  await generateMigrationReport(sourceFramework, analysis);

  console.log(pc.green('\n✓ Migration report generated!\n'));
  console.log(pc.dim('Check MIGRATION_REPORT.md for detailed conversion guide.\n'));
}

interface ProjectAnalysis {
  framework: Framework;
  components: ComponentInfo[];
  hooks: HookInfo[];
  routes: RouteInfo[];
  stateManagement: string | null;
  cssFramework: string | null;
}

interface ComponentInfo {
  path: string;
  name: string;
  hasState: boolean;
  hasEffects: boolean;
  hasProps: boolean;
}

interface HookInfo {
  path: string;
  name: string;
  type: string;
}

interface RouteInfo {
  path: string;
  component: string;
}

async function analyzeProject(framework: Framework): Promise<ProjectAnalysis> {
  const analysis: ProjectAnalysis = {
    framework,
    components: [],
    hooks: [],
    routes: [],
    stateManagement: null,
    cssFramework: null,
  };

  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));

    // Detect state management
    if (pkg.dependencies) {
      if ('redux' in pkg.dependencies || '@reduxjs/toolkit' in pkg.dependencies) {
        analysis.stateManagement = 'Redux';
      } else if ('zustand' in pkg.dependencies) {
        analysis.stateManagement = 'Zustand';
      } else if ('jotai' in pkg.dependencies) {
        analysis.stateManagement = 'Jotai';
      } else if ('recoil' in pkg.dependencies) {
        analysis.stateManagement = 'Recoil';
      } else if ('pinia' in pkg.dependencies) {
        analysis.stateManagement = 'Pinia';
      } else if ('vuex' in pkg.dependencies) {
        analysis.stateManagement = 'Vuex';
      }

      // Detect CSS framework
      if ('tailwindcss' in pkg.dependencies || 'tailwindcss' in pkg.devDependencies) {
        analysis.cssFramework = 'Tailwind';
      } else if ('styled-components' in pkg.dependencies) {
        analysis.cssFramework = 'Styled Components';
      } else if ('@emotion/react' in pkg.dependencies) {
        analysis.cssFramework = 'Emotion';
      }
    }

    // Find components
    const srcPath = path.join(process.cwd(), 'src');
    analysis.components = await findComponents(srcPath, framework);
    analysis.hooks = await findHooks(srcPath, framework);
    analysis.routes = await findRoutes(srcPath, framework);
  } catch (error) {
    console.error(pc.yellow('Warning: Could not fully analyze project'), error);
  }

  return analysis;
}

async function findComponents(dir: string, framework: Framework): Promise<ComponentInfo[]> {
  const components: ComponentInfo[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        components.push(...await findComponents(fullPath, framework));
      } else if (isComponentFile(entry.name, framework)) {
        const content = await fs.readFile(fullPath, 'utf-8');
        components.push({
          path: fullPath,
          name: path.basename(entry.name, path.extname(entry.name)),
          hasState: hasState(content, framework),
          hasEffects: hasEffects(content, framework),
          hasProps: hasProps(content, framework),
        });
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
  }

  return components;
}

async function findHooks(dir: string, framework: Framework): Promise<HookInfo[]> {
  const hooks: HookInfo[] = [];

  if (framework !== 'react') return hooks;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        hooks.push(...await findHooks(fullPath, framework));
      } else if (entry.name.match(/^use[A-Z].+\.(ts|tsx|js|jsx)$/)) {
        hooks.push({
          path: fullPath,
          name: path.basename(entry.name, path.extname(entry.name)),
          type: 'custom',
        });
      }
    }
  } catch (error) {
    // Directory doesn't exist
  }

  return hooks;
}

async function findRoutes(dir: string, framework: Framework): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  // This is simplified - real implementation would parse routing configs
  try {
    if (framework === 'react') {
      // Look for react-router or similar
      const routerFiles = ['App.tsx', 'App.jsx', 'routes.tsx', 'routes.jsx'];
      for (const file of routerFiles) {
        try {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          // Parse routes from content
          const routeMatches = content.matchAll(/<Route\s+path=["']([^"']+)["']/g);
          for (const match of routeMatches) {
            routes.push({ path: match[1], component: 'Unknown' });
          }
        } catch {
          // File doesn't exist
        }
      }
    }
  } catch (error) {
    // Error finding routes
  }

  return routes;
}

function isComponentFile(filename: string, framework: Framework): boolean {
  switch (framework) {
    case 'react':
      return /\.(tsx|jsx)$/.test(filename) && !filename.startsWith('use');
    case 'vue':
      return filename.endsWith('.vue');
    case 'svelte':
      return filename.endsWith('.svelte');
    default:
      return false;
  }
}

function hasState(content: string, framework: Framework): boolean {
  switch (framework) {
    case 'react':
      return /useState|useReducer|this\.state/.test(content);
    case 'vue':
      return /data\(\)|ref\(|reactive\(/.test(content);
    case 'svelte':
      return /let\s+\w+\s*=/.test(content);
    default:
      return false;
  }
}

function hasEffects(content: string, framework: Framework): boolean {
  switch (framework) {
    case 'react':
      return /useEffect|useLayoutEffect|componentDidMount/.test(content);
    case 'vue':
      return /onMounted|onUpdated|watch/.test(content);
    case 'svelte':
      return /onMount|\$:/.test(content);
    default:
      return false;
  }
}

function hasProps(content: string, framework: Framework): boolean {
  switch (framework) {
    case 'react':
      return /props\.|{.*}.*=.*props/.test(content);
    case 'vue':
      return /defineProps|props:/.test(content);
    case 'svelte':
      return /export let/.test(content);
    default:
      return false;
  }
}

async function generateMigrationReport(framework: Framework, analysis: ProjectAnalysis): Promise<void> {
  const report = generateReportContent(framework, analysis);
  await fs.writeFile('MIGRATION_REPORT.md', report);
}

function generateReportContent(framework: Framework, analysis: ProjectAnalysis): string {
  let report = `# Migration Report: ${MIGRATION_GUIDES[framework].name} → PhilJS

Generated: ${new Date().toISOString()}

## Project Analysis

- **Framework**: ${MIGRATION_GUIDES[framework].name}
- **Components**: ${analysis.components.length}
- **Custom Hooks**: ${analysis.hooks.length}
- **Routes**: ${analysis.routes.length}
- **State Management**: ${analysis.stateManagement || 'None detected'}
- **CSS Framework**: ${analysis.cssFramework || 'None detected'}

## Migration Strategy

`;

  // Add framework-specific migration guide
  report += getFrameworkMigrationGuide(framework);

  // Component conversion examples
  if (analysis.components.length > 0) {
    report += `\n## Component Conversion Examples\n\n`;
    report += getComponentConversionExamples(framework, analysis);
  }

  // State management migration
  if (analysis.stateManagement) {
    report += `\n## State Management Migration\n\n`;
    report += getStateManagementGuide(analysis.stateManagement);
  }

  // Routing migration
  if (analysis.routes.length > 0) {
    report += `\n## Routing Migration\n\n`;
    report += getRoutingMigrationGuide(framework);
  }

  // Next steps
  report += `\n## Next Steps

1. **Install PhilJS**:
   \`\`\`bash
   npm install philjs-core philjs-router
   \`\`\`

2. **Update Configuration**:
   - Replace build tool config with Vite
   - Update \`tsconfig.json\` for PhilJS JSX

3. **Convert Components**:
   - Start with leaf components (no children)
   - Replace hooks with PhilJS signals
   - Update JSX syntax where needed

4. **Migrate State Management**:
   - Replace Redux/Zustand with PhilJS signals
   - Use computed() for derived state
   - Use effect() for side effects

5. **Update Routes**:
   - Replace React Router with PhilJS Router
   - Convert route components
   - Update navigation

6. **Test Incrementally**:
   - Migrate one feature at a time
   - Test after each migration
   - Use both frameworks during transition if needed

## Resources

- [PhilJS Documentation](https://philjs.dev)
- [Migration Guide](https://philjs.dev/docs/migration/from-${framework})
- [API Reference](https://philjs.dev/docs/api)
- [Examples](https://philjs.dev/examples)

## Support

Need help with migration? Join our community:
- Discord: https://discord.gg/philjs
- GitHub: https://github.com/yourusername/philjs
`;

  return report;
}

function getFrameworkMigrationGuide(framework: Framework): string {
  switch (framework) {
    case 'react':
      return `### React → PhilJS Migration

PhilJS is designed to be familiar to React developers while offering better performance through fine-grained reactivity.

**Key Differences:**

| React | PhilJS |
|-------|--------|
| \`useState\` | \`signal()\` |
| \`useEffect\` | \`effect()\` |
| \`useMemo\` | \`computed()\` |
| \`useCallback\` | Not needed (signals are stable) |
| \`useRef\` | \`signal()\` |
| Context API | Signals (global) |
| Virtual DOM | Fine-grained updates |

**Migration Pattern:**

\`\`\`tsx
// React
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Count:', count);
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}

// PhilJS
import { signal, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);

  effect(() => {
    console.log('Count:', count());
  });

  return (
    <button onClick={() => count.set(c => c + 1)}>
      {count()}
    </button>
  );
}
\`\`\`
`;

    case 'vue':
      return `### Vue → PhilJS Migration

PhilJS signals work similarly to Vue's reactivity system, making migration straightforward.

**Key Differences:**

| Vue 3 | PhilJS |
|-------|--------|
| \`ref()\` | \`signal()\` |
| \`computed()\` | \`computed()\` |
| \`watch()\` | \`effect()\` |
| \`reactive()\` | Object with signals |
| SFC Template | JSX |

**Migration Pattern:**

\`\`\`vue
<!-- Vue -->
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <button @click="count++">
    {{ count }} (doubled: {{ doubled }})
  </button>
</template>
\`\`\`

\`\`\`tsx
// PhilJS
import { signal, computed } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);

  return (
    <button onClick={() => count.set(c => c + 1)}>
      {count()} (doubled: {doubled()})
    </button>
  );
}
\`\`\`
`;

    case 'svelte':
      return `### Svelte → PhilJS Migration

PhilJS and Svelte share similar philosophies around reactivity and compilation.

**Key Differences:**

| Svelte | PhilJS |
|--------|--------|
| \`let count = 0\` | \`signal(0)\` |
| \`$: doubled = count * 2\` | \`computed(() => count() * 2)\` |
| \`$: { ... }\` | \`effect(() => { ... })\` |
| Svelte syntax | JSX |

**Migration Pattern:**

\`\`\`svelte
<!-- Svelte -->
<script>
  let count = 0;
  $: doubled = count * 2;

  $: {
    console.log('Count:', count);
  }
</script>

<button on:click={() => count++}>
  {count} (doubled: {doubled})
</button>
\`\`\`

\`\`\`tsx
// PhilJS
import { signal, computed, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);

  effect(() => {
    console.log('Count:', count());
  });

  return (
    <button onClick={() => count.set(c => c + 1)}>
      {count()} (doubled: {doubled()})
    </button>
  );
}
\`\`\`
`;

    default:
      return '';
  }
}

function getComponentConversionExamples(framework: Framework, analysis: ProjectAnalysis): string {
  const stateful = analysis.components.filter(c => c.hasState);
  const withEffects = analysis.components.filter(c => c.hasEffects);

  let examples = `Found ${stateful.length} component(s) with state and ${withEffects.length} with side effects.\n\n`;

  examples += `### Conversion Checklist\n\n`;
  for (const component of analysis.components.slice(0, 5)) {
    examples += `- [ ] ${component.name}${component.hasState ? ' (has state)' : ''}${component.hasEffects ? ' (has effects)' : ''}\n`;
  }

  if (analysis.components.length > 5) {
    examples += `- ... and ${analysis.components.length - 5} more\n`;
  }

  return examples;
}

function getStateManagementGuide(stateManager: string): string {
  return `Your project uses **${stateManager}** for state management.

### Migrating to PhilJS Signals

PhilJS signals provide built-in state management without external libraries:

\`\`\`typescript
// Before (Redux/Zustand/etc.)
const store = createStore({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
});

// After (PhilJS)
import { signal } from 'philjs-core';

const count = signal(0);
export const increment = () => count.set(c => c + 1);
\`\`\`

**Benefits:**
- No boilerplate
- Fine-grained updates
- Built-in computed values
- Automatic dependency tracking
`;
}

function getRoutingMigrationGuide(framework: Framework): string {
  return `### PhilJS Router

PhilJS Router provides file-based and programmatic routing:

\`\`\`typescript
import { createRouter } from 'philjs-router';

const router = createRouter({
  routes: [
    { path: '/', component: () => import('./routes/Home') },
    { path: '/about', component: () => import('./routes/About') },
    { path: '/user/:id', component: () => import('./routes/User') },
  ],
});
\`\`\`

**Features:**
- Automatic code splitting
- Smart prefetching
- View transitions
- Type-safe navigation
`;
}
