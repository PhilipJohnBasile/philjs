import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Example Gallery',
  description: 'Explore example PhilJS applications with source code and live demos.',
};

interface Example {
  title: string;
  description: string;
  image: string;
  demoUrl?: string;
  repoUrl: string;
  features: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

const examples: Example[] = [
  {
    title: 'Todo App',
    description: 'Classic todo application with local storage persistence, filtering, and animations.',
    image: '/examples/todo-app.png',
    demoUrl: 'https://philjs-todo.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/todo-app',
    difficulty: 'beginner',
    features: [
      'Signal-based state management',
      'Local storage persistence',
      'Filter todos by status',
      'Mark as complete/incomplete',
      'Delete todos',
      'Smooth animations',
    ],
    tags: ['signals', 'effects', 'localStorage'],
  },
  {
    title: 'Real-time Chat',
    description: 'Multi-room chat application with WebSocket support and user presence.',
    image: '/examples/chat-app.png',
    demoUrl: 'https://philjs-chat.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/chat-app',
    difficulty: 'intermediate',
    features: [
      'WebSocket connections',
      'Real-time messaging',
      'Multiple chat rooms',
      'User presence indicators',
      'Typing indicators',
      'Message history',
    ],
    tags: ['websockets', 'real-time', 'stores'],
  },
  {
    title: 'E-commerce Store',
    description: 'Full-featured e-commerce application with cart, checkout, and product catalog.',
    image: '/examples/ecommerce.png',
    demoUrl: 'https://philjs-store.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/ecommerce',
    difficulty: 'advanced',
    features: [
      'Product catalog with search',
      'Shopping cart management',
      'Checkout flow',
      'User authentication',
      'Order history',
      'Payment integration',
    ],
    tags: ['router', 'ssr', 'forms', 'authentication'],
  },
  {
    title: 'Analytics Dashboard',
    description: 'Data visualization dashboard with charts, metrics, and real-time updates.',
    image: '/examples/dashboard.png',
    demoUrl: 'https://philjs-dashboard.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/dashboard',
    difficulty: 'intermediate',
    features: [
      'Interactive charts (Chart.js)',
      'Real-time data updates',
      'Multiple data sources',
      'Responsive layout',
      'Export functionality',
      'Dark mode',
    ],
    tags: ['charts', 'data-visualization', 'resources'],
  },
  {
    title: 'Markdown Editor',
    description: 'Real-time markdown editor with preview, syntax highlighting, and export.',
    image: '/examples/markdown-editor.png',
    demoUrl: 'https://philjs-markdown.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/markdown-editor',
    difficulty: 'beginner',
    features: [
      'Live markdown preview',
      'Syntax highlighting',
      'Export to HTML/PDF',
      'Auto-save to localStorage',
      'Multiple documents',
      'Keyboard shortcuts',
    ],
    tags: ['editor', 'markdown', 'localStorage'],
  },
  {
    title: 'Kanban Board',
    description: 'Drag-and-drop kanban board for project management with multiple boards.',
    image: '/examples/kanban.png',
    demoUrl: 'https://philjs-kanban.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/kanban',
    difficulty: 'intermediate',
    features: [
      'Drag-and-drop cards',
      'Multiple boards',
      'Card details and comments',
      'Due dates and labels',
      'Search and filter',
      'Responsive design',
    ],
    tags: ['drag-and-drop', 'stores', 'complex-state'],
  },
  {
    title: 'Weather App',
    description: 'Weather forecast application with geolocation and multiple city support.',
    image: '/examples/weather.png',
    demoUrl: 'https://philjs-weather.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/weather',
    difficulty: 'beginner',
    features: [
      'Current weather data',
      '7-day forecast',
      'Geolocation support',
      'Multiple cities',
      'Weather icons',
      'Unit conversion',
    ],
    tags: ['api', 'resources', 'geolocation'],
  },
  {
    title: 'Rust Full-Stack Blog',
    description: 'Full-stack blog built with PhilJS Rust, Axum, and PostgreSQL.',
    image: '/examples/rust-blog.png',
    demoUrl: 'https://philjs-rust-blog.fly.dev',
    repoUrl: 'https://github.com/philjs/examples/tree/main/rust-blog',
    difficulty: 'advanced',
    features: [
      'Rust backend with Axum',
      'PostgreSQL database',
      'Server-side rendering',
      'Markdown posts',
      'Comments system',
      'Admin panel',
    ],
    tags: ['rust', 'axum', 'ssr', 'database'],
  },
  {
    title: 'Music Player',
    description: 'Audio player with playlists, visualizer, and media session API.',
    image: '/examples/music-player.png',
    demoUrl: 'https://philjs-music.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/music-player',
    difficulty: 'intermediate',
    features: [
      'Audio playback controls',
      'Playlist management',
      'Audio visualizer',
      'Media session API',
      'Keyboard shortcuts',
      'Progress tracking',
    ],
    tags: ['audio', 'media-api', 'effects'],
  },
  {
    title: 'Recipe Book',
    description: 'Recipe management app with search, categories, and shopping lists.',
    image: '/examples/recipe-book.png',
    demoUrl: 'https://philjs-recipes.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/recipe-book',
    difficulty: 'beginner',
    features: [
      'Recipe CRUD operations',
      'Search and filter',
      'Categories and tags',
      'Shopping list generator',
      'Serving size calculator',
      'Print-friendly view',
    ],
    tags: ['crud', 'search', 'forms'],
  },
  {
    title: 'Video Conference',
    description: 'WebRTC-based video conferencing with screen sharing and chat.',
    image: '/examples/video-conference.png',
    demoUrl: 'https://philjs-meet.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/video-conference',
    difficulty: 'advanced',
    features: [
      'WebRTC peer connections',
      'Video and audio calls',
      'Screen sharing',
      'Real-time chat',
      'Multiple participants',
      'Recording (optional)',
    ],
    tags: ['webrtc', 'real-time', 'media'],
  },
  {
    title: 'Social Media Feed',
    description: 'Infinite-scrolling social feed with likes, comments, and user profiles.',
    image: '/examples/social-feed.png',
    demoUrl: 'https://philjs-social.vercel.app',
    repoUrl: 'https://github.com/philjs/examples/tree/main/social-feed',
    difficulty: 'advanced',
    features: [
      'Infinite scroll',
      'Optimistic updates',
      'Like and comment',
      'User profiles',
      'Image uploads',
      'Real-time notifications',
    ],
    tags: ['infinite-scroll', 'optimistic-ui', 'ssr'],
  },
];

function ExampleCard({ example }: { example: Example }) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400">
        {/* Placeholder for example image */}
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
            {example.title}
          </h3>
          <span className={`px-2 py-1 text-xs rounded capitalize ${difficultyColors[example.difficulty]}`}>
            {example.difficulty}
          </span>
        </div>

