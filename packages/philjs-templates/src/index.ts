/**
 * PhilJS Templates
 *
 * Official starter templates for PhilJS applications.
 */

export interface Template {
  name: string;
  description: string;
  repo: string;
  tags: string[];
  features: string[];
  preview?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Official PhilJS templates
 */
export const templates: Template[] = [
  // Basic templates
  {
    name: 'basic',
    description: 'Minimal PhilJS starter - just the essentials',
    repo: 'philjs/templates/basic',
    tags: ['starter', 'minimal'],
    features: ['Signals', 'Components', 'Routing'],
    difficulty: 'beginner',
  },
  {
    name: 'typescript',
    description: 'PhilJS with full TypeScript support',
    repo: 'philjs/templates/typescript',
    tags: ['starter', 'typescript'],
    features: ['TypeScript', 'Signals', 'Components', 'Routing'],
    difficulty: 'beginner',
  },

  // Full-stack templates
  {
    name: 'full-stack',
    description: 'Full-stack PhilJS with API routes and database',
    repo: 'philjs/templates/full-stack',
    tags: ['full-stack', 'api', 'database'],
    features: ['API Routes', 'Prisma', 'Authentication', 'SSR'],
    difficulty: 'intermediate',
  },
  {
    name: 'saas-starter',
    description: 'SaaS template with auth, billing, and dashboard',
    repo: 'philjs/templates/saas-starter',
    tags: ['saas', 'business', 'dashboard'],
    features: ['Auth', 'Stripe', 'Dashboard', 'Teams', 'Billing'],
    difficulty: 'advanced',
  },

  // E-commerce templates
  {
    name: 'storefront',
    description: 'E-commerce storefront with cart and checkout',
    repo: 'philjs/templates/storefront',
    tags: ['ecommerce', 'store', 'shop'],
    features: ['Product catalog', 'Cart', 'Checkout', 'Stripe'],
    difficulty: 'intermediate',
  },

  // Blog templates
  {
    name: 'blog',
    description: 'Markdown blog with SSG and syntax highlighting',
    repo: 'philjs/templates/blog',
    tags: ['blog', 'content', 'markdown'],
    features: ['Markdown', 'SSG', 'Syntax highlighting', 'RSS'],
    difficulty: 'beginner',
  },
  {
    name: 'docs',
    description: 'Documentation site with search and versioning',
    repo: 'philjs/templates/docs',
    tags: ['docs', 'documentation'],
    features: ['MDX', 'Search', 'Versioning', 'Dark mode'],
    difficulty: 'intermediate',
  },

  // Portfolio templates
  {
    name: 'portfolio',
    description: 'Personal portfolio with projects showcase',
    repo: 'philjs/templates/portfolio',
    tags: ['portfolio', 'personal'],
    features: ['Projects', 'Blog', 'Contact form', 'Animations'],
    difficulty: 'beginner',
  },

  // Dashboard templates
  {
    name: 'dashboard',
    description: 'Admin dashboard with charts and tables',
    repo: 'philjs/templates/dashboard',
    tags: ['dashboard', 'admin'],
    features: ['Charts', 'Tables', 'Forms', 'Dark mode'],
    difficulty: 'intermediate',
  },

  // Real-time templates
  {
    name: 'realtime-chat',
    description: 'Real-time chat application with WebSockets',
    repo: 'philjs/templates/realtime-chat',
    tags: ['realtime', 'chat', 'websocket'],
    features: ['WebSockets', 'Rooms', 'Typing indicators', 'Presence'],
    difficulty: 'intermediate',
  },

  // Mobile-first templates
  {
    name: 'pwa',
    description: 'Progressive Web App with offline support',
    repo: 'philjs/templates/pwa',
    tags: ['pwa', 'mobile', 'offline'],
    features: ['Service Worker', 'Offline', 'Push notifications', 'Install prompt'],
    difficulty: 'intermediate',
  },

  // Landing pages
  {
    name: 'landing',
    description: 'Marketing landing page with animations',
    repo: 'philjs/templates/landing',
    tags: ['landing', 'marketing'],
    features: ['Hero', 'Features', 'Pricing', 'CTA', 'Animations'],
    difficulty: 'beginner',
  },

  // With specific integrations
  {
    name: 'with-tailwind',
    description: 'PhilJS with Tailwind CSS preconfigured',
    repo: 'philjs/templates/with-tailwind',
    tags: ['tailwind', 'styling'],
    features: ['Tailwind CSS', 'Dark mode', 'Typography plugin'],
    difficulty: 'beginner',
  },
  {
    name: 'with-supabase',
    description: 'PhilJS with Supabase for backend',
    repo: 'philjs/templates/with-supabase',
    tags: ['supabase', 'database', 'auth'],
    features: ['Supabase Auth', 'Database', 'Storage', 'Realtime'],
    difficulty: 'intermediate',
  },
  {
    name: 'with-stripe',
    description: 'PhilJS with Stripe payments',
    repo: 'philjs/templates/with-stripe',
    tags: ['stripe', 'payments'],
    features: ['Checkout', 'Subscriptions', 'Webhooks', 'Customer portal'],
    difficulty: 'intermediate',
  },
];

/**
 * Get all templates
 */
export function getTemplates(): Template[] {
  return templates;
}

/**
 * Get template by name
 */
export function getTemplate(name: string): Template | undefined {
  return templates.find(t => t.name === name);
}

/**
 * Search templates
 */
export function searchTemplates(query: string): Template[] {
  const q = query.toLowerCase();
  return templates.filter(t =>
    t.name.includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.includes(q)) ||
    t.features.some(f => f.toLowerCase().includes(q))
  );
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): Template[] {
  return templates.filter(t => t.tags.includes(tag));
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(difficulty: Template['difficulty']): Template[] {
  return templates.filter(t => t.difficulty === difficulty);
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  templates.forEach(t => t.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}
