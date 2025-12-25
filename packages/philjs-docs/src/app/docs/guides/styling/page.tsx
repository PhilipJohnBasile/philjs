import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Styling Guide',
  description: 'Style PhilJS applications with CSS, Tailwind, CSS-in-JS, and scoped styles.',
};

export default function StylingGuidePage() {
  return (
    <div className="mdx-content">
      <h1>Styling Guide</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS supports multiple styling approaches including plain CSS, CSS Modules,
        Tailwind CSS, and CSS-in-JS solutions.
      </p>

      <h2 id="css-modules">CSS Modules</h2>

      <p>
        CSS Modules provide scoped styles out of the box with Vite. Import your
        CSS file and use the exported class names:
      </p>

      <CodeBlock
        code={`/* Button.module.css */
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
}`}
        language="css"
        filename="Button.module.css"
      />

      <CodeBlock
        code={`import styles from './Button.module.css';

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
<Button variant="secondary">Cancel</Button>`}
        language="tsx"
        filename="Button.tsx"
      />

      <h2 id="tailwind">Tailwind CSS</h2>

      <p>
        PhilJS works seamlessly with Tailwind CSS. Install and configure Tailwind,
        then use utility classes directly in your components:
      </p>

      <CodeBlock
        code={`npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p`}
        language="bash"
        filename="Terminal"
      />

      <CodeBlock
        code={`// tailwind.config.js
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
};`}
        language="javascript"
        filename="tailwind.config.js"
      />

      <CodeBlock
        code={`function Card({ title, description, image }: CardProps) {
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
}`}
        language="tsx"
        filename="Card.tsx"
      />

      <h3 id="conditional-classes">Conditional Classes</h3>

      <p>
        Use the <code>clsx</code> or <code>classnames</code> library for conditional class names:
      </p>

      <CodeBlock
        code={`import { clsx } from 'clsx';

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
}`}
        language="tsx"
        filename="Button.tsx"
      />

      <h2 id="css-in-js">CSS-in-JS</h2>

      <p>
        PhilJS provides a built-in <code>css</code> utility for scoped, reactive styles:
      </p>

      <CodeBlock
        code={`import { css, createSignal } from 'philjs-core';

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
}`}
        language="tsx"
        filename="ThemeBox.tsx"
      />

      <h3 id="styled-components">Styled Components Pattern</h3>

      <CodeBlock
        code={`import { styled } from 'philjs-core';

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
}`}
        language="tsx"
        filename="StyledComponents.tsx"
      />

      <h2 id="global-styles">Global Styles & Theming</h2>

      <p>
        Define CSS custom properties for theming and use them throughout your app:
      </p>

      <CodeBlock
        code={`/* styles/theme.css */
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
}`}
        language="css"
        filename="styles/theme.css"
      />

      <h3 id="theme-context">Theme Context</h3>

      <CodeBlock
        code={`import { createContext, createSignal, useContext } from 'philjs-core';

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
}`}
        language="tsx"
        filename="ThemeProvider.tsx"
      />

      <h2 id="animations">Animations</h2>

      <p>
        Create smooth animations with CSS transitions and PhilJS's reactive system:
      </p>

      <CodeBlock
        code={`import { createSignal, Show, Transition } from 'philjs-core';

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
}`}
        language="tsx"
        filename="Modal.tsx"
      />

      <h2 id="responsive">Responsive Design</h2>

      <p>
        Use CSS media queries or Tailwind's responsive prefixes for adaptive layouts:
      </p>

      <CodeBlock
        code={`function ResponsiveGrid({ items }: { items: Item[] }) {
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
}`}
        language="tsx"
        filename="ResponsiveGrid.tsx"
      />

      <Callout type="info" title="Mobile-First">
        Design mobile-first by starting with base styles and adding responsive
        overrides for larger screens using <code>sm:</code>, <code>md:</code>,
        <code>lg:</code>, etc.
      </Callout>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/api/philjs-ui"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">UI Components</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Pre-built, accessible components with customizable styling
          </p>
        </Link>

        <Link
          href="/docs/guides/deployment"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy your styled app to production
          </p>
        </Link>
      </div>
    </div>
  );
}
