(()=>{var e={};e.id=8681,e.ids=[8681],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},8044:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>h,originalPathname:()=>u,pages:()=>d,routeModule:()=>p,tree:()=>c}),s(3626),s(2108),s(4001),s(1305);var r=s(3545),i=s(5947),o=s(9761),a=s.n(o),n=s(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(t,l);let c=["",{children:["docs",{children:["guides",{children:["styling",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,3626)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\styling\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\styling\\page.tsx"],u="/docs/guides/styling/page",h={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/guides/styling/page",pathname:"/docs/guides/styling",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>c});var r=s(6741),i=s(8972),o=s(47),a=s(7678),n=s(3178),l=s(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[s,c]=(0,l.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{c(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),l=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||l)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return r.jsx("li",{children:r.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>i.a});var r=s(7654),i=s.n(r)},7654:(e,t,s)=>{"use strict";let{createProxy:r}=s(1471);e.exports=r("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},3626:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,metadata:()=>n});var r=s(9015),i=s(3288),o=s(7309),a=s(8951);let n={title:"Styling Guide",description:"Style PhilJS applications with CSS, Tailwind, CSS-in-JS, and scoped styles."};function l(){return(0,r.jsxs)("div",{className:"mdx-content",children:[r.jsx("h1",{children:"Styling Guide"}),r.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"PhilJS supports multiple styling approaches including plain CSS, CSS Modules, Tailwind CSS, and CSS-in-JS solutions."}),r.jsx("h2",{id:"css-modules",children:"CSS Modules"}),r.jsx("p",{children:"CSS Modules provide scoped styles out of the box with Vite. Import your CSS file and use the exported class names:"}),r.jsx(i.dn,{code:`/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.primary {
  background: var(--color-primary);
  color: white;
}

.primary:hover {
  background: var(--color-primary-dark);
}

.secondary {
  background: var(--color-surface-100);
  color: var(--color-surface-900);
  border: 1px solid var(--color-surface-300);
}

.secondary:hover {
  background: var(--color-surface-200);
}`,language:"css",filename:"Button.module.css"}),r.jsx(i.dn,{code:`import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  variant?: ButtonVariant;
  children: any;
  onClick?: () => void;
}

function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button
      class={\`\${styles.button} \${styles[variant]}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Usage
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>`,language:"tsx",filename:"Button.tsx"}),r.jsx("h2",{id:"tailwind",children:"Tailwind CSS"}),r.jsx("p",{children:"PhilJS works seamlessly with Tailwind CSS. Install and configure Tailwind, then use utility classes directly in your components:"}),r.jsx(i.dn,{code:`npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p`,language:"bash",filename:"Terminal"}),r.jsx(i.dn,{code:`// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};`,language:"javascript",filename:"tailwind.config.js"}),r.jsx(i.dn,{code:`function Card({ title, description, image }: CardProps) {
  return (
    <div class="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <img
        src={image}
        alt=""
        class="w-full h-48 object-cover"
      />
      <div class="p-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <p class="mt-2 text-gray-600 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}`,language:"tsx",filename:"Card.tsx"}),r.jsx("h3",{id:"conditional-classes",children:"Conditional Classes"}),(0,r.jsxs)("p",{children:["Use the ",r.jsx("code",{children:"clsx"})," or ",r.jsx("code",{children:"classnames"})," library for conditional class names:"]}),r.jsx(i.dn,{code:`import { clsx } from 'clsx';

function Button({ variant, size, disabled, children }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      class={clsx(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',

        // Variant styles
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500':
            variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500':
            variant === 'secondary',
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50':
            variant === 'outline',
        },

        // Size styles
        {
          'px-2.5 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },

        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}`,language:"tsx",filename:"Button.tsx"}),r.jsx("h2",{id:"css-in-js",children:"CSS-in-JS"}),(0,r.jsxs)("p",{children:["PhilJS provides a built-in ",r.jsx("code",{children:"css"})," utility for scoped, reactive styles:"]}),r.jsx(i.dn,{code:`import { css, createSignal } from 'philjs-core';

function ThemeBox() {
  const [hue, setHue] = createSignal(200);

  // Reactive styles that update when hue changes
  const boxStyles = css\`
    padding: 2rem;
    border-radius: 0.5rem;
    background: hsl(\${hue}, 70%, 50%);
    color: white;
    transition: background 300ms ease;

    &:hover {
      background: hsl(\${hue}, 70%, 40%);
    }
  \`;

  return (
    <div>
      <div class={boxStyles()}>
        Hue: {hue()}
      </div>
      <input
        type="range"
        min="0"
        max="360"
        value={hue()}
        onInput={(e) => setHue(+e.target.value)}
      />
    </div>
  );
}`,language:"tsx",filename:"ThemeBox.tsx"}),r.jsx("h3",{id:"styled-components",children:"Styled Components Pattern"}),r.jsx(i.dn,{code:`import { styled } from 'philjs-core';

// Create styled components with typed props
const Button = styled('button')<{ variant?: 'primary' | 'ghost' }>\`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 150ms ease;

  \${(props) => props.variant === 'primary' ? \`
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  \` : \`
    background: transparent;
    color: #3b82f6;

    &:hover {
      background: #eff6ff;
    }
  \`}
\`;

const Card = styled('div')\`
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
\`;

// Usage
function App() {
  return (
    <Card>
      <h2>Welcome</h2>
      <Button variant="primary">Get Started</Button>
      <Button variant="ghost">Learn More</Button>
    </Card>
  );
}`,language:"tsx",filename:"StyledComponents.tsx"}),r.jsx("h2",{id:"global-styles",children:"Global Styles & Theming"}),r.jsx("p",{children:"Define CSS custom properties for theming and use them throughout your app:"}),r.jsx(i.dn,{code:`/* styles/theme.css */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-surface-50: #f9fafb;
  --color-surface-100: #f3f4f6;
  --color-surface-200: #e5e7eb;
  --color-surface-300: #d1d5db;
  --color-surface-600: #4b5563;
  --color-surface-900: #111827;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: 'Fira Code', monospace;

  /* Borders */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme="dark"] {
  --color-surface-50: #111827;
  --color-surface-100: #1f2937;
  --color-surface-200: #374151;
  --color-surface-300: #4b5563;
  --color-surface-600: #d1d5db;
  --color-surface-900: #f9fafb;
}`,language:"css",filename:"styles/theme.css"}),r.jsx("h3",{id:"theme-context",children:"Theme Context"}),r.jsx(i.dn,{code:`import { createContext, createSignal, useContext } from 'philjs-core';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: () => Theme;
  setTheme: (t: Theme) => void;
}>();

export function ThemeProvider(props: { children: any }) {
  const [theme, setTheme] = createSignal<Theme>('system');

  // Apply theme to document
  createEffect(() => {
    const t = theme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = t === 'system' ? (prefersDark ? 'dark' : 'light') : t;

    document.documentElement.setAttribute('data-theme', resolved);
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Theme toggle component
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const current = themes.indexOf(theme());
    setTheme(themes[(current + 1) % themes.length]);
  };

  return (
    <button onClick={cycle} aria-label="Toggle theme">
      <Show when={theme() === 'light'}>
        <SunIcon />
      </Show>
      <Show when={theme() === 'dark'}>
        <MoonIcon />
      </Show>
      <Show when={theme() === 'system'}>
        <ComputerIcon />
      </Show>
    </button>
  );
}`,language:"tsx",filename:"ThemeProvider.tsx"}),r.jsx("h2",{id:"animations",children:"Animations"}),r.jsx("p",{children:"Create smooth animations with CSS transitions and PhilJS's reactive system:"}),r.jsx(i.dn,{code:`import { createSignal, Show, Transition } from 'philjs-core';

function Modal({ open, onClose, children }: ModalProps) {
  return (
    <Transition
      show={open}
      enter="transition-opacity duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div class="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Content */}
        <Transition
          show={open}
          enter="transition-all duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition-all duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div class="relative mx-auto mt-20 max-w-lg bg-white rounded-lg shadow-xl p-6">
            {children}
          </div>
        </Transition>
      </div>
    </Transition>
  );
}

// Usage
function App() {
  const [showModal, setShowModal] = createSignal(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Open Modal
      </button>

      <Modal open={showModal()} onClose={() => setShowModal(false)}>
        <h2>Modal Title</h2>
        <p>Modal content here...</p>
      </Modal>
    </>
  );
}`,language:"tsx",filename:"Modal.tsx"}),r.jsx("h2",{id:"responsive",children:"Responsive Design"}),r.jsx("p",{children:"Use CSS media queries or Tailwind's responsive prefixes for adaptive layouts:"}),r.jsx(i.dn,{code:`function ResponsiveGrid({ items }: { items: Item[] }) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      <For each={items}>
        {(item) => (
          <div class="p-4 bg-white rounded-lg shadow">
            <img
              src={item.image}
              alt={item.title}
              class="w-full aspect-video object-cover rounded"
            />
            <h3 class="mt-2 font-semibold text-lg">{item.title}</h3>
            <p class="text-gray-600 text-sm line-clamp-2">
              {item.description}
            </p>
          </div>
        )}
      </For>
    </div>
  );
}`,language:"tsx",filename:"ResponsiveGrid.tsx"}),(0,r.jsxs)(o.U,{type:"info",title:"Mobile-First",children:["Design mobile-first by starting with base styles and adding responsive overrides for larger screens using ",r.jsx("code",{children:"sm:"}),", ",r.jsx("code",{children:"md:"}),",",r.jsx("code",{children:"lg:"}),", etc."]}),r.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,r.jsxs)(a.default,{href:"/docs/api/philjs-ui",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"UI Components"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Pre-built, accessible components with customizable styling"})]}),(0,r.jsxs)(a.default,{href:"/docs/guides/deployment",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[r.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Deployment"}),r.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy your styled app to production"})]})]})]})}},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n});var r=s(9015),i=s(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(a,{sections:o}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>i,oI:()=>o});var r=s(1471);let i=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>s(8044));module.exports=r})();