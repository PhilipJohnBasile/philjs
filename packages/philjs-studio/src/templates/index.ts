import type { StudioSchema, SerializedComponent } from '../serialization/export';

// ============================================================================
// Types
// ============================================================================

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;
  schema: StudioSchema;
}

export type TemplateCategory = 'landing' | 'dashboard' | 'form' | 'blog' | 'ecommerce' | 'custom';

// ============================================================================
// Utility Functions
// ============================================================================

const createComponent = (
  id: string,
  type: string,
  name: string,
  options: {
    props?: Record<string, unknown>;
    styles?: Record<string, unknown>;
    children?: string[];
    parentId?: string | null;
    bounds: { x: number; y: number; width: number; height: number };
  }
): SerializedComponent => ({
  id,
  type,
  name,
  props: options.props || {},
  styles: { base: options.styles || {} },
  events: [],
  children: options.children || [],
  parentId: options.parentId ?? null,
  bounds: options.bounds,
  isLocked: false,
  isVisible: true,
});

// ============================================================================
// Landing Page Template
// ============================================================================

const landingPageComponents: SerializedComponent[] = [
  // Hero Section
  createComponent('hero-container', 'Container', 'Hero Section', {
    styles: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: { top: 80, right: 40, bottom: 80, left: 40 },
      backgroundColor: '#F8FAFC',
    },
    children: ['hero-heading', 'hero-subtext', 'hero-cta'],
    bounds: { x: 0, y: 0, width: 1200, height: 500 },
  }),
  createComponent('hero-heading', 'Heading', 'Hero Heading', {
    props: { children: 'Build Amazing Products', level: 1 },
    styles: {
      typography: { fontSize: 56, fontWeight: 800, textAlign: 'center' },
      color: '#0F172A',
    },
    parentId: 'hero-container',
    bounds: { x: 100, y: 150, width: 1000, height: 70 },
  }),
  createComponent('hero-subtext', 'Text', 'Hero Subtext', {
    props: { children: 'Create stunning user interfaces with our powerful visual builder. No coding required.' },
    styles: {
      typography: { fontSize: 20, textAlign: 'center' },
      color: '#64748B',
      maxWidth: '600px',
    },
    parentId: 'hero-container',
    bounds: { x: 300, y: 240, width: 600, height: 60 },
  }),
  createComponent('hero-cta', 'Button', 'Get Started Button', {
    props: { children: 'Get Started Free', variant: 'primary' },
    styles: {
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      padding: { top: 16, right: 32, bottom: 16, left: 32 },
      borderRadius: 8,
      typography: { fontSize: 18, fontWeight: 600 },
    },
    parentId: 'hero-container',
    bounds: { x: 480, y: 340, width: 240, height: 56 },
  }),

  // Features Section
  createComponent('features-container', 'Container', 'Features Section', {
    styles: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: { top: 80, right: 40, bottom: 80, left: 40 },
      backgroundColor: '#FFFFFF',
    },
    children: ['features-heading', 'features-grid'],
    bounds: { x: 0, y: 500, width: 1200, height: 500 },
  }),
  createComponent('features-heading', 'Heading', 'Features Heading', {
    props: { children: 'Powerful Features', level: 2 },
    styles: {
      typography: { fontSize: 40, fontWeight: 700, textAlign: 'center' },
      color: '#0F172A',
    },
    parentId: 'features-container',
    bounds: { x: 350, y: 550, width: 500, height: 50 },
  }),
  createComponent('features-grid', 'Container', 'Features Grid', {
    styles: {
      display: 'grid',
      gap: 32,
    },
    children: ['feature-1', 'feature-2', 'feature-3'],
    parentId: 'features-container',
    bounds: { x: 100, y: 630, width: 1000, height: 300 },
  }),
  createComponent('feature-1', 'Card', 'Feature Card 1', {
    props: { title: 'Drag & Drop' },
    styles: {
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    parentId: 'features-grid',
    bounds: { x: 100, y: 630, width: 300, height: 200 },
  }),
  createComponent('feature-2', 'Card', 'Feature Card 2', {
    props: { title: 'Live Preview' },
    styles: {
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    parentId: 'features-grid',
    bounds: { x: 450, y: 630, width: 300, height: 200 },
  }),
  createComponent('feature-3', 'Card', 'Feature Card 3', {
    props: { title: 'Export Code' },
    styles: {
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    parentId: 'features-grid',
    bounds: { x: 800, y: 630, width: 300, height: 200 },
  }),
];

const landingPageTemplate: Template = {
  id: 'landing-page',
  name: 'Landing Page',
  description: 'A modern landing page with hero section, features, and call-to-action',
  category: 'landing',
  schema: {
    version: '1.0.0',
    name: 'Landing Page',
    description: 'Modern landing page template',
    components: landingPageComponents,
    rootIds: ['hero-container', 'features-container'],
    canvas: { width: 1200, height: 1000 },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

// ============================================================================
// Dashboard Template
// ============================================================================

const dashboardComponents: SerializedComponent[] = [
  // Sidebar
  createComponent('sidebar', 'Container', 'Sidebar', {
    styles: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1E293B',
      padding: { top: 24, right: 16, bottom: 24, left: 16 },
    },
    children: ['sidebar-logo', 'sidebar-nav'],
    bounds: { x: 0, y: 0, width: 240, height: 800 },
  }),
  createComponent('sidebar-logo', 'Heading', 'Logo', {
    props: { children: 'Dashboard', level: 4 },
    styles: {
      color: '#FFFFFF',
      typography: { fontWeight: 700 },
      padding: { top: 0, right: 0, bottom: 24, left: 0 },
    },
    parentId: 'sidebar',
    bounds: { x: 16, y: 24, width: 208, height: 40 },
  }),
  createComponent('sidebar-nav', 'Container', 'Navigation', {
    styles: { display: 'flex', flexDirection: 'column', gap: 8 },
    children: ['nav-home', 'nav-analytics', 'nav-settings'],
    parentId: 'sidebar',
    bounds: { x: 16, y: 88, width: 208, height: 200 },
  }),
  createComponent('nav-home', 'Button', 'Home', {
    props: { children: 'Home', variant: 'ghost' },
    styles: { color: '#FFFFFF', justifyContent: 'flex-start' },
    parentId: 'sidebar-nav',
    bounds: { x: 16, y: 88, width: 208, height: 40 },
  }),
  createComponent('nav-analytics', 'Button', 'Analytics', {
    props: { children: 'Analytics', variant: 'ghost' },
    styles: { color: '#94A3B8', justifyContent: 'flex-start' },
    parentId: 'sidebar-nav',
    bounds: { x: 16, y: 136, width: 208, height: 40 },
  }),
  createComponent('nav-settings', 'Button', 'Settings', {
    props: { children: 'Settings', variant: 'ghost' },
    styles: { color: '#94A3B8', justifyContent: 'flex-start' },
    parentId: 'sidebar-nav',
    bounds: { x: 16, y: 184, width: 208, height: 40 },
  }),

  // Main Content
  createComponent('main-content', 'Container', 'Main Content', {
    styles: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F1F5F9',
      padding: { top: 32, right: 32, bottom: 32, left: 32 },
    },
    children: ['header', 'stats-grid', 'chart-section'],
    bounds: { x: 240, y: 0, width: 960, height: 800 },
  }),
  createComponent('header', 'Container', 'Header', {
    styles: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: { top: 0, right: 0, bottom: 24, left: 0 },
    },
    children: ['header-title', 'header-actions'],
    parentId: 'main-content',
    bounds: { x: 272, y: 32, width: 896, height: 60 },
  }),
  createComponent('header-title', 'Heading', 'Page Title', {
    props: { children: 'Overview', level: 2 },
    styles: {
      typography: { fontSize: 28, fontWeight: 700 },
      color: '#0F172A',
    },
    parentId: 'header',
    bounds: { x: 272, y: 32, width: 200, height: 40 },
  }),
  createComponent('header-actions', 'Button', 'Add New', {
    props: { children: '+ Add New', variant: 'primary' },
    styles: {
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      borderRadius: 8,
    },
    parentId: 'header',
    bounds: { x: 1032, y: 32, width: 136, height: 40 },
  }),

  // Stats Grid
  createComponent('stats-grid', 'Container', 'Stats Grid', {
    styles: { display: 'flex', gap: 24 },
    children: ['stat-1', 'stat-2', 'stat-3', 'stat-4'],
    parentId: 'main-content',
    bounds: { x: 272, y: 116, width: 896, height: 120 },
  }),
  createComponent('stat-1', 'Card', 'Total Users', {
    props: { title: 'Total Users' },
    styles: {
      backgroundColor: '#FFFFFF',
      padding: { top: 20, right: 24, bottom: 20, left: 24 },
      borderRadius: 12,
    },
    parentId: 'stats-grid',
    bounds: { x: 272, y: 116, width: 200, height: 100 },
  }),
  createComponent('stat-2', 'Card', 'Revenue', {
    props: { title: 'Revenue' },
    styles: {
      backgroundColor: '#FFFFFF',
      padding: { top: 20, right: 24, bottom: 20, left: 24 },
      borderRadius: 12,
    },
    parentId: 'stats-grid',
    bounds: { x: 496, y: 116, width: 200, height: 100 },
  }),
  createComponent('stat-3', 'Card', 'Orders', {
    props: { title: 'Orders' },
    styles: {
      backgroundColor: '#FFFFFF',
      padding: { top: 20, right: 24, bottom: 20, left: 24 },
      borderRadius: 12,
    },
    parentId: 'stats-grid',
    bounds: { x: 720, y: 116, width: 200, height: 100 },
  }),
  createComponent('stat-4', 'Card', 'Conversion', {
    props: { title: 'Conversion' },
    styles: {
      backgroundColor: '#FFFFFF',
      padding: { top: 20, right: 24, bottom: 20, left: 24 },
      borderRadius: 12,
    },
    parentId: 'stats-grid',
    bounds: { x: 944, y: 116, width: 200, height: 100 },
  }),

  // Chart Section
  createComponent('chart-section', 'Card', 'Chart', {
    props: { title: 'Analytics Overview' },
    styles: {
      backgroundColor: '#FFFFFF',
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      borderRadius: 12,
    },
    parentId: 'main-content',
    bounds: { x: 272, y: 260, width: 896, height: 400 },
  }),
];

const dashboardTemplate: Template = {
  id: 'dashboard',
  name: 'Dashboard',
  description: 'An admin dashboard with sidebar navigation, stats cards, and chart area',
  category: 'dashboard',
  schema: {
    version: '1.0.0',
    name: 'Dashboard',
    description: 'Admin dashboard template',
    components: dashboardComponents,
    rootIds: ['sidebar', 'main-content'],
    canvas: { width: 1200, height: 800 },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

// ============================================================================
// Form Template
// ============================================================================

const formComponents: SerializedComponent[] = [
  createComponent('form-container', 'Container', 'Form Container', {
    styles: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: { top: 48, right: 24, bottom: 48, left: 24 },
      backgroundColor: '#F8FAFC',
    },
    children: ['form-card'],
    bounds: { x: 0, y: 0, width: 600, height: 700 },
  }),
  createComponent('form-card', 'Card', 'Form Card', {
    props: { title: 'Create Account' },
    styles: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      backgroundColor: '#FFFFFF',
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      borderRadius: 16,
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      width: '100%',
      maxWidth: '440px',
    },
    children: ['form-title', 'form-fields', 'form-submit', 'form-footer'],
    parentId: 'form-container',
    bounds: { x: 80, y: 80, width: 440, height: 540 },
  }),
  createComponent('form-title', 'Heading', 'Form Title', {
    props: { children: 'Create Account', level: 2 },
    styles: {
      typography: { fontSize: 28, fontWeight: 700, textAlign: 'center' },
      color: '#0F172A',
    },
    parentId: 'form-card',
    bounds: { x: 120, y: 120, width: 360, height: 40 },
  }),
  createComponent('form-fields', 'Container', 'Form Fields', {
    styles: { display: 'flex', flexDirection: 'column', gap: 16 },
    children: ['field-name', 'field-email', 'field-password'],
    parentId: 'form-card',
    bounds: { x: 120, y: 180, width: 360, height: 200 },
  }),
  createComponent('field-name', 'Input', 'Name Input', {
    props: { placeholder: 'Full Name', type: 'text' },
    styles: {
      padding: { top: 14, right: 16, bottom: 14, left: 16 },
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    parentId: 'form-fields',
    bounds: { x: 120, y: 180, width: 360, height: 48 },
  }),
  createComponent('field-email', 'Input', 'Email Input', {
    props: { placeholder: 'Email Address', type: 'email' },
    styles: {
      padding: { top: 14, right: 16, bottom: 14, left: 16 },
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    parentId: 'form-fields',
    bounds: { x: 120, y: 244, width: 360, height: 48 },
  }),
  createComponent('field-password', 'Input', 'Password Input', {
    props: { placeholder: 'Password', type: 'password' },
    styles: {
      padding: { top: 14, right: 16, bottom: 14, left: 16 },
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    parentId: 'form-fields',
    bounds: { x: 120, y: 308, width: 360, height: 48 },
  }),
  createComponent('form-submit', 'Button', 'Submit Button', {
    props: { children: 'Create Account', variant: 'primary' },
    styles: {
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      padding: { top: 16, right: 24, bottom: 16, left: 24 },
      borderRadius: 8,
      typography: { fontSize: 16, fontWeight: 600 },
    },
    parentId: 'form-card',
    bounds: { x: 120, y: 420, width: 360, height: 52 },
  }),
  createComponent('form-footer', 'Text', 'Form Footer', {
    props: { children: 'Already have an account? Sign in' },
    styles: {
      typography: { fontSize: 14, textAlign: 'center' },
      color: '#64748B',
    },
    parentId: 'form-card',
    bounds: { x: 120, y: 490, width: 360, height: 24 },
  }),
];

const formTemplate: Template = {
  id: 'form',
  name: 'Sign Up Form',
  description: 'A clean sign-up form with email and password fields',
  category: 'form',
  schema: {
    version: '1.0.0',
    name: 'Sign Up Form',
    description: 'Sign up form template',
    components: formComponents,
    rootIds: ['form-container'],
    canvas: { width: 600, height: 700 },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

// ============================================================================
// Blog Template
// ============================================================================

const blogComponents: SerializedComponent[] = [
  // Header
  createComponent('blog-header', 'Container', 'Blog Header', {
    styles: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: { top: 20, right: 48, bottom: 20, left: 48 },
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderStyle: 'solid',
      borderColor: '#E5E7EB',
    },
    children: ['blog-logo', 'blog-nav'],
    bounds: { x: 0, y: 0, width: 960, height: 72 },
  }),
  createComponent('blog-logo', 'Heading', 'Blog Logo', {
    props: { children: 'My Blog', level: 4 },
    styles: {
      typography: { fontSize: 24, fontWeight: 700 },
      color: '#0F172A',
    },
    parentId: 'blog-header',
    bounds: { x: 48, y: 20, width: 120, height: 32 },
  }),
  createComponent('blog-nav', 'Container', 'Navigation', {
    styles: { display: 'flex', gap: 24 },
    children: ['nav-home-link', 'nav-about-link', 'nav-contact-link'],
    parentId: 'blog-header',
    bounds: { x: 700, y: 20, width: 212, height: 32 },
  }),
  createComponent('nav-home-link', 'Text', 'Home Link', {
    props: { children: 'Home' },
    styles: { color: '#3B82F6', typography: { fontWeight: 500 } },
    parentId: 'blog-nav',
    bounds: { x: 700, y: 20, width: 50, height: 32 },
  }),
  createComponent('nav-about-link', 'Text', 'About Link', {
    props: { children: 'About' },
    styles: { color: '#64748B', typography: { fontWeight: 500 } },
    parentId: 'blog-nav',
    bounds: { x: 774, y: 20, width: 50, height: 32 },
  }),
  createComponent('nav-contact-link', 'Text', 'Contact Link', {
    props: { children: 'Contact' },
    styles: { color: '#64748B', typography: { fontWeight: 500 } },
    parentId: 'blog-nav',
    bounds: { x: 848, y: 20, width: 64, height: 32 },
  }),

  // Main Content
  createComponent('blog-main', 'Container', 'Main Content', {
    styles: {
      display: 'flex',
      flexDirection: 'column',
      padding: { top: 48, right: 48, bottom: 48, left: 48 },
      maxWidth: '720px',
      margin: '0 auto',
    },
    children: ['article'],
    bounds: { x: 120, y: 72, width: 720, height: 700 },
  }),
  createComponent('article', 'Container', 'Article', {
    styles: { display: 'flex', flexDirection: 'column', gap: 24 },
    children: ['article-image', 'article-meta', 'article-title', 'article-content'],
    parentId: 'blog-main',
    bounds: { x: 168, y: 120, width: 624, height: 600 },
  }),
  createComponent('article-image', 'Image', 'Featured Image', {
    props: { alt: 'Featured image' },
    styles: { borderRadius: 16, width: '100%', height: 360 },
    parentId: 'article',
    bounds: { x: 168, y: 120, width: 624, height: 360 },
  }),
  createComponent('article-meta', 'Text', 'Article Meta', {
    props: { children: 'December 24, 2024 · 5 min read' },
    styles: {
      color: '#94A3B8',
      typography: { fontSize: 14 },
    },
    parentId: 'article',
    bounds: { x: 168, y: 504, width: 624, height: 20 },
  }),
  createComponent('article-title', 'Heading', 'Article Title', {
    props: { children: 'How to Build Better User Interfaces', level: 1 },
    styles: {
      typography: { fontSize: 36, fontWeight: 700, lineHeight: 1.3 },
      color: '#0F172A',
    },
    parentId: 'article',
    bounds: { x: 168, y: 540, width: 624, height: 50 },
  }),
  createComponent('article-content', 'Text', 'Article Content', {
    props: {
      children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    },
    styles: {
      typography: { fontSize: 18, lineHeight: 1.8 },
      color: '#475569',
    },
    parentId: 'article',
    bounds: { x: 168, y: 606, width: 624, height: 100 },
  }),
];

const blogTemplate: Template = {
  id: 'blog',
  name: 'Blog Post',
  description: 'A clean blog post layout with header, featured image, and article content',
  category: 'blog',
  schema: {
    version: '1.0.0',
    name: 'Blog Post',
    description: 'Blog post template',
    components: blogComponents,
    rootIds: ['blog-header', 'blog-main'],
    canvas: { width: 960, height: 800 },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

// ============================================================================
// Template Registry
// ============================================================================

export const templates: Template[] = [
  landingPageTemplate,
  dashboardTemplate,
  formTemplate,
  blogTemplate,
];

export const getTemplateById = (id: string): Template | undefined => {
  return templates.find((t) => t.id === id);
};

export const getTemplatesByCategory = (category: TemplateCategory): Template[] => {
  return templates.filter((t) => t.category === category);
};

export const cloneTemplateSchema = (template: Template): StudioSchema => {
  // Deep clone and generate new IDs
  const idMap = new Map<string, string>();

  const clonedComponents = template.schema.components.map((comp) => {
    const newId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    idMap.set(comp.id, newId);
    return { ...comp, id: newId };
  });

  // Remap parent and children references
  for (const comp of clonedComponents) {
    if (comp.parentId) {
      comp.parentId = idMap.get(comp.parentId) || comp.parentId;
    }
    comp.children = comp.children.map((childId) => idMap.get(childId) || childId);
  }

  const clonedRootIds = template.schema.rootIds.map((id) => idMap.get(id) || id);

  return {
    ...template.schema,
    components: clonedComponents,
    rootIds: clonedRootIds,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};

export default templates;
