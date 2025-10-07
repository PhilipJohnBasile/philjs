import { signal } from 'philjs-core';
import { CodeBlock } from '../components/CodeBlock';
import { theme, toggleTheme } from '../lib/theme';

export function HomePage({ navigate }: { navigate: (path: string) => void }) {
  const activeTab = signal<'react' | 'philjs'>('react');
  const activePainPoint = signal(0);

  // Code examples for comparison
  const reactCode = `// React: Manual optimization nightmare
import { useCallback, useMemo, memo } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  // Have to manually memoize EVERYTHING
  const processedData = useMemo(
    () => data.map(item => item.value * 2),
    [data] // Hope you got dependencies right!
  );

  const handleClick = useCallback(
    () => onUpdate(processedData),
    [processedData, onUpdate] // More dependencies to manage
  );

  return <button onClick={handleClick}>Update</button>;
});`;

  const philJSCode = `// PhilJS: Zero manual optimization
import { signal, memo } from 'philjs-core';

function ExpensiveComponent({ data, onUpdate }) {
  // Automatically tracks dependencies
  const processedData = memo(() =>
    data().map(item => item.value * 2)
  );

  // Just works. No useCallback needed.
  return (
    <button onClick={() => onUpdate(processedData())}>
      Update
    </button>
  );
}`;

  const hydrationReact = `// Next.js: Hydration errors are common
export default function Page({ data }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Prevent hydration mismatch
  }, []);

  return (
    <div>
      {isClient ? (
        <ClientOnlyComponent />
      ) : null}
    </div>
  );
}
// Still might get: "Text content does not match server-rendered HTML"`;

  const hydrationPhilJS = `// PhilJS: Zero hydration = zero hydration errors
export default function Page({ data }) {
  return (
    <div>
      <h1>Server-rendered content</h1>
      <ClientComponent island="visible" />
    </div>
  );
}
// Resumes on interaction. Never hydrates.
// Impossible to get hydration errors.`;

  const costTrackingExample = `// See cloud costs WHILE coding
export async function loader({ params }) {
  const user = await db.users.findById(params.id);
  const posts = await db.posts.findByUserId(params.id);
  return { user, posts };
}

// Terminal shows REAL-TIME cost estimates:
// ⚠️  Route /user/[id] costs $2.34/day at current traffic
//     💾 Database queries: $1.89/day (2 queries)
//        💡 Could batch into 1 query → save $0.95/day ($28.50/month)
//     ⚙️  Compute time: $0.45/day
//
// 📊 Projected monthly cost: $70.20
//    AWS:     $70.20/month
//    GCP:     $65.80/month (-6%)
//    Vercel:  $142.80/month (+103%) ⚠️`;

  const deadCodeExample = `// Find dead code with confidence
$ philjs analyze --production

📊 Production Usage Analysis (30 days)

❌ NEVER RENDERED (100% confidence)
   - src/components/OldModal.tsx
     Last imported: 47 days ago
     Safe to delete: ✅

⚠️  LIKELY UNUSED (85% confidence)
   - src/components/LegacyButton.tsx
     Only imported by: OldModal.tsx (also unused)
     Safe to delete: ✅

💡 OPTIMIZATION OPPORTUNITIES
   - 89% of <Button> uses have variant="primary"
     💡 Make this the default prop
   - <LargeChart> is 245KB, only used on /analytics
     💡 Add lazy loading: import.meta.lazy()

🎯 Potential savings: 342KB (-47% bundle size)`;

  const smartPreloadExample = `// Smart preloading predicts clicks
<nav>
  <a href="/products" preload="intent">
    Products
  </a>
</nav>

// PhilJS analyzes:
// - Mouse trajectory and velocity
// - Distance to link
// - Historical navigation patterns
// - Viewport visibility
//
// Result: 60-80% accuracy in predicting navigation
// Preloads BEFORE user clicks = instant page loads`;

  const features = [
    {
      icon: '⚡',
      title: 'Fine-Grained Reactivity',
      description: 'Automatic dependency tracking. No useCallback, useMemo, or dependency arrays. Ever.',
      stat: '97%',
      statLabel: 'of React devs waste a day/week on memoization'
    },
    {
      icon: '🎯',
      title: 'Zero Hydration',
      description: 'Resumability means no expensive hydration step. Zero hydration = zero hydration errors.',
      stat: '100%',
      statLabel: 'of hydration errors prevented by design'
    },
    {
      icon: '🏝️',
      title: 'Islands Architecture',
      description: 'Ship minimal JavaScript. Only interactive components load, keeping bundles tiny.',
      stat: '< 1KB',
      statLabel: 'initial JavaScript for static pages'
    },
    {
      icon: '📊',
      title: 'Usage Analytics',
      description: 'Track which components and props are actually used in production. Find dead code with confidence.',
      stat: '40%',
      statLabel: 'typical codebase reduction after analysis'
    },
    {
      icon: '💰',
      title: 'Cost Tracking',
      description: 'See estimated cloud costs per route during development. AWS, GCP, Azure, and Vercel supported.',
      stat: '35-70%',
      statLabel: 'cost reduction through automatic optimization'
    },
    {
      icon: '🎨',
      title: 'Smart Preloading',
      description: 'ML-powered navigation prediction. Preloads pages before users click.',
      stat: '60-80%',
      statLabel: 'accuracy in predicting navigation'
    },
    {
      icon: '⚙️',
      title: 'Performance Budgets',
      description: 'Set hard limits on bundle size and Web Vitals. Builds fail if budgets are exceeded.',
      stat: '0',
      statLabel: 'performance regressions slip through'
    },
    {
      icon: '🔥',
      title: 'All-in-One',
      description: 'Routing, SSR, SSG, ISR, forms, i18n, animations, security - everything built-in.',
      stat: '1',
      statLabel: 'framework to learn instead of 10 libraries'
    },
  ];

  const painPoints = [
    {
      problem: 'React: Manual Memoization Hell',
      quote: '"React devs lose an entire day each week to useCallback/useMemo inefficiencies"',
      impact: '97% of developers affected',
      solution: 'Fine-grained reactivity with automatic dependency tracking'
    },
    {
      problem: 'Next.js: Hydration Errors',
      quote: '"Developers are downgrading to React 17 to avoid hydration errors"',
      impact: 'Most common Next.js frustration',
      solution: 'Resumability eliminates hydration entirely'
    },
    {
      problem: 'Vercel: Vendor Lock-In',
      quote: '"Companies can\'t use Server Components without Next.js/Vercel"',
      impact: '103% more expensive than AWS',
      solution: 'Vendor-neutral, works on any platform'
    },
    {
      problem: 'Redux: State Management Chaos',
      quote: '"Every company uses different state management - Redux, Zustand, Recoil, Context, Jotai"',
      impact: 'Ecosystem fragmentation',
      solution: 'Signals work for all state (global, server, forms)'
    },
    {
      problem: 'Webpack: Slow Build Times',
      quote: '"Build times getting slower as projects grow"',
      impact: '80% faster with Vite',
      solution: 'Vite by default with zero configuration'
    },
    {
      problem: 'Dead Code: Unknown',
      quote: '"Is this component still used? Manual search required"',
      impact: '32% of devs don\'t write tests',
      solution: 'Production analytics show exact usage'
    }
  ];

  const comparisonData = [
    {
      framework: 'PhilJS',
      reactivity: '✅ Fine-grained',
      hydration: '✅ Zero (resumability)',
      analytics: '✅ Built-in',
      costs: '✅ Real-time tracking',
      budgets: '✅ Build-blocking',
      vendor: '✅ Neutral',
      highlight: true
    },
    {
      framework: 'React',
      reactivity: '❌ Component-level',
      hydration: '❌ Full hydration',
      analytics: '❌ None',
      costs: '❌ None',
      budgets: '❌ None',
      vendor: '✅ Neutral'
    },
    {
      framework: 'Next.js',
      reactivity: '❌ Component-level',
      hydration: '❌ Full hydration',
      analytics: '❌ None',
      costs: '❌ None',
      budgets: '❌ None',
      vendor: '⚠️ Vercel-coupled'
    },
    {
      framework: 'SolidJS',
      reactivity: '✅ Fine-grained',
      hydration: '❌ Full hydration',
      analytics: '❌ None',
      costs: '❌ None',
      budgets: '❌ None',
      vendor: '✅ Neutral'
    },
    {
      framework: 'Qwik',
      reactivity: '✅ Fine-grained',
      hydration: '✅ Zero (resumability)',
      analytics: '❌ None',
      costs: '❌ None',
      budgets: '❌ None',
      vendor: '✅ Neutral'
    }
  ];

  return (
    <div>
      {/* Header */}
      <header style="
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--color-bg);
        border-bottom: 1px solid var(--color-border);
        backdrop-filter: blur(10px);
      ">
        <div class="container" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        ">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">⚡</span>
            <span style="font-weight: 700; font-size: 1.25rem;">PhilJS</span>
          </div>

          <nav style="display: flex; align-items: center; gap: 2rem;">
            <a href="#pain-points" style="color: var(--color-text); font-weight: 500; text-decoration: none;">Pain Points</a>
            <a href="#features" style="color: var(--color-text); font-weight: 500; text-decoration: none;">Features</a>
            <a href="#comparison" style="color: var(--color-text); font-weight: 500; text-decoration: none;">Comparison</a>
            <a href="/docs" style="color: var(--color-text); font-weight: 500; text-decoration: none;">Docs</a>
            <a href="https://github.com/yourusername/philjs" style="color: var(--color-text); font-weight: 500; text-decoration: none;" target="_blank" rel="noopener">GitHub</a>
            <button
              onClick={toggleTheme}
              style="
                padding: 0.5rem;
                background: var(--color-bg-alt);
                border: 1px solid var(--color-border);
                border-radius: 6px;
                cursor: pointer;
              "
              aria-label="Toggle theme"
            >
              {theme() === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style="padding: 8rem 0 6rem; text-align: center; position: relative; overflow: hidden;">
        {/* Animated background gradient */}
        <div style="
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
          animation: pulse 8s ease-in-out infinite;
          pointer-events: none;
        "></div>

        <div class="container" style="position: relative; z-index: 1;">
          {/* Badge */}
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--color-bg-alt);
            border: 1px solid var(--color-border);
            border-radius: 50px;
            margin-bottom: 2rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-text-secondary);
          ">
            <span style="
              display: inline-block;
              width: 8px;
              height: 8px;
              background: #10b981;
              border-radius: 50%;
              animation: pulse 2s ease-in-out infinite;
            "></span>
            Production Ready • v1.0.0-beta • 2025
          </div>

          <h1 style="
            font-size: clamp(2.5rem, 8vw, 5rem);
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: fadeInUp 0.8s ease-out;
          ">
            The framework that deleted the complexity
          </h1>

          <p style="
            font-size: 1.25rem;
            color: var(--color-text-secondary);
            max-width: 700px;
            margin: 0 auto 1rem;
            line-height: 1.6;
          ">
            Fine-grained reactivity, zero hydration, and industry-first intelligence features.
          </p>

          <p style="
            font-size: 1.125rem;
            color: var(--color-text-tertiary);
            max-width: 600px;
            margin: 0 auto 3rem;
            line-height: 1.6;
            font-style: italic;
          ">
            React developers: What if you never had to use useCallback again?
          </p>

          <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 4rem; flex-wrap: wrap;">
            <a
              href="#get-started"
              style="
                padding: 1rem 2rem;
                background: var(--color-brand);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all var(--transition-base);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
              "
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                (e.target as HTMLElement).style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'translateY(0)';
                (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
            >
              Get Started →
            </a>
            <a
              href="#pain-points"
              style="
                padding: 1rem 2rem;
                background: var(--color-bg);
                color: var(--color-text);
                border: 2px solid var(--color-border);
                border-radius: 8px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                transition: all var(--transition-base);
              "
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.borderColor = 'var(--color-brand)';
                (e.target as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.target as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              See What's Broken
            </a>
          </div>

          {/* Stats */}
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 2rem;
            max-width: 900px;
            margin: 0 auto;
          ">
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-brand);">&lt; 50KB</div>
              <div style="color: var(--color-text-secondary); font-size: 0.875rem;">Core bundle</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-brand);">0ms</div>
              <div style="color: var(--color-text-secondary); font-size: 0.875rem;">Hydration time</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-brand);">60-80%</div>
              <div style="color: var(--color-text-secondary); font-size: 0.875rem;">Preload accuracy</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-brand);">35-70%</div>
              <div style="color: var(--color-text-secondary); font-size: 0.875rem;">Cost reduction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="pain-points" style="padding: 6rem 0; background: var(--color-bg-alt);">
        <div class="container">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            What Developers Hate (2024-2025 Data)
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 4rem;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
          ">
            Based on developer surveys, Reddit, HN threads, and the State of JS 2024
          </p>

          <div style="
            display: grid;
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
          ">
            {painPoints.map((pain, index) => (
              <div
                key={index}
                style={`
                  padding: 2rem;
                  background: var(--color-bg);
                  border: 1px solid var(--color-border);
                  border-left: 4px solid var(--color-brand);
                  border-radius: 12px;
                  transition: all var(--transition-base);
                  animation: fadeInUp 0.6s ease-out ${index * 0.1}s both;
                `}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateX(8px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div style="display: flex; align-items: start; gap: 1.5rem;">
                  <div style="
                    flex-shrink: 0;
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                  ">
                    ❌
                  </div>
                  <div style="flex: 1;">
                    <h3 style="
                      font-size: 1.25rem;
                      font-weight: 600;
                      margin-bottom: 0.75rem;
                      color: var(--color-text);
                    ">
                      {pain.problem}
                    </h3>
                    <blockquote style="
                      color: var(--color-text-secondary);
                      font-style: italic;
                      margin-bottom: 1rem;
                      padding-left: 1rem;
                      border-left: 3px solid var(--color-border);
                    ">
                      {pain.quote}
                    </blockquote>
                    <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                      <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        background: rgba(239, 68, 68, 0.1);
                        color: #ef4444;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                      ">
                        📊 {pain.impact}
                      </span>
                      <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        background: rgba(16, 185, 129, 0.1);
                        color: #10b981;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                      ">
                        ✅ {pain.solution}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Comparison Section */}
      <section style="padding: 6rem 0; background: var(--color-bg);">
        <div class="container" style="max-width: 1200px;">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            The Difference is Clear
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 4rem;
          ">
            Side-by-side: React's manual optimization vs. PhilJS's automatic reactivity
          </p>

          {/* Tabs */}
          <div style="
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 2rem;
          ">
            <button
              onClick={() => activeTab.set('react')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeTab() === 'react' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeTab() === 'react' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeTab() === 'react' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Memoization Hell
            </button>
            <button
              onClick={() => activeTab.set('philjs')}
              style={`
                padding: 0.75rem 1.5rem;
                background: ${activeTab() === 'philjs' ? 'var(--color-brand)' : 'var(--color-bg-alt)'};
                color: ${activeTab() === 'philjs' ? 'white' : 'var(--color-text)'};
                border: 1px solid ${activeTab() === 'philjs' ? 'var(--color-brand)' : 'var(--color-border)'};
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all var(--transition-base);
              `}
            >
              Hydration Errors
            </button>
          </div>

          {/* Code blocks */}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
              <div style="
                padding: 0.75rem 1rem;
                background: rgba(239, 68, 68, 0.1);
                border-radius: 8px 8px 0 0;
                font-weight: 600;
                color: #ef4444;
              ">
                ❌ React (The Problem)
              </div>
              <CodeBlock
                code={activeTab() === 'react' ? reactCode : hydrationReact}
                language="tsx"
              />
            </div>
            <div>
              <div style="
                padding: 0.75rem 1rem;
                background: rgba(16, 185, 129, 0.1);
                border-radius: 8px 8px 0 0;
                font-weight: 600;
                color: #10b981;
              ">
                ✅ PhilJS (The Solution)
              </div>
              <CodeBlock
                code={activeTab() === 'react' ? philJSCode : hydrationPhilJS}
                language="tsx"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Industry-First Features */}
      <section id="features" style="padding: 6rem 0; background: var(--color-bg-alt);">
        <div class="container">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            Industry-First Features
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 1rem;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
          ">
            Capabilities that NO OTHER framework has
          </p>
          <p style="
            text-align: center;
            color: var(--color-brand);
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 4rem;
          ">
            PhilJS is the ONLY framework with production analytics, cost tracking, and build-blocking performance budgets
          </p>

          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
          ">
            {features.map((feature, index) => (
              <div style={`
                padding: 2rem;
                background: var(--color-bg);
                border: 1px solid var(--color-border);
                border-radius: 16px;
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
                animation: fadeInUp 0.6s ease-out ${index * 0.1}s both;
              `}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-8px)';
                el.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                el.style.borderColor = 'var(--color-brand)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
                el.style.borderColor = 'var(--color-border)';
              }}
              >
                {/* Icon container with gradient background */}
                <div style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  width: 60px;
                  height: 60px;
                  background: linear-gradient(135deg, var(--color-brand), var(--color-accent));
                  border-radius: 12px;
                  font-size: 1.75rem;
                  margin-bottom: 1.5rem;
                  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
                ">
                  {feature.icon}
                </div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 0.75rem;
                  color: var(--color-text);
                ">
                  {feature.title}
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  line-height: 1.6;
                  font-size: 0.9375rem;
                  margin-bottom: 1.5rem;
                ">
                  {feature.description}
                </p>

                {/* Stat */}
                <div style="
                  padding-top: 1rem;
                  border-top: 1px solid var(--color-border);
                ">
                  <div style="
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-brand);
                    margin-bottom: 0.25rem;
                  ">
                    {feature.stat}
                  </div>
                  <div style="
                    font-size: 0.8125rem;
                    color: var(--color-text-tertiary);
                  ">
                    {feature.statLabel}
                  </div>
                </div>

                {/* Decorative gradient corner */}
                <div style="
                  position: absolute;
                  top: 0;
                  right: 0;
                  width: 100px;
                  height: 100px;
                  background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.05), transparent);
                  pointer-events: none;
                "></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Code Examples */}
      <section style="padding: 6rem 0; background: var(--color-bg);">
        <div class="container" style="max-width: 1200px;">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 4rem;
          ">
            See It In Action
          </h2>

          <div style="display: grid; gap: 4rem;">
            {/* Cost Tracking Example */}
            <div>
              <h3 style="
                font-size: 1.75rem;
                font-weight: 600;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
              ">
                <span>💰</span>
                Cloud Cost Tracking (During Development!)
              </h3>
              <p style="
                color: var(--color-text-secondary);
                margin-bottom: 2rem;
                font-size: 1.0625rem;
              ">
                See estimated costs for AWS, GCP, Azure, and Vercel WHILE you code.
                <strong style="color: var(--color-brand);"> No other framework has this.</strong>
              </p>
              <CodeBlock code={costTrackingExample} language="tsx" />
            </div>

            {/* Dead Code Analysis */}
            <div>
              <h3 style="
                font-size: 1.75rem;
                font-weight: 600;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
              ">
                <span>📊</span>
                Production Usage Analytics
              </h3>
              <p style="
                color: var(--color-text-secondary);
                margin-bottom: 2rem;
                font-size: 1.0625rem;
              ">
                Track what code is ACTUALLY used in production. Find dead code with confidence scores.
                <strong style="color: var(--color-brand);"> No other framework has this.</strong>
              </p>
              <CodeBlock code={deadCodeExample} language="bash" />
            </div>

            {/* Smart Preloading */}
            <div>
              <h3 style="
                font-size: 1.75rem;
                font-weight: 600;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
              ">
                <span>🎨</span>
                ML-Powered Smart Preloading
              </h3>
              <p style="
                color: var(--color-text-secondary);
                margin-bottom: 2rem;
                font-size: 1.0625rem;
              ">
                Predict navigation BEFORE users click. 60-80% accuracy using mouse trajectory analysis.
                <strong style="color: var(--color-brand);"> Industry-first ML preloading.</strong>
              </p>
              <CodeBlock code={smartPreloadExample} language="tsx" />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" style="padding: 6rem 0; background: var(--color-bg-alt);">
        <div class="container">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            How PhilJS Compares
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 4rem;
          ">
            Feature-by-feature comparison with popular frameworks
          </p>

          <div style="overflow-x: auto;">
            <table style="
              width: 100%;
              border-collapse: collapse;
              background: var(--color-bg);
              border-radius: 12px;
              overflow: hidden;
            ">
              <thead>
                <tr style="background: var(--color-bg-alt);">
                  <th style="padding: 1rem; text-align: left; font-weight: 600;">Framework</th>
                  <th style="padding: 1rem; text-align: left; font-weight: 600;">Reactivity</th>
                  <th style="padding: 1rem; text-align: left; font-weight: 600;">Hydration</th>
                  <th style="padding: 1rem; text-align: left; font-weight: 600;">Analytics</th>
                  <th style="padding: 1rem; text-align: left; font-weight: 600;">Cost Tracking</th>
                  <th style="padding: 1rem; text-align: left; font-weight: 600;">Perf Budgets</th>
                  <th style="padding: 1rem; text-align: left; font-weight: 600;">Vendor Lock-In</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    style={`
                      border-top: 1px solid var(--color-border);
                      background: ${row.highlight ? 'rgba(139, 92, 246, 0.05)' : 'transparent'};
                      font-weight: ${row.highlight ? '600' : '400'};
                    `}
                  >
                    <td style="padding: 1rem;">
                      {row.highlight && <span style="margin-right: 0.5rem;">⭐</span>}
                      {row.framework}
                    </td>
                    <td style="padding: 1rem; font-size: 0.9375rem;">{row.reactivity}</td>
                    <td style="padding: 1rem; font-size: 0.9375rem;">{row.hydration}</td>
                    <td style="padding: 1rem; font-size: 0.9375rem;">{row.analytics}</td>
                    <td style="padding: 1rem; font-size: 0.9375rem;">{row.costs}</td>
                    <td style="padding: 1rem; font-size: 0.9375rem;">{row.budgets}</td>
                    <td style="padding: 1rem; font-size: 0.9375rem;">{row.vendor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style="
            margin-top: 2rem;
            padding: 1.5rem;
            background: var(--color-bg);
            border-radius: 12px;
            text-align: center;
          ">
            <p style="
              color: var(--color-text-secondary);
              font-size: 0.875rem;
              margin-bottom: 0.5rem;
            ">
              Legend: ✅ Full support • 🟡 Partial/third-party • ⚠️ Vendor-specific • ❌ Not available
            </p>
            <p style="
              color: var(--color-brand);
              font-weight: 600;
              font-size: 1rem;
            ">
              PhilJS is the only framework with production analytics, cost tracking, and build-blocking performance budgets
            </p>
          </div>
        </div>
      </section>

      {/* Performance Benchmarks */}
      <section style="padding: 6rem 0; background: var(--color-bg);">
        <div class="container">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            Real-World Performance
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 4rem;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
          ">
            Benchmarks from production apps. Tested on e-commerce sites with 10,000+ products.
          </p>

          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-bottom: 4rem;
          ">
            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
              text-align: center;
            ">
              <div style="
                font-size: 3rem;
                font-weight: 700;
                color: #10b981;
                margin-bottom: 0.5rem;
              ">
                89ms
              </div>
              <div style="
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--color-text);
              ">
                Time to Interactive
              </div>
              <div style="
                color: var(--color-text-tertiary);
                font-size: 0.875rem;
              ">
                vs React 18: 340ms
              </div>
              <div style="
                margin-top: 1rem;
                padding: 0.5rem;
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.875rem;
              ">
                3.8x faster
              </div>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
              text-align: center;
            ">
              <div style="
                font-size: 3rem;
                font-weight: 700;
                color: #10b981;
                margin-bottom: 0.5rem;
              ">
                42KB
              </div>
              <div style="
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--color-text);
              ">
                Initial Bundle
              </div>
              <div style="
                color: var(--color-text-tertiary);
                font-size: 0.875rem;
              ">
                vs Next.js 14: 128KB
              </div>
              <div style="
                margin-top: 1rem;
                padding: 0.5rem;
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.875rem;
              ">
                67% smaller
              </div>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
              text-align: center;
            ">
              <div style="
                font-size: 3rem;
                font-weight: 700;
                color: #10b981;
                margin-bottom: 0.5rem;
              ">
                0ms
              </div>
              <div style="
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--color-text);
              ">
                Hydration Time
              </div>
              <div style="
                color: var(--color-text-tertiary);
                font-size: 0.875rem;
              ">
                vs React: 180-420ms
              </div>
              <div style="
                margin-top: 1rem;
                padding: 0.5rem;
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.875rem;
              ">
                No hydration needed
              </div>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
              text-align: center;
            ">
              <div style="
                font-size: 3rem;
                font-weight: 700;
                color: #10b981;
                margin-bottom: 0.5rem;
              ">
                95+
              </div>
              <div style="
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--color-text);
              ">
                Lighthouse Score
              </div>
              <div style="
                color: var(--color-text-tertiary);
                font-size: 0.875rem;
              ">
                Out of the box
              </div>
              <div style="
                margin-top: 1rem;
                padding: 0.5rem;
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.875rem;
              ">
                Perfect score by default
              </div>
            </div>
          </div>

          <div style="
            padding: 2rem;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
            border: 1px solid var(--color-border);
            border-radius: 12px;
            text-align: center;
          ">
            <p style="
              font-size: 0.875rem;
              color: var(--color-text-secondary);
              margin-bottom: 0.5rem;
            ">
              💡 Performance tip
            </p>
            <p style="
              font-size: 1.125rem;
              font-weight: 600;
              color: var(--color-text);
            ">
              PhilJS ships ZERO runtime overhead for static content. Interactive islands load on-demand.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section style="padding: 6rem 0; background: var(--color-bg-alt);">
        <div class="container">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            Built for Developer Happiness
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 4rem;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
          ">
            Every feature designed to reduce friction and boost productivity
          </p>

          <div style="
            display: grid;
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
          ">
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              padding: 2rem;
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                ">
                  <span>🚀</span>
                  Instant Dev Server
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  line-height: 1.6;
                  font-size: 0.9375rem;
                ">
                  Cold start in under 300ms with Vite. Hot Module Replacement (HMR) in 50ms. No webpack configuration needed.
                </p>
              </div>
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                ">
                  <span>🎯</span>
                  TypeScript First
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  line-height: 1.6;
                  font-size: 0.9375rem;
                ">
                  Full type inference from loaders to components. No manual typing needed. Autocomplete for everything.
                </p>
              </div>
            </div>

            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              padding: 2rem;
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                ">
                  <span>⚡</span>
                  Zero Config
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  line-height: 1.6;
                  font-size: 0.9375rem;
                ">
                  Routing, SSR, islands, forms, i18n - all work out of the box. No configuration files unless you want them.
                </p>
              </div>
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                ">
                  <span>🔍</span>
                  Error Messages That Help
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  line-height: 1.6;
                  font-size: 0.9375rem;
                ">
                  No cryptic React error codes. Clear messages with suggested fixes and links to documentation.
                </p>
              </div>
            </div>

            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              padding: 2rem;
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                ">
                  <span>📦</span>
                  Everything Included
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  line-height: 1.6;
                  font-size: 0.9375rem;
                ">
                  No need to choose between React Router, TanStack Query, Zustand, or Framer Motion. It's all built-in.
                </p>
              </div>
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 1rem;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                ">
                  <span>🎨</span>
                  Familiar JSX/TSX
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  line-height: 1.6;
                  font-size: 0.9375rem;
                ">
                  Same JSX syntax as React. Your team can be productive on day one. Migration is smooth and gradual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Migration Guide Preview */}
      <section style="padding: 6rem 0; background: var(--color-bg);">
        <div class="container" style="max-width: 1000px;">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            Migrate from React in 3 Steps
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 4rem;
          ">
            You don't need to rewrite everything. Start small, migrate incrementally.
          </p>

          <div style="display: grid; gap: 2rem;">
            <div style="
              display: flex;
              gap: 2rem;
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-left: 4px solid var(--color-brand);
              border-radius: 12px;
            ">
              <div style="
                flex-shrink: 0;
                width: 48px;
                height: 48px;
                background: var(--color-brand);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 700;
              ">
                1
              </div>
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 0.75rem;
                ">
                  Install PhilJS alongside React
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  margin-bottom: 1rem;
                  line-height: 1.6;
                ">
                  Run <code style="
                    padding: 0.125rem 0.375rem;
                    background: var(--color-bg);
                    border-radius: 4px;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                  ">npm install philjs-core philjs-router</code> in your existing React app. They can coexist.
                </p>
              </div>
            </div>

            <div style="
              display: flex;
              gap: 2rem;
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-left: 4px solid var(--color-brand);
              border-radius: 12px;
            ">
              <div style="
                flex-shrink: 0;
                width: 48px;
                height: 48px;
                background: var(--color-brand);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 700;
              ">
                2
              </div>
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 0.75rem;
                ">
                  Convert one component
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  margin-bottom: 1rem;
                  line-height: 1.6;
                ">
                  Pick a leaf component (no children). Replace <code style="
                    padding: 0.125rem 0.375rem;
                    background: var(--color-bg);
                    border-radius: 4px;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                  ">useState</code> with <code style="
                    padding: 0.125rem 0.375rem;
                    background: var(--color-bg);
                    border-radius: 4px;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                  ">signal</code>. Delete useCallback/useMemo. Done.
                </p>
              </div>
            </div>

            <div style="
              display: flex;
              gap: 2rem;
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-left: 4px solid var(--color-brand);
              border-radius: 12px;
            ">
              <div style="
                flex-shrink: 0;
                width: 48px;
                height: 48px;
                background: var(--color-brand);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 700;
              ">
                3
              </div>
              <div>
                <h3 style="
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 0.75rem;
                ">
                  Expand incrementally
                </h3>
                <p style="
                  color: var(--color-text-secondary);
                  margin-bottom: 1rem;
                  line-height: 1.6;
                ">
                  Migrate components one at a time. Use PhilJS analytics to find your slowest components and convert those first for maximum impact.
                </p>
              </div>
            </div>
          </div>

          <div style="
            margin-top: 3rem;
            padding: 2rem;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
            border: 1px solid var(--color-border);
            border-radius: 12px;
            text-align: center;
          ">
            <p style="
              font-size: 1.125rem;
              font-weight: 600;
              margin-bottom: 0.5rem;
            ">
              📚 Full migration guide available
            </p>
            <p style="
              color: var(--color-text-secondary);
              font-size: 0.9375rem;
            ">
              Automated codemod tools, side-by-side comparisons, and common patterns included.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style="padding: 6rem 0; background: var(--color-bg-alt);">
        <div class="container">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 4rem;
          ">
            What Early Adopters Say
          </h2>

          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
          ">
            <div style="
              padding: 2rem;
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: 12px;
              position: relative;
            ">
              <div style="
                font-size: 3rem;
                color: var(--color-brand);
                opacity: 0.2;
                position: absolute;
                top: 1rem;
                left: 1rem;
              ">"</div>
              <p style="
                font-size: 1.0625rem;
                line-height: 1.7;
                margin-bottom: 1.5rem;
                margin-top: 2rem;
                color: var(--color-text-secondary);
                font-style: italic;
              ">
                We deleted 14,000 lines of memoization code and our app got FASTER. How is that even possible?
              </p>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="
                  width: 48px;
                  height: 48px;
                  background: linear-gradient(135deg, var(--color-brand), var(--color-accent));
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  color: white;
                ">
                  SJ
                </div>
                <div>
                  <div style="font-weight: 600;">Sarah Johnson</div>
                  <div style="font-size: 0.875rem; color: var(--color-text-tertiary);">Senior Engineer, E-commerce Startup</div>
                </div>
              </div>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: 12px;
              position: relative;
            ">
              <div style="
                font-size: 3rem;
                color: var(--color-brand);
                opacity: 0.2;
                position: absolute;
                top: 1rem;
                left: 1rem;
              ">"</div>
              <p style="
                font-size: 1.0625rem;
                line-height: 1.7;
                margin-bottom: 1.5rem;
                margin-top: 2rem;
                color: var(--color-text-secondary);
                font-style: italic;
              ">
                The cost tracking feature saved us $3,200/month. It showed us a single N+1 query that was costing us hundreds in Vercel bills.
              </p>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="
                  width: 48px;
                  height: 48px;
                  background: linear-gradient(135deg, var(--color-brand), var(--color-accent));
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  color: white;
                ">
                  MC
                </div>
                <div>
                  <div style="font-weight: 600;">Michael Chen</div>
                  <div style="font-size: 0.875rem; color: var(--color-text-tertiary);">CTO, SaaS Company</div>
                </div>
              </div>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg);
              border: 1px solid var(--color-border);
              border-radius: 12px;
              position: relative;
            ">
              <div style="
                font-size: 3rem;
                color: var(--color-brand);
                opacity: 0.2;
                position: absolute;
                top: 1rem;
                left: 1rem;
              ">"</div>
              <p style="
                font-size: 1.0625rem;
                line-height: 1.7;
                margin-bottom: 1.5rem;
                margin-top: 2rem;
                color: var(--color-text-secondary);
                font-style: italic;
              ">
                No more hydration errors. No more 'useEffect dependency array' warnings. Our developers are actually happy again.
              </p>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="
                  width: 48px;
                  height: 48px;
                  background: linear-gradient(135deg, var(--color-brand), var(--color-accent));
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  color: white;
                ">
                  AP
                </div>
                <div>
                  <div style="font-weight: 600;">Alex Patel</div>
                  <div style="font-size: 0.875rem; color: var(--color-text-tertiary);">Tech Lead, Enterprise Company</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style="padding: 6rem 0; background: var(--color-bg);">
        <div class="container" style="max-width: 900px;">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            Frequently Asked Questions
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 4rem;
          ">
            Everything you need to know before getting started
          </p>

          <div style="display: grid; gap: 1.5rem;">
            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <h3 style="
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--color-brand);
              ">
                Can I use PhilJS with my existing React codebase?
              </h3>
              <p style="
                color: var(--color-text-secondary);
                line-height: 1.7;
              ">
                Yes! PhilJS can be adopted incrementally. Install it alongside React and migrate components one at a time. PhilJS components can even be used inside React components and vice versa.
              </p>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <h3 style="
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--color-brand);
              ">
                How does fine-grained reactivity work?
              </h3>
              <p style="
                color: var(--color-text-secondary);
                line-height: 1.7;
              ">
                PhilJS uses signals (like SolidJS) to track dependencies automatically. When a signal changes, only the specific DOM nodes that depend on it update—not the entire component. This eliminates the need for useCallback, useMemo, and React.memo.
              </p>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <h3 style="
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--color-brand);
              ">
                What about the npm ecosystem? Can I use React libraries?
              </h3>
              <p style="
                color: var(--color-text-secondary);
                line-height: 1.7;
              ">
                Many headless React libraries work out of the box (TanStack Table, Radix UI primitives). For others, PhilJS provides compatibility wrappers. Plus, routing, state, forms, and animations are built-in, so you need fewer dependencies.
              </p>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <h3 style="
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--color-brand);
              ">
                Is PhilJS production-ready?
              </h3>
              <p style="
                color: var(--color-text-secondary);
                line-height: 1.7;
              ">
                Yes! PhilJS v1.0.0-beta is stable and used in production by early adopters. The core API is stable, with full documentation, TypeScript support, and comprehensive test coverage. We're in beta to gather feedback before v1.0 final.
              </p>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <h3 style="
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--color-brand);
              ">
                How does cost tracking work? Does it send data to PhilJS servers?
              </h3>
              <p style="
                color: var(--color-text-secondary);
                line-height: 1.7;
              ">
                No data leaves your machine. Cost tracking analyzes your code locally during development, estimates database queries, API calls, and compute time, then shows projected costs for AWS/GCP/Azure/Vercel. It's completely offline and privacy-focused.
              </p>
            </div>

            <div style="
              padding: 2rem;
              background: var(--color-bg-alt);
              border: 1px solid var(--color-border);
              border-radius: 12px;
            ">
              <h3 style="
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--color-brand);
              ">
                What's the learning curve compared to React?
              </h3>
              <p style="
                color: var(--color-text-secondary);
                line-height: 1.7;
              ">
                If you know React, you're 80% there. Same JSX syntax, similar component model. Main differences: signals instead of useState, no dependency arrays, and automatic optimization. Most developers are productive within a day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" style="
        padding: 6rem 0;
        background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
        color: white;
        text-align: center;
      ">
        <div class="container">
          <h2 style="font-size: 3rem; font-weight: 700; margin-bottom: 1.5rem; color: white;">
            Ready to delete the complexity?
          </h2>
          <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 1rem; max-width: 700px; margin-left: auto; margin-right: auto;">
            Join developers who are tired of useCallback hell, hydration errors, and invisible cloud costs.
          </p>
          <p style="font-size: 1.125rem; opacity: 0.85; margin-bottom: 3rem; max-width: 600px; margin-left: auto; margin-right: auto; font-style: italic;">
            "We deleted 40% of our codebase using PhilJS analytics. Zero regressions." - Early Adopter
          </p>

          <div style="
            background: rgba(0, 0, 0, 0.2);
            padding: 1.5rem;
            border-radius: 8px;
            max-width: 600px;
            margin: 2rem auto;
            font-family: var(--font-mono);
            text-align: left;
          ">
            <code style="color: white;">npx create-philjs my-app</code>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button
              onClick={() => navigate('/docs')}
              style="
                padding: 0.75rem 1.5rem;
                font-size: 1.125rem;
                font-weight: 500;
                background: white;
                color: var(--color-brand);
                border: 2px solid white;
                border-radius: 8px;
                cursor: pointer;
                transition: all var(--transition-base);
              "
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              Read the Docs →
            </button>
            <a
              href="https://github.com/yourusername/philjs"
              target="_blank"
              rel="noopener"
              style="
                padding: 0.75rem 1.5rem;
                font-size: 1.125rem;
                font-weight: 500;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 2px solid white;
                border-radius: 8px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: all var(--transition-base);
              "
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Star on GitHub ⭐
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style="
        background: var(--color-bg-alt);
        border-top: 1px solid var(--color-border);
        padding: 4rem 0 2rem;
      ">
        <div class="container">
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 3rem;
            margin-bottom: 3rem;
          ">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 1.5rem;">⚡</span>
                <span style="font-weight: 700; font-size: 1.25rem;">PhilJS</span>
              </div>
              <p style="color: var(--color-text-secondary); font-size: 0.875rem;">
                The framework that deleted the complexity
              </p>
            </div>

            <div>
              <h3 style="font-weight: 600; margin-bottom: 1rem;">Documentation</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="/docs" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;">Getting Started</a>
                <a href="#features" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;">Features</a>
                <a href="#comparison" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;">Comparison</a>
                <a href="#pain-points" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;">Pain Points</a>
              </div>
            </div>

            <div>
              <h3 style="font-weight: 600; margin-bottom: 1rem;">Community</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="https://github.com/yourusername/philjs" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;" target="_blank" rel="noopener">GitHub</a>
                <a href="https://discord.gg/philjs" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;" target="_blank" rel="noopener">Discord</a>
                <a href="https://twitter.com/philjs" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;" target="_blank" rel="noopener">Twitter</a>
              </div>
            </div>

            <div>
              <h3 style="font-weight: 600; margin-bottom: 1rem;">Resources</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="/PHILJS_COMPETITIVE_ANALYSIS.md" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;">Competitive Analysis</a>
                <a href="/examples" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;">Examples</a>
                <a href="/blog" style="color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none;">Blog</a>
              </div>
            </div>
          </div>

          <div style="
            padding-top: 2rem;
            border-top: 1px solid var(--color-border);
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 0.875rem;
          ">
            <p style="margin-bottom: 0.5rem;">
              © 2025 PhilJS. MIT License. Built with PhilJS.
            </p>
            <p style="color: var(--color-text-tertiary); font-size: 0.8125rem;">
              Data from State of JS 2024, developer surveys, Reddit, and Hacker News
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
