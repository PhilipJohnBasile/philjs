/**
 * PhilJS Plugin Registry
 *
 * Directory of official and community plugins.
 */

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  homepage?: string;
  keywords: string[];
  downloads: number;
  stars: number;
  category: PluginCategory;
  official: boolean;
  verified: boolean;
}

export type PluginCategory =
  | 'analytics'
  | 'auth'
  | 'cms'
  | 'database'
  | 'deployment'
  | 'devtools'
  | 'forms'
  | 'i18n'
  | 'monitoring'
  | 'payments'
  | 'seo'
  | 'styling'
  | 'testing'
  | 'ui'
  | 'utilities'
  | 'other';

// Official plugins registry
const officialPlugins: PluginInfo[] = [
  {
    name: '@philjs/auth',
    version: '0.1.0',
    description: 'Authentication for PhilJS - supports OAuth, JWT, sessions',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['auth', 'authentication', 'oauth', 'jwt', 'sessions'],
    downloads: 0,
    stars: 0,
    category: 'auth',
    official: true,
    verified: true,
  },
  {
    name: '@philjs/analytics',
    version: '0.1.0',
    description: 'Analytics integrations for PhilJS - Google Analytics, Plausible, etc.',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['analytics', 'tracking', 'google-analytics', 'plausible'],
    downloads: 0,
    stars: 0,
    category: 'analytics',
    official: true,
    verified: true,
  },
  {
    name: '@philjs/prisma',
    version: '0.1.0',
    description: 'Prisma ORM integration for PhilJS',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['database', 'orm', 'prisma', 'sql'],
    downloads: 0,
    stars: 0,
    category: 'database',
    official: true,
    verified: true,
  },
  {
    name: '@philjs/drizzle',
    version: '0.1.0',
    description: 'Drizzle ORM integration for PhilJS',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['database', 'orm', 'drizzle', 'sql'],
    downloads: 0,
    stars: 0,
    category: 'database',
    official: true,
    verified: true,
  },
  {
    name: '@philjs/supabase',
    version: '0.1.0',
    description: 'Supabase integration for PhilJS',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['database', 'supabase', 'auth', 'storage'],
    downloads: 0,
    stars: 0,
    category: 'database',
    official: true,
    verified: true,
  },
  {
    name: '@philjs/stripe',
    version: '0.1.0',
    description: 'Stripe payments integration for PhilJS',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['payments', 'stripe', 'subscriptions', 'checkout'],
    downloads: 0,
    stars: 0,
    category: 'payments',
    official: true,
    verified: true,
  },
  {
    name: '@philjs/content',
    version: '0.1.0',
    description: 'Content management for PhilJS - Markdown, MDX, content collections',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['cms', 'content', 'markdown', 'mdx'],
    downloads: 0,
    stars: 0,
    category: 'cms',
    official: true,
    verified: true,
  },
  {
    name: '@philjs/seo',
    version: '0.1.0',
    description: 'SEO utilities for PhilJS - meta tags, sitemap, robots.txt',
    author: 'PhilJS Team',
    repository: 'https://github.com/philjs/philjs',
    keywords: ['seo', 'meta', 'sitemap', 'opengraph'],
    downloads: 0,
    stars: 0,
    category: 'seo',
    official: true,
    verified: true,
  },
];

/**
 * Plugin Registry class
 */
export class PluginRegistry {
  private plugins: Map<string, PluginInfo> = new Map();
  private baseUrl: string;

  constructor(baseUrl = 'https://registry.philjs.dev') {
    this.baseUrl = baseUrl;

    // Load official plugins
    for (const plugin of officialPlugins) {
      this.plugins.set(plugin.name, plugin);
    }
  }

  /**
   * Get all plugins
   */
  getAll(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  get(name: string): PluginInfo | undefined {
    return this.plugins.get(name);
  }

  /**
   * Search plugins
   */
  search(query: string): PluginInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description.toLowerCase().includes(lowerQuery) ||
        plugin.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get plugins by category
   */
  getByCategory(category: PluginCategory): PluginInfo[] {
    return this.getAll().filter((plugin) => plugin.category === category);
  }

  /**
   * Get official plugins
   */
  getOfficial(): PluginInfo[] {
    return this.getAll().filter((plugin) => plugin.official);
  }

  /**
   * Get verified plugins
   */
  getVerified(): PluginInfo[] {
    return this.getAll().filter((plugin) => plugin.verified);
  }

  /**
   * Fetch latest plugin info from registry
   */
  async fetch(name: string): Promise<PluginInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/plugins/${encodeURIComponent(name)}`);
      if (!response.ok) return null;
      const data = await response.json();
      this.plugins.set(name, data);
      return data;
    } catch {
      return this.get(name) || null;
    }
  }

  /**
   * Refresh registry from remote
   */
  async refresh(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/plugins`);
      if (!response.ok) return;
      const data: PluginInfo[] = await response.json();
      for (const plugin of data) {
        this.plugins.set(plugin.name, plugin);
      }
    } catch {
      // Use cached plugins
    }
  }
}

// Default registry instance
const defaultRegistry = new PluginRegistry();

/**
 * Fetch plugin info
 */
export async function fetchPluginInfo(name: string): Promise<PluginInfo | null> {
  return defaultRegistry.fetch(name);
}

/**
 * Search plugins
 */
export function searchPlugins(query: string): PluginInfo[] {
  return defaultRegistry.search(query);
}

/**
 * Get plugins by category
 */
export function getPluginsByCategory(category: PluginCategory): PluginInfo[] {
  return defaultRegistry.getByCategory(category);
}

/**
 * Get all plugin categories
 */
export function getPluginCategories(): PluginCategory[] {
  return [
    'analytics',
    'auth',
    'cms',
    'database',
    'deployment',
    'devtools',
    'forms',
    'i18n',
    'monitoring',
    'payments',
    'seo',
    'styling',
    'testing',
    'ui',
    'utilities',
    'other',
  ];
}

export default PluginRegistry;
