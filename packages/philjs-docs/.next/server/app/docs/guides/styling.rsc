2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","8681","static/chunks/app/docs/guides/styling/page-d055dda8e0dde762.js"],"CodeBlock"]
6:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","8681","static/chunks/app/docs/guides/styling/page-d055dda8e0dde762.js"],"Callout"]
7:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","8681","static/chunks/app/docs/guides/styling/page-d055dda8e0dde762.js"],""]
8:I[6419,[],""]
9:I[8445,[],""]
a:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
b:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
c:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
d:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
3:T418,import { clsx } from 'clsx';

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
}4:T5f1,import { createContext, createSignal, useContext } from 'philjs-core';

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
}5:T589,import { createSignal, Show, Transition } from 'philjs-core';

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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["guides",{"children":["styling",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["guides",{"children":["styling",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Styling Guide"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"PhilJS supports multiple styling approaches including plain CSS, CSS Modules, Tailwind CSS, and CSS-in-JS solutions."}],["$","h2",null,{"id":"css-modules","children":"CSS Modules"}],["$","p",null,{"children":"CSS Modules provide scoped styles out of the box with Vite. Import your CSS file and use the exported class names:"}],["$","$L2",null,{"code":"/* Button.module.css */\n.button {\n  padding: 0.5rem 1rem;\n  border-radius: 0.375rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 150ms ease;\n}\n\n.primary {\n  background: var(--color-primary);\n  color: white;\n}\n\n.primary:hover {\n  background: var(--color-primary-dark);\n}\n\n.secondary {\n  background: var(--color-surface-100);\n  color: var(--color-surface-900);\n  border: 1px solid var(--color-surface-300);\n}\n\n.secondary:hover {\n  background: var(--color-surface-200);\n}","language":"css","filename":"Button.module.css"}],["$","$L2",null,{"code":"import styles from './Button.module.css';\n\ntype ButtonVariant = 'primary' | 'secondary';\n\ninterface ButtonProps {\n  variant?: ButtonVariant;\n  children: any;\n  onClick?: () => void;\n}\n\nfunction Button({ variant = 'primary', children, onClick }: ButtonProps) {\n  return (\n    <button\n      class={`${styles.button} ${styles[variant]}`}\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n}\n\n// Usage\n<Button variant=\"primary\">Save</Button>\n<Button variant=\"secondary\">Cancel</Button>","language":"tsx","filename":"Button.tsx"}],["$","h2",null,{"id":"tailwind","children":"Tailwind CSS"}],["$","p",null,{"children":"PhilJS works seamlessly with Tailwind CSS. Install and configure Tailwind, then use utility classes directly in your components:"}],["$","$L2",null,{"code":"npm install -D tailwindcss postcss autoprefixer\nnpx tailwindcss init -p","language":"bash","filename":"Terminal"}],["$","$L2",null,{"code":"// tailwind.config.js\nexport default {\n  content: [\n    \"./index.html\",\n    \"./src/**/*.{js,ts,jsx,tsx}\",\n  ],\n  theme: {\n    extend: {\n      colors: {\n        primary: {\n          50: '#f0f9ff',\n          500: '#3b82f6',\n          600: '#2563eb',\n          700: '#1d4ed8',\n        },\n      },\n    },\n  },\n  plugins: [],\n};","language":"javascript","filename":"tailwind.config.js"}],["$","$L2",null,{"code":"function Card({ title, description, image }: CardProps) {\n  return (\n    <div class=\"rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow\">\n      <img\n        src={image}\n        alt=\"\"\n        class=\"w-full h-48 object-cover\"\n      />\n      <div class=\"p-4\">\n        <h3 class=\"text-lg font-semibold text-gray-900\">\n          {title}\n        </h3>\n        <p class=\"mt-2 text-gray-600 text-sm\">\n          {description}\n        </p>\n      </div>\n    </div>\n  );\n}","language":"tsx","filename":"Card.tsx"}],["$","h3",null,{"id":"conditional-classes","children":"Conditional Classes"}],["$","p",null,{"children":["Use the ",["$","code",null,{"children":"clsx"}]," or ",["$","code",null,{"children":"classnames"}]," library for conditional class names:"]}],["$","$L2",null,{"code":"$3","language":"tsx","filename":"Button.tsx"}],["$","h2",null,{"id":"css-in-js","children":"CSS-in-JS"}],["$","p",null,{"children":["PhilJS provides a built-in ",["$","code",null,{"children":"css"}]," utility for scoped, reactive styles:"]}],["$","$L2",null,{"code":"import { css, createSignal } from 'philjs-core';\n\nfunction ThemeBox() {\n  const [hue, setHue] = createSignal(200);\n\n  // Reactive styles that update when hue changes\n  const boxStyles = css`\n    padding: 2rem;\n    border-radius: 0.5rem;\n    background: hsl(${hue}, 70%, 50%);\n    color: white;\n    transition: background 300ms ease;\n\n    &:hover {\n      background: hsl(${hue}, 70%, 40%);\n    }\n  `;\n\n  return (\n    <div>\n      <div class={boxStyles()}>\n        Hue: {hue()}\n      </div>\n      <input\n        type=\"range\"\n        min=\"0\"\n        max=\"360\"\n        value={hue()}\n        onInput={(e) => setHue(+e.target.value)}\n      />\n    </div>\n  );\n}","language":"tsx","filename":"ThemeBox.tsx"}],["$","h3",null,{"id":"styled-components","children":"Styled Components Pattern"}],["$","$L2",null,{"code":"import { styled } from 'philjs-core';\n\n// Create styled components with typed props\nconst Button = styled('button')<{ variant?: 'primary' | 'ghost' }>`\n  padding: 0.5rem 1rem;\n  border-radius: 0.375rem;\n  font-weight: 500;\n  cursor: pointer;\n  border: none;\n  transition: all 150ms ease;\n\n  ${(props) => props.variant === 'primary' ? `\n    background: #3b82f6;\n    color: white;\n\n    &:hover {\n      background: #2563eb;\n    }\n  ` : `\n    background: transparent;\n    color: #3b82f6;\n\n    &:hover {\n      background: #eff6ff;\n    }\n  `}\n`;\n\nconst Card = styled('div')`\n  padding: 1.5rem;\n  border-radius: 0.5rem;\n  background: white;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n`;\n\n// Usage\nfunction App() {\n  return (\n    <Card>\n      <h2>Welcome</h2>\n      <Button variant=\"primary\">Get Started</Button>\n      <Button variant=\"ghost\">Learn More</Button>\n    </Card>\n  );\n}","language":"tsx","filename":"StyledComponents.tsx"}],["$","h2",null,{"id":"global-styles","children":"Global Styles & Theming"}],["$","p",null,{"children":"Define CSS custom properties for theming and use them throughout your app:"}],["$","$L2",null,{"code":"/* styles/theme.css */\n:root {\n  /* Colors */\n  --color-primary: #3b82f6;\n  --color-primary-dark: #2563eb;\n  --color-surface-50: #f9fafb;\n  --color-surface-100: #f3f4f6;\n  --color-surface-200: #e5e7eb;\n  --color-surface-300: #d1d5db;\n  --color-surface-600: #4b5563;\n  --color-surface-900: #111827;\n\n  /* Spacing */\n  --space-1: 0.25rem;\n  --space-2: 0.5rem;\n  --space-3: 0.75rem;\n  --space-4: 1rem;\n  --space-6: 1.5rem;\n  --space-8: 2rem;\n\n  /* Typography */\n  --font-sans: system-ui, -apple-system, sans-serif;\n  --font-mono: 'Fira Code', monospace;\n\n  /* Borders */\n  --radius-sm: 0.25rem;\n  --radius-md: 0.375rem;\n  --radius-lg: 0.5rem;\n  --radius-full: 9999px;\n\n  /* Shadows */\n  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);\n  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);\n}\n\n/* Dark mode */\n[data-theme=\"dark\"] {\n  --color-surface-50: #111827;\n  --color-surface-100: #1f2937;\n  --color-surface-200: #374151;\n  --color-surface-300: #4b5563;\n  --color-surface-600: #d1d5db;\n  --color-surface-900: #f9fafb;\n}","language":"css","filename":"styles/theme.css"}],["$","h3",null,{"id":"theme-context","children":"Theme Context"}],["$","$L2",null,{"code":"$4","language":"tsx","filename":"ThemeProvider.tsx"}],["$","h2",null,{"id":"animations","children":"Animations"}],["$","p",null,{"children":"Create smooth animations with CSS transitions and PhilJS's reactive system:"}],["$","$L2",null,{"code":"$5","language":"tsx","filename":"Modal.tsx"}],["$","h2",null,{"id":"responsive","children":"Responsive Design"}],["$","p",null,{"children":"Use CSS media queries or Tailwind's responsive prefixes for adaptive layouts:"}],["$","$L2",null,{"code":"function ResponsiveGrid({ items }: { items: Item[] }) {\n  return (\n    <div class=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4\">\n      <For each={items}>\n        {(item) => (\n          <div class=\"p-4 bg-white rounded-lg shadow\">\n            <img\n              src={item.image}\n              alt={item.title}\n              class=\"w-full aspect-video object-cover rounded\"\n            />\n            <h3 class=\"mt-2 font-semibold text-lg\">{item.title}</h3>\n            <p class=\"text-gray-600 text-sm line-clamp-2\">\n              {item.description}\n            </p>\n          </div>\n        )}\n      </For>\n    </div>\n  );\n}","language":"tsx","filename":"ResponsiveGrid.tsx"}],["$","$L6",null,{"type":"info","title":"Mobile-First","children":["Design mobile-first by starting with base styles and adding responsive overrides for larger screens using ",["$","code",null,{"children":"sm:"}],", ",["$","code",null,{"children":"md:"}],",",["$","code",null,{"children":"lg:"}],", etc."]}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L7",null,{"href":"/docs/api/philjs-ui","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"UI Components"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Pre-built, accessible components with customizable styling"}]]}],["$","$L7",null,{"href":"/docs/guides/deployment","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Deployment"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Deploy your styled app to production"}]]}]]}]]}],null],null],null]},[null,["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children","styling","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$La",null,{"sections":"$b"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Lc",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Ld",null,{}],["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Le",null]]]]
e:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Styling Guide | PhilJS"}],["$","meta","3",{"name":"description","content":"Style PhilJS applications with CSS, Tailwind, CSS-in-JS, and scoped styles."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
