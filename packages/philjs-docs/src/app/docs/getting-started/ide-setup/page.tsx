import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'IDE Setup',
  description: 'Configure VS Code, WebStorm, Neovim, and other editors for PhilJS development.',
};

export default function IdeSetupPage() {
  return (
    <div className="mdx-content">
      <h1>IDE Setup</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Configure your editor for the best PhilJS development experience with syntax highlighting, IntelliSense, and debugging.
      </p>

      <h2 id="vscode">Visual Studio Code</h2>

      <p>
        VS Code is the recommended editor for PhilJS development. Install the official extension for the best experience.
      </p>

      <h3>Install the PhilJS Extension</h3>

      <Terminal commands={['code --install-extension philjs.philjs-vscode']} />

      <p>Or search for "PhilJS" in the VS Code Extensions marketplace.</p>

      <h3>Features</h3>

      <ul>
        <li>JSX/TSX syntax highlighting optimized for PhilJS</li>
        <li>IntelliSense for signal APIs</li>
        <li>Snippets for common patterns</li>
        <li>Go to definition for components</li>
        <li>Error diagnostics from the PhilJS compiler</li>
        <li>Integrated debugging</li>
      </ul>

      <h3>Recommended Settings</h3>

      <p>Add these to your <code>.vscode/settings.json</code>:</p>

      <CodeBlock
        code={`{
  // Enable TypeScript in JSX files
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // Format on save
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // File associations
  "files.associations": {
    "*.tsx": "typescriptreact"
  },

  // Emmet for JSX
  "emmet.includeLanguages": {
    "typescriptreact": "html"
  },

  // PhilJS specific
  "philjs.enableSignalTracking": true,
  "philjs.showInlineHints": true
}`}
        language="json"
        filename=".vscode/settings.json"
      />

      <h3>Recommended Extensions</h3>

      <CodeBlock
        code={`{
  "recommendations": [
    "philjs.philjs-vscode",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}`}
        language="json"
        filename=".vscode/extensions.json"
      />

      <h3>Debug Configuration</h3>

      <CodeBlock
        code={`{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "PhilJS: Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "\${workspaceFolder}/src",
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///src/*": "\${webRoot}/*"
      }
    },
    {
      "name": "PhilJS: Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}`}
        language="json"
        filename=".vscode/launch.json"
      />

      <h2 id="webstorm">WebStorm / IntelliJ IDEA</h2>

      <p>
        JetBrains IDEs have excellent TypeScript support out of the box.
      </p>

      <h3>Install the Plugin</h3>

      <ol>
        <li>Open Settings/Preferences</li>
        <li>Go to Plugins &gt; Marketplace</li>
        <li>Search for "PhilJS"</li>
        <li>Install and restart</li>
      </ol>

      <h3>Configure TypeScript</h3>

      <ol>
        <li>Open Settings/Preferences</li>
        <li>Go to Languages &amp; Frameworks &gt; TypeScript</li>
        <li>Set TypeScript to use the project's version</li>
        <li>Enable "Use TypeScript Service" for code completion</li>
      </ol>

      <h2 id="neovim">Neovim</h2>

      <p>
        For Neovim users, we recommend using nvim-lspconfig with TypeScript LSP.
      </p>

      <h3>Required Plugins</h3>

      <CodeBlock
        code={`-- Using lazy.nvim
return {
  -- LSP
  {
    "neovim/nvim-lspconfig",
    dependencies = {
      "williamboman/mason.nvim",
      "williamboman/mason-lspconfig.nvim",
    },
    config = function()
      require("lspconfig").tsserver.setup({
        -- PhilJS JSX settings
        init_options = {
          preferences = {
            jsxAttributeCompletionStyle = "auto",
          },
        },
        settings = {
          typescript = {
            inlayHints = {
              includeInlayParameterNameHints = "all",
              includeInlayFunctionParameterTypeHints = true,
            },
          },
        },
      })
    end,
  },

  -- Treesitter for syntax highlighting
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter.configs").setup({
        ensure_installed = { "tsx", "typescript", "javascript", "html", "css" },
        highlight = { enable = true },
      })
    end,
  },

  -- Auto pairs for JSX
  {
    "windwp/nvim-ts-autotag",
    config = function()
      require("nvim-ts-autotag").setup()
    end,
  },
}`}
        language="lua"
        filename="lua/plugins/lsp.lua"
      />

      <h2 id="rust-setup">Rust IDE Setup</h2>

      <p>
        For Rust development with PhilJS, additional setup is needed.
      </p>

      <h3>VS Code with rust-analyzer</h3>

      <Terminal commands={['code --install-extension rust-lang.rust-analyzer']} />

      <p>Add to your <code>.vscode/settings.json</code>:</p>

      <CodeBlock
        code={`{
  "rust-analyzer.procMacro.enable": true,
  "rust-analyzer.cargo.features": "all",
  "rust-analyzer.diagnostics.disabled": [
    "unresolved-proc-macro"
  ],
  "rust-analyzer.checkOnSave.command": "clippy",
  "[rust]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  }
}`}
        language="json"
        filename=".vscode/settings.json"
      />

      <h3>RustRover / CLion</h3>

      <p>
        JetBrains Rust IDEs work out of the box. Enable the proc-macro support in settings for the <code>view!</code> macro.
      </p>

      <h2 id="snippets">Code Snippets</h2>

      <p>
        The PhilJS extension includes these snippets:
      </p>

      <table>
        <thead>
          <tr>
            <th>Prefix</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>pfc</code></td>
            <td>PhilJS Function Component</td>
          </tr>
          <tr>
            <td><code>psig</code></td>
            <td>Create a signal</td>
          </tr>
          <tr>
            <td><code>pmemo</code></td>
            <td>Create a memo</td>
          </tr>
          <tr>
            <td><code>peff</code></td>
            <td>Create an effect</td>
          </tr>
          <tr>
            <td><code>pres</code></td>
            <td>Create a resource</td>
          </tr>
          <tr>
            <td><code>pctx</code></td>
            <td>Create a context</td>
          </tr>
        </tbody>
      </table>

      <h3>Custom Snippets</h3>

      <p>Add custom snippets to <code>.vscode/philjs.code-snippets</code>:</p>

      <CodeBlock
        code={`{
  "PhilJS Component": {
    "prefix": "pfc",
    "body": [
      "import { signal } from 'philjs-core';",
      "",
      "interface \${1:$TM_FILENAME_BASE}Props {",
      "  $2",
      "}",
      "",
      "export function \${1:$TM_FILENAME_BASE}({ $3 }: \${1:$TM_FILENAME_BASE}Props) {",
      "  $0",
      "  return (",
      "    <div>",
      "      ",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "Create a PhilJS component"
  },
  "Signal": {
    "prefix": "psig",
    "body": ["const $1 = signal<$2>($3);"],
    "description": "Create a signal"
  },
  "Effect": {
    "prefix": "peff",
    "body": [
      "effect(() => {",
      "  $1",
      "  return () => {",
      "    $2",
      "  };",
      "});"
    ],
    "description": "Create an effect with cleanup"
  }
}`}
        language="json"
        filename=".vscode/philjs.code-snippets"
      />

      <h2 id="next-steps">Next Steps</h2>

      <Callout type="success" title="You're all set!">
        Your development environment is now configured for PhilJS. Start building!
      </Callout>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/signals"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Learn Signals</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Understand the core reactivity model
          </p>
        </Link>

        <Link
          href="/playground"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Try the Playground</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Experiment with PhilJS in the browser
          </p>
        </Link>
      </div>
    </div>
  );
}
