import { Metadata } from 'next';
import { Playground } from '@/components/Playground';

export const metadata: Metadata = {
  title: 'Interactive Playground',
  description: 'Try PhilJS in your browser with our interactive playground. Write TypeScript or Rust code and see it run in real-time.',
};

export default function PlaygroundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Interactive Playground
        </h1>
        <p className="text-lg text-surface-600 dark:text-surface-400">
          Experiment with PhilJS code in your browser. Choose from example templates or write your own code.
        </p>
      </div>

      <Playground />

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            TypeScript or Rust
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Toggle between TypeScript and Rust to see the same concepts in both languages.
          </p>
        </div>

        <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            Real-Time Preview
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            See your changes instantly with hot reloading in the preview panel.
          </p>
        </div>

        <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            Share Your Code
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Generate shareable links to your playground sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
