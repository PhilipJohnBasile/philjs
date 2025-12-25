(()=>{var e={};e.id=4469,e.ids=[4469],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},6363:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>h,pages:()=>d,routeModule:()=>u,tree:()=>c}),s(5283),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),n=s(9761),o=s.n(n),l=s(4798),a={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(a[e]=()=>l[e]);s.d(t,a);let c=["",{children:["docs",{children:["getting-started",{children:["ide-setup",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,5283)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\ide-setup\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\ide-setup\\page.tsx"],h="/docs/getting-started/ide-setup/page",p={require:s,loadChunk:()=>Promise.resolve()},u=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/getting-started/ide-setup/page",pathname:"/docs/getting-started/ide-setup",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},4357:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>c});var r=s(6741),i=s(8972),n=s(47),o=s(7678),l=s(3178),a=s(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,n.usePathname)(),[s,c]=(0,a.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{c(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let n=s.has(e.title),a=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(l.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",n&&"rotate-90")})]}),(n||a)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},5283:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a,metadata:()=>l});var r=s(9015),i=s(3288),n=s(7309),o=s(8951);let l={title:"IDE Setup",description:"Configure VS Code, WebStorm, Neovim, and other editors for PhilJS development."};function a(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"IDE Setup"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Configure your editor for the best PhilJS development experience with syntax highlighting, IntelliSense, and debugging."}),r.jsx("h2",{id:"vscode",children:"Visual Studio Code"}),r.jsx("p",{children:"VS Code is the recommended editor for PhilJS development. Install the official extension for the best experience."}),r.jsx("h3",{children:"Install the PhilJS Extension"}),r.jsx(i.oI,{commands:["code --install-extension philjs.philjs-vscode"]}),r.jsx("p",{children:'Or search for "PhilJS" in the VS Code Extensions marketplace.'}),r.jsx("h3",{children:"Features"}),(0,r.jsxs)("ul",{children:[r.jsx("li",{children:"JSX/TSX syntax highlighting optimized for PhilJS"}),r.jsx("li",{children:"IntelliSense for signal APIs"}),r.jsx("li",{children:"Snippets for common patterns"}),r.jsx("li",{children:"Go to definition for components"}),r.jsx("li",{children:"Error diagnostics from the PhilJS compiler"}),r.jsx("li",{children:"Integrated debugging"})]}),r.jsx("h3",{children:"Recommended Settings"}),(0,r.jsxs)("p",{children:["Add these to your ",r.jsx("code",{children:".vscode/settings.json"}),":"]}),r.jsx(i.dn,{code:`{
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
}`,language:"json",filename:".vscode/settings.json"}),r.jsx("h3",{children:"Recommended Extensions"}),r.jsx(i.dn,{code:`{
  "recommendations": [
    "philjs.philjs-vscode",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}`,language:"json",filename:".vscode/extensions.json"}),r.jsx("h3",{children:"Debug Configuration"}),r.jsx(i.dn,{code:`{
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
}`,language:"json",filename:".vscode/launch.json"}),r.jsx("h2",{id:"webstorm",children:"WebStorm / IntelliJ IDEA"}),r.jsx("p",{children:"JetBrains IDEs have excellent TypeScript support out of the box."}),r.jsx("h3",{children:"Install the Plugin"}),(0,r.jsxs)("ol",{children:[r.jsx("li",{children:"Open Settings/Preferences"}),r.jsx("li",{children:"Go to Plugins > Marketplace"}),r.jsx("li",{children:'Search for "PhilJS"'}),r.jsx("li",{children:"Install and restart"})]}),r.jsx("h3",{children:"Configure TypeScript"}),(0,r.jsxs)("ol",{children:[r.jsx("li",{children:"Open Settings/Preferences"}),r.jsx("li",{children:"Go to Languages & Frameworks > TypeScript"}),r.jsx("li",{children:"Set TypeScript to use the project's version"}),r.jsx("li",{children:'Enable "Use TypeScript Service" for code completion'})]}),r.jsx("h2",{id:"neovim",children:"Neovim"}),r.jsx("p",{children:"For Neovim users, we recommend using nvim-lspconfig with TypeScript LSP."}),r.jsx("h3",{children:"Required Plugins"}),r.jsx(i.dn,{code:`-- Using lazy.nvim
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
}`,language:"lua",filename:"lua/plugins/lsp.lua"}),r.jsx("h2",{id:"rust-setup",children:"Rust IDE Setup"}),r.jsx("p",{children:"For Rust development with PhilJS, additional setup is needed."}),r.jsx("h3",{children:"VS Code with rust-analyzer"}),r.jsx(i.oI,{commands:["code --install-extension rust-lang.rust-analyzer"]}),(0,r.jsxs)("p",{children:["Add to your ",r.jsx("code",{children:".vscode/settings.json"}),":"]}),r.jsx(i.dn,{code:`{
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
}`,language:"json",filename:".vscode/settings.json"}),r.jsx("h3",{children:"RustRover / CLion"}),(0,r.jsxs)("p",{children:["JetBrains Rust IDEs work out of the box. Enable the proc-macro support in settings for the ",r.jsx("code",{children:"view!"})," macro."]}),r.jsx("h2",{id:"snippets",children:"Code Snippets"}),r.jsx("p",{children:"The PhilJS extension includes these snippets:"}),(0,r.jsxs)("table",{children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"Prefix"}),r.jsx("th",{children:"Description"})]})}),(0,r.jsxs)("tbody",{children:[(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"pfc"})}),r.jsx("td",{children:"PhilJS Function Component"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"psig"})}),r.jsx("td",{children:"Create a signal"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"pmemo"})}),r.jsx("td",{children:"Create a memo"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"peff"})}),r.jsx("td",{children:"Create an effect"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"pres"})}),r.jsx("td",{children:"Create a resource"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"pctx"})}),r.jsx("td",{children:"Create a context"})]})]})]}),r.jsx("h3",{children:"Custom Snippets"}),(0,r.jsxs)("p",{children:["Add custom snippets to ",r.jsx("code",{children:".vscode/philjs.code-snippets"}),":"]}),r.jsx(i.dn,{code:`{
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
}`,language:"json",filename:".vscode/philjs.code-snippets"}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),r.jsx(n.U,{type:"success",title:"You're all set!",children:"Your development environment is now configured for PhilJS. Start building!"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(o.default,{href:"/docs/core-concepts/signals",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Learn Signals"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Understand the core reactivity model"})]}),(0,r.jsxs)(o.default,{href:"/playground",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Try the Playground"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Experiment with PhilJS in the browser"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l});var r=s(9015),i=s(1471);let n=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function l({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(o,{sections:n}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>n});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let n=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(6363));module.exports=r})();