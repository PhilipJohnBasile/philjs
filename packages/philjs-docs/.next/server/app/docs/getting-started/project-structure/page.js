"use strict";(()=>{var e={};e.id=8307,e.ids=[8307],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},8800:(e,t,s)=>{s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>d}),s(2720),s(2108),s(4001),s(1305);var r=s(3545),o=s(5947),i=s(9761),n=s.n(i),a=s(4798),l={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>a[e]);s.d(t,l);let d=["",{children:["docs",{children:["getting-started",{children:["project-structure",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2720)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\project-structure\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\getting-started\\project-structure\\page.tsx"],p="/docs/getting-started/project-structure/page",u={require:s,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/docs/getting-started/project-structure/page",pathname:"/docs/getting-started/project-structure",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},2720:(e,t,s)=>{s.r(t),s.d(t,{default:()=>a,metadata:()=>n});var r=s(9015),o=s(3288),i=s(8951);let n={title:"Project Structure",description:"Understanding the PhilJS project layout, file conventions, and configuration options."};function a(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Project Structure"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS projects follow a conventional file structure that enables file-based routing, code organization, and optimal bundling."}),r.jsx("h2",{id:"standard-structure",children:"Standard Project Structure"}),r.jsx(o.dn,{code:`my-philjs-app/
├── src/
│   ├── app/                    # Application routes (file-based routing)
│   │   ├── layout.tsx          # Root layout (wraps all pages)
│   │   ├── page.tsx            # Home page (/)
│   │   ├── loading.tsx         # Loading UI
│   │   ├── error.tsx           # Error boundary
│   │   ├── about/
│   │   │   └── page.tsx        # About page (/about)
│   │   ├── blog/
│   │   │   ├── layout.tsx      # Blog layout
│   │   │   ├── page.tsx        # Blog index (/blog)
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Blog post (/blog/:slug)
│   │   └── api/
│   │       └── users/
│   │           └── route.ts    # API route (/api/users)
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── features/           # Feature-specific components
│   │       ├── auth/
│   │       └── blog/
│   ├── lib/                    # Shared utilities
│   │   ├── api.ts              # API client
│   │   ├── utils.ts            # Helper functions
│   │   └── constants.ts        # App constants
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useMediaQuery.ts
│   ├── stores/                 # Global state stores
│   │   ├── auth.ts
│   │   └── theme.ts
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── styles/                 # Global styles
│   │   ├── globals.css
│   │   └── variables.css
│   └── main.tsx                # Application entry point
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── images/
├── tests/                      # Test files
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts          # If using Tailwind
└── philjs.config.ts            # PhilJS configuration`,language:"plaintext",showLineNumbers:!1}),r.jsx("h2",{id:"app-directory",children:"The app/ Directory"}),(0,r.jsxs)("p",{children:["The ",r.jsx("code",{children:"app/"})," directory uses file-based routing. Each folder represents a route segment, and special files define the behavior of that route."]}),r.jsx("h3",{children:"Special Files"}),(0,r.jsxs)("table",{children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"File"}),r.jsx("th",{children:"Purpose"})]})}),(0,r.jsxs)("tbody",{children:[(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"page.tsx"})}),r.jsx("td",{children:"Defines the UI for a route (required for route to be accessible)"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"layout.tsx"})}),r.jsx("td",{children:"Shared layout that wraps child routes"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"loading.tsx"})}),r.jsx("td",{children:"Loading UI shown while page content loads"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"error.tsx"})}),r.jsx("td",{children:"Error boundary for the route segment"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"not-found.tsx"})}),r.jsx("td",{children:"UI shown when a route is not found"})]}),(0,r.jsxs)("tr",{children:[r.jsx("td",{children:r.jsx("code",{children:"route.ts"})}),r.jsx("td",{children:"API endpoint (server-only)"})]})]})]}),r.jsx("h3",{children:"Dynamic Routes"}),r.jsx(o.dn,{code:`app/
├── blog/
│   ├── page.tsx                # /blog
│   └── [slug]/
│       └── page.tsx            # /blog/:slug (dynamic)
├── users/
│   └── [...id]/
│       └── page.tsx            # /users/* (catch-all)
└── shop/
    └── [[...categories]]/
        └── page.tsx            # /shop or /shop/* (optional catch-all)`,language:"plaintext",showLineNumbers:!1}),r.jsx("h3",{children:"Route Groups"}),r.jsx("p",{children:"Use parentheses to create route groups that don't affect the URL:"}),r.jsx(o.dn,{code:`app/
├── (marketing)/                # Group for marketing pages
│   ├── about/
│   │   └── page.tsx           # /about
│   └── contact/
│       └── page.tsx           # /contact
├── (shop)/                     # Group for shop pages
│   ├── layout.tsx             # Shared shop layout
│   ├── products/
│   │   └── page.tsx           # /products
│   └── cart/
│       └── page.tsx           # /cart
└── (auth)/                     # Group for auth pages
    ├── layout.tsx             # Auth-specific layout
    ├── login/
    │   └── page.tsx           # /login
    └── register/
        └── page.tsx           # /register`,language:"plaintext",showLineNumbers:!1}),r.jsx("h2",{id:"components-directory",children:"The components/ Directory"}),r.jsx("p",{children:"Organize your components by type and feature:"}),r.jsx(o.dn,{code:`components/
├── ui/                        # Primitive/base components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Card/
│   └── index.ts               # Barrel export
├── layout/                    # Layout components
│   ├── Header/
│   ├── Footer/
│   └── Sidebar/
├── forms/                     # Form components
│   ├── LoginForm/
│   └── ContactForm/
└── features/                  # Feature-specific components
    ├── auth/
    │   ├── LoginButton.tsx
    │   └── UserMenu.tsx
    └── blog/
        ├── PostCard.tsx
        └── CommentSection.tsx`,language:"plaintext",showLineNumbers:!1}),r.jsx("h2",{id:"configuration",children:"Configuration Files"}),r.jsx("h3",{children:"philjs.config.ts"}),r.jsx(o.dn,{code:`import { defineConfig } from 'philjs';

export default defineConfig({
  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    // Enable/disable SSR
    ssr: true,
    // Islands mode for partial hydration
    islands: false,
  },

  // Server configuration
  server: {
    port: 3000,
    host: 'localhost',
  },

  // Router configuration
  router: {
    // Base path for all routes
    basePath: '',
    // Trailing slash behavior
    trailingSlash: false,
  },

  // Plugins
  plugins: [
    // Add plugins here
  ],
});`,language:"typescript",filename:"philjs.config.ts"}),r.jsx("h3",{children:"vite.config.ts"}),r.jsx(o.dn,{code:`import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    philjs({
      jsx: true,
      ssr: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },

  build: {
    target: 'esnext',
    minify: 'terser',
  },
});`,language:"typescript",filename:"vite.config.ts"}),r.jsx("h2",{id:"rust-structure",children:"Rust Project Structure"}),r.jsx("p",{children:"Rust projects follow a similar structure but with Cargo conventions:"}),r.jsx(o.dn,{code:`my-philjs-rust-app/
├── src/
│   ├── lib.rs                  # Library root
│   ├── app.rs                  # App component
│   ├── components/
│   │   ├── mod.rs
│   │   ├── header.rs
│   │   └── footer.rs
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── home.rs
│   │   └── about.rs
│   ├── server/                 # Server-only code
│   │   ├── mod.rs
│   │   ├── api.rs
│   │   └── db.rs
│   └── types/
│       └── mod.rs
├── public/
│   └── index.html
├── Cargo.toml
├── PhilJS.toml                 # PhilJS configuration
└── README.md`,language:"plaintext",showLineNumbers:!1}),r.jsx("h2",{id:"best-practices",children:"Best Practices"}),(0,r.jsxs)("ul",{children:[(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Colocation"}),": Keep related files together (component, styles, tests)"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Barrel exports"}),": Use ",r.jsx("code",{children:"index.ts"})," files for cleaner imports"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Feature folders"}),": Group code by feature rather than type for larger apps"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Type safety"}),": Define types in a central location for reuse"]}),(0,r.jsxs)("li",{children:[r.jsx("strong",{children:"Environment separation"}),": Use ",r.jsx("code",{children:".env"})," files for environment-specific config"]})]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(i.default,{href:"/docs/getting-started/ide-setup",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"IDE Setup"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Configure your editor for the best development experience"})]}),(0,r.jsxs)(i.default,{href:"/docs/guides/routing",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Routing Guide"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn file-based routing in depth"})]})]})]})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9332],()=>s(8800));module.exports=r})();