        <p className="text-surface-600 dark:text-surface-400 mb-4">
          {example.description}
        </p>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">
            Features
          </h4>
          <ul className="text-sm text-surface-600 dark:text-surface-400 space-y-1">
            {example.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <svg className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
            {example.features.length > 3 && (
              <li className="text-xs text-surface-500">
                +{example.features.length - 3} more features
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {example.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          {example.demoUrl && (
            <a
              href={example.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center text-sm font-medium"
            >
              Live Demo
            </a>
          )}
          <a
            href={example.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-center text-sm font-medium"
          >
            View Code
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ExamplesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-4">
          Example Gallery
        </h1>
        <p className="text-xl text-surface-600 dark:text-surface-400 max-w-3xl">
          Explore real-world PhilJS applications with complete source code. Learn patterns
          and best practices from production-ready examples.
        </p>
      </div>

      <Callout type="info" title="All Examples Include">
        Complete source code, deployment configurations, tests, and detailed README
        documentation. Perfect for learning and starting new projects!
      </Callout>

      {/* Filter buttons could go here */}
      <div className="mb-8 flex gap-2 flex-wrap">
        <button className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg font-medium">
          All Examples
        </button>
        <button className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">
          Beginner
        </button>
        <button className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">
          Intermediate
        </button>
        <button className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">
          Advanced
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {examples.map((example) => (
          <ExampleCard key={example.title} example={example} />
        ))}
      </div>

      <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Running Examples Locally
        </h2>

        <p className="text-surface-600 dark:text-surface-400 mb-4">
          Clone any example and run it locally:
        </p>

        <Terminal commands={[
          'git clone https://github.com/philjs/examples.git',
          'cd examples/todo-app',
          'npm install',
          'npm run dev',
        ]} />

        <p className="text-surface-600 dark:text-surface-400 mt-4">
          Most examples use Vite for development and support hot module replacement.
        </p>
      </div>

      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">
          Want to Contribute an Example?
        </h2>
        <p className="mb-6 opacity-90">
          Have you built something cool with PhilJS? Share it with the community!
          We're always looking for new examples showcasing different use cases and patterns.
        </p>
        <a
          href="https://github.com/philjs/examples/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-surface-100 transition-colors"
        >
          Contribution Guidelines
        </a>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Link
          href="/docs/tutorials/building-a-todo-app"
          className="block p-6 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            Build a Todo App
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Step-by-step tutorial for beginners
          </p>
        </Link>

        <Link
          href="/docs/tutorials/building-a-dashboard"
          className="block p-6 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            Build a Dashboard
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Learn data visualization and charts
          </p>
        </Link>

        <Link
          href="/docs/tutorials/rust-fullstack"
          className="block p-6 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
            Rust Full-Stack
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Build with PhilJS and Rust
          </p>
        </Link>
      </div>
    </div>
  );
}
