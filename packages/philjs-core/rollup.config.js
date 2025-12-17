import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

// Helper to create entry point config
const createEntry = (input, output, external = []) => ({
  input: `src/${input}`,
  output: {
    file: `dist/${output}`,
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: true,
      declarationDir: 'dist'
    })
  ],
  external: [
    /^node:/,
    /^philjs-/,
    ...external
  ]
});

export default [
  // Main entry point (full bundle for convenience)
  createEntry('index.ts', 'index.js'),

  // Core signals (minimal, tree-shakeable)
  createEntry('signals.ts', 'signals.js'),

  // JSX runtime
  createEntry('jsx-runtime.ts', 'jsx-runtime.js', ['./signals.js']),
  createEntry('jsx-dev-runtime.ts', 'jsx-dev-runtime.js', ['./jsx-runtime.js']),

  // Optional features (tree-shakeable)
  createEntry('forms.ts', 'forms.js', ['./signals.js']),
  createEntry('i18n.ts', 'i18n.js', ['./signals.js']),
  createEntry('animation.ts', 'animation.js', ['./signals.js']),
  createEntry('accessibility.ts', 'accessibility.js', ['./signals.js']),
  createEntry('ab-testing.ts', 'ab-testing.js', ['./signals.js']),
  createEntry('context.ts', 'context.js', ['./signals.js']),
  createEntry('error-boundary.ts', 'error-boundary.js', ['./signals.js']),
  createEntry('render-to-string.ts', 'render-to-string.js', ['./signals.js', './jsx-runtime.js']),
  createEntry('hydrate.ts', 'hydrate.js', ['./signals.js']),
  createEntry('result.ts', 'result.js'),
];
