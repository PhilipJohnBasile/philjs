'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Code2, Boxes, Sparkles, Gauge } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';

const features = [
  {
    icon: Zap,
    title: 'Fine-Grained Reactivity',
    description: 'Signals-based reactivity with automatic dependency tracking. Only the parts that change get updated.',
  },
  {
    icon: Shield,
    title: 'TypeScript First',
    description: 'Built from the ground up with TypeScript. Full type inference for components, routes, and forms.',
  },
  {
    icon: Code2,
    title: 'JSX You Know',
    description: 'Familiar JSX syntax with powerful enhancements. Works with your existing mental model.',
  },
  {
    icon: Boxes,
    title: 'Optional Rust Integration',
    description: 'Compile to WebAssembly with cargo-philjs for maximum performance. Same components, more speed.',
  },
  {
    icon: Sparkles,
    title: 'Islands Architecture',
    description: 'Ship minimal JavaScript. Hydrate only interactive components for lightning-fast pages.',
  },
  {
    icon: Gauge,
    title: 'Developer Experience',
    description: 'Hot Module Replacement, DevTools, comprehensive error messages. Built for productivity.',
  },
];

const exampleCode = `import { signal, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);

  effect(() => {
    console.log('Count is now:', count());
  });

  return (
    <button onClick={() => count.set(c => c + 1)}>
      Clicks: {count}
    </button>
  );
}`;

const rustExampleCode = `use philjs::prelude::*;

#[component]
fn Counter() -> Element {
    let count = use_signal(|| 0);

    view! {
        <button on:click=move |_| count.set(|c| c + 1)>
            "Clicks: " {count}
        </button>
    }
}`;

export default function HomePage() {
  return (
    <main className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-950/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-surface-900 dark:text-white">
              Build faster with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                PhilJS
              </span>
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto">
              A modern web framework with fine-grained reactivity, TypeScript-first APIs,
              and optional Rust integration for maximum performance.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs/getting-started/installation"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/playground"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-surface-900 dark:text-white bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                Try Playground
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-surface-500 dark:text-surface-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                v2.0 Released
              </span>
              <span>MIT License</span>
              <a
                href="https://github.com/philjs/philjs"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                GitHub
              </a>
            </div>
          </motion.div>

          {/* Code Examples */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 grid lg:grid-cols-2 gap-6"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl blur opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 bg-surface-900 rounded-t-lg border-b border-surface-700">
                  <span className="text-sm text-surface-400">TypeScript</span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                <CodeBlock code={exampleCode} language="typescript" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl blur opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 bg-surface-900 rounded-t-lg border-b border-surface-700">
                  <span className="text-sm text-surface-400">Rust (Optional)</span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                <CodeBlock code={rustExampleCode} language="rust" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface-50 dark:bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
              A complete toolkit for building modern web applications
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-surface-600 dark:text-surface-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Install Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-8">
              Get started in seconds
            </h2>

            <div className="bg-surface-900 rounded-lg p-4 text-left">
              <pre className="text-surface-100 font-mono text-sm overflow-x-auto">
                <span className="text-surface-500"># Create a new PhilJS project</span>
                {'\n'}
                <span className="text-green-400">$</span> npm create philjs@latest my-app
                {'\n\n'}
                <span className="text-surface-500"># Or with Rust support</span>
                {'\n'}
                <span className="text-green-400">$</span> cargo philjs new my-app
              </pre>
            </div>

            <div className="mt-12 grid sm:grid-cols-3 gap-6">
              <Link
                href="/docs/getting-started/installation"
                className="p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
                  Installation
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Set up PhilJS in your project
                </p>
              </Link>

              <Link
                href="/docs/core-concepts/signals"
                className="p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
                  Learn Signals
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Understand the reactivity model
                </p>
              </Link>

              <Link
                href="/docs/guides/ssr"
                className="p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
                  SSR Guide
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Server-side rendering setup
                </p>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 dark:border-surface-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-surface-900 dark:text-white">PhilJS</span>
              </div>
              <p className="text-surface-600 dark:text-surface-400 max-w-md">
                A modern web framework built for performance and developer experience.
                Open source under the MIT license.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Documentation</h4>
              <ul className="space-y-2 text-surface-600 dark:text-surface-400">
                <li><Link href="/docs/getting-started/installation" className="hover:text-primary-600">Getting Started</Link></li>
                <li><Link href="/docs/core-concepts/signals" className="hover:text-primary-600">Core Concepts</Link></li>
                <li><Link href="/docs/api/core" className="hover:text-primary-600">API Reference</Link></li>
                <li><Link href="/docs/rust/quickstart" className="hover:text-primary-600">Rust Guide</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Community</h4>
              <ul className="space-y-2 text-surface-600 dark:text-surface-400">
                <li><a href="https://github.com/philjs/philjs" className="hover:text-primary-600">GitHub</a></li>
                <li><a href="https://discord.gg/philjs" className="hover:text-primary-600">Discord</a></li>
                <li><a href="https://twitter.com/philjsdev" className="hover:text-primary-600">Twitter</a></li>
                <li><Link href="/playground" className="hover:text-primary-600">Playground</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 text-center text-surface-500 dark:text-surface-400 text-sm">
            <p>&copy; {new Date().getFullYear()} PhilJS Team. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
