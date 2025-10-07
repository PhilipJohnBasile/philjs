import { signal } from 'philjs-core';
import { Button } from '../components/Button';
import { CodeBlock } from '../components/CodeBlock';
import { theme, toggleTheme } from '../lib/theme';

export function HomePage({ navigate }: { navigate: (path: string) => void }) {
  const exampleCode = `import { signal, memo, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  effect(() => {
    console.log('Count changed:', count());
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}`;

  const features = [
    {
      icon: '⚡',
      title: 'Fine-Grained Reactivity',
      description: 'Automatic dependency tracking with no dependency arrays. Just pure, intuitive reactivity.',
    },
    {
      icon: '🎯',
      title: 'Zero Hydration',
      description: 'Qwik-style resumability means no expensive hydration step. Apps are interactive instantly.',
    },
    {
      icon: '🏝️',
      title: 'Islands Architecture',
      description: 'Ship minimal JavaScript. Only interactive components hydrate, keeping bundles tiny.',
    },
    {
      icon: '📊',
      title: 'Usage Analytics',
      description: 'Track which components and props are used in production. Find dead code with confidence.',
    },
    {
      icon: '💰',
      title: 'Cost Tracking',
      description: 'See estimated cloud costs per route during development. AWS, GCP, and Azure supported.',
    },
    {
      icon: '🎨',
      title: 'Smart Preloading',
      description: 'Predicts navigation from mouse intent with 60-80% accuracy. Industry-first ML preloading.',
    },
    {
      icon: '⚙️',
      title: 'Performance Budgets',
      description: 'Hard limits on bundle size and Web Vitals. Build fails if budgets are exceeded.',
    },
    {
      icon: '🔥',
      title: 'All-in-One',
      description: 'Routing, SSR, forms, i18n, animations - everything you need in one cohesive framework.',
    },
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
            <a href="#get-started" style="color: var(--color-text); font-weight: 500;">Get Started</a>
            <a href="#why-philjs" style="color: var(--color-text); font-weight: 500;">Features</a>
            <a href="https://github.com/yourusername/philjs" style="color: var(--color-text); font-weight: 500;" target="_blank" rel="noopener">GitHub</a>
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
            Production Ready • v1.0.0
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
            The framework that<br/>thinks ahead
          </h1>
          
          <p style="
            font-size: 1.25rem;
            color: var(--color-text-secondary);
            max-width: 600px;
            margin: 0 auto 3rem;
            line-height: 1.6;
          ">
            Fine-grained reactivity, zero hydration, and industry-first intelligence features.
            Build faster, ship less, analyze smarter.
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
              href="#why-philjs"
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
              Why PhilJS?
            </a>
          </div>
          
          {/* Stats */}
          <div style="
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            max-width: 600px;
            margin: 0 auto;
          ">
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-brand);">&lt;50KB</div>
              <div style="color: var(--color-text-secondary); font-size: 0.875rem;">Core bundle</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-brand);">0ms</div>
              <div style="color: var(--color-text-secondary); font-size: 0.875rem;">Hydration</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-brand);">100</div>
              <div style="color: var(--color-text-secondary); font-size: 0.875rem;">Lighthouse</div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section style="padding: 4rem 0; background: var(--color-bg-alt);">
        <div class="container" style="max-width: 900px;">
          <CodeBlock code={exampleCode} language="tsx" />
        </div>
      </section>

      {/* Comparison Section */}
      <section style="padding: 6rem 0; background: var(--color-bg);">
        <div class="container" style="max-width: 1000px;">
          <h2 style="
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            Why Choose PhilJS?
          </h2>
          <p style="
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 1.125rem;
            margin-bottom: 3rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">
            See how PhilJS compares to other popular frameworks
          </p>

          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 4rem;
          ">
            {[
              { label: 'Bundle Size', philjs: '< 50KB', others: '~150KB+', better: true },
              { label: 'Hydration Time', philjs: '0ms', others: '100-500ms', better: true },
              { label: 'Learning Curve', philjs: 'Simple', others: 'Moderate', better: true },
              { label: 'TypeScript', philjs: 'Built-in', others: 'Optional', better: true },
            ].map(item => (
              <div style="
                padding: 1.5rem;
                background: var(--color-bg-alt);
                border: 1px solid var(--color-border);
                border-radius: 12px;
                transition: all var(--transition-base);
              "
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
              >
                <div style="
                  font-size: 0.875rem;
                  font-weight: 600;
                  color: var(--color-text-secondary);
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 0.75rem;
                ">
                  {item.label}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-brand);">
                      {item.philjs}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--color-text-tertiary);">PhilJS</div>
                  </div>
                  <div style="color: var(--color-text-tertiary);">vs</div>
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text-secondary);">
                      {item.others}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--color-text-tertiary);">Others</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="why-philjs" style="padding: 6rem 0; background: var(--color-bg-alt);">
        <div class="container">
          <h2 style="
            font-size: 3rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1rem;
          ">
            Novel Features
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
            Industry-first capabilities that set PhilJS apart from traditional frameworks
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
                ">
                  {feature.description}
                </p>

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

      {/* CTA Section */}
      <section id="get-started" style="
        padding: 6rem 0;
        background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
        color: white;
        text-align: center;
      ">
        <div class="container">
          <h2 style="font-size: 3rem; font-weight: 700; margin-bottom: 1.5rem;">
            Ready to build?
          </h2>
          <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
            Install PhilJS and start building modern web applications in minutes.
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
            <code>pnpm create philjs my-app</code>
          </div>
          
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
          >
            Read the Docs →
          </button>
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
                The framework that thinks ahead
              </p>
            </div>
            
            <div>
              <h3 style="font-weight: 600; margin-bottom: 1rem;">Documentation</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="#get-started" style="color: var(--color-text-secondary); font-size: 0.875rem;">Getting Started</a>
                <a href="#why-philjs" style="color: var(--color-text-secondary); font-size: 0.875rem;">Features</a>
                <a href="https://github.com/yourusername/philjs/tree/main/examples" style="color: var(--color-text-secondary); font-size: 0.875rem;" target="_blank" rel="noopener">Examples</a>
              </div>
            </div>

            <div>
              <h3 style="font-weight: 600; margin-bottom: 1rem;">Community</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="https://github.com/yourusername/philjs" style="color: var(--color-text-secondary); font-size: 0.875rem;" target="_blank" rel="noopener">GitHub</a>
                <a href="https://discord.gg/philjs" style="color: var(--color-text-secondary); font-size: 0.875rem;" target="_blank" rel="noopener">Discord</a>
                <a href="https://twitter.com/philjs" style="color: var(--color-text-secondary); font-size: 0.875rem;" target="_blank" rel="noopener">Twitter</a>
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
            © 2025 PhilJS. MIT License.
          </div>
        </div>
      </footer>
    </div>
  );
}
