/**
 * Template System - Save and load design templates
 */

import { signal } from '@philjs/core';
import type {
  ComponentNode,
  NodeId,
  DocumentMetadata,
  SerializedDocument,
} from '../types.js';
import { generateId } from '../state/store.js';

// ============================================================================
// Types
// ============================================================================

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  author?: string;
  tags: string[];
  nodes: Record<NodeId, ComponentNode>;
  rootId: NodeId;
  metadata?: Record<string, any>;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface TemplateManagerOptions {
  storage?: 'localStorage' | 'indexedDB' | 'none';
  storageKey?: string;
  onSave?: (template: Template) => void | Promise<void>;
  onLoad?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
}

export interface TemplateManager {
  templates: ReturnType<typeof signal<Template[]>>;
  categories: ReturnType<typeof signal<TemplateCategory[]>>;
  saveTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<Template>;
  loadTemplate: (templateId: string) => Template | undefined;
  deleteTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => Template | undefined;
  duplicateTemplate: (templateId: string, newName?: string) => Template | undefined;
  exportTemplate: (templateId: string) => string;
  importTemplate: (json: string) => Template | undefined;
  getTemplatesByCategory: (categoryId: string) => Template[];
  searchTemplates: (query: string) => Template[];
  addCategory: (category: TemplateCategory) => void;
  removeCategory: (categoryId: string) => void;
  clearAllTemplates: () => void;
}

// ============================================================================
// Default Templates
// ============================================================================

export const defaultCategories: TemplateCategory[] = [
  { id: 'landing', name: 'Landing Pages', description: 'Full page landing templates', icon: 'layout' },
  { id: 'dashboard', name: 'Dashboards', description: 'Admin and analytics dashboards', icon: 'grid' },
  { id: 'forms', name: 'Forms', description: 'Form layouts and patterns', icon: 'edit' },
  { id: 'cards', name: 'Cards', description: 'Card layouts and components', icon: 'credit-card' },
  { id: 'navigation', name: 'Navigation', description: 'Headers, footers, and navbars', icon: 'navigation' },
  { id: 'hero', name: 'Hero Sections', description: 'Hero and banner sections', icon: 'image' },
  { id: 'content', name: 'Content Blocks', description: 'Text and content sections', icon: 'align-left' },
  { id: 'custom', name: 'Custom', description: 'User-created templates', icon: 'star' },
];

export const builtInTemplates: Template[] = [
  {
    id: 'template_hero_centered',
    name: 'Centered Hero',
    description: 'A centered hero section with heading, text, and call-to-action buttons',
    category: 'hero',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'PhilJS',
    tags: ['hero', 'centered', 'cta'],
    rootId: 'root',
    nodes: {
      'root': {
        id: 'root',
        type: 'Frame',
        name: 'Hero Section',
        props: {},
        styles: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { value: 80, unit: 'px' },
          backgroundColor: '#f8fafc',
          textAlign: 'center',
          minHeight: { value: 400, unit: 'px' },
        },
        children: ['heading', 'description', 'buttons'],
        parentId: null,
        events: [],
      },
      'heading': {
        id: 'heading',
        type: 'Heading',
        name: 'Hero Heading',
        props: { content: 'Welcome to Our Platform', level: 'h1' },
        styles: {
          fontSize: { value: 48, unit: 'px' },
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: { value: 16, unit: 'px' },
        },
        children: [],
        parentId: 'root',
        events: [],
      },
      'description': {
        id: 'description',
        type: 'Paragraph',
        name: 'Hero Description',
        props: { content: 'Build amazing experiences with our powerful platform. Get started in minutes and scale to millions.' },
        styles: {
          fontSize: { value: 18, unit: 'px' },
          color: '#64748b',
          maxWidth: { value: 600, unit: 'px' },
          marginBottom: { value: 32, unit: 'px' },
        },
        children: [],
        parentId: 'root',
        events: [],
      },
      'buttons': {
        id: 'buttons',
        type: 'HStack',
        name: 'Button Group',
        props: {},
        styles: {
          display: 'flex',
          gap: { value: 16, unit: 'px' },
        },
        children: ['primaryBtn', 'secondaryBtn'],
        parentId: 'root',
        events: [],
      },
      'primaryBtn': {
        id: 'primaryBtn',
        type: 'Button',
        name: 'Primary Button',
        props: { label: 'Get Started', variant: 'primary' },
        styles: {
          padding: { value: 16, unit: 'px' },
          paddingLeft: { value: 32, unit: 'px' },
          paddingRight: { value: 32, unit: 'px' },
          backgroundColor: '#2563eb',
          color: '#ffffff',
          borderRadius: { value: 8, unit: 'px' },
          fontWeight: 600,
        },
        children: [],
        parentId: 'buttons',
        events: [],
      },
      'secondaryBtn': {
        id: 'secondaryBtn',
        type: 'Button',
        name: 'Secondary Button',
        props: { label: 'Learn More', variant: 'outline' },
        styles: {
          padding: { value: 16, unit: 'px' },
          paddingLeft: { value: 32, unit: 'px' },
          paddingRight: { value: 32, unit: 'px' },
          backgroundColor: 'transparent',
          color: '#2563eb',
          border: '2px solid #2563eb',
          borderRadius: { value: 8, unit: 'px' },
          fontWeight: 600,
        },
        children: [],
        parentId: 'buttons',
        events: [],
      },
    },
  },
  {
    id: 'template_card_basic',
    name: 'Basic Card',
    description: 'A basic card with image, title, and description',
    category: 'cards',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'PhilJS',
    tags: ['card', 'basic', 'image'],
    rootId: 'root',
    nodes: {
      'root': {
        id: 'root',
        type: 'Card',
        name: 'Basic Card',
        props: { elevation: 'md' },
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: { value: 12, unit: 'px' },
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          maxWidth: { value: 320, unit: 'px' },
        },
        children: ['cardImage', 'cardContent'],
        parentId: null,
        events: [],
      },
      'cardImage': {
        id: 'cardImage',
        type: 'Image',
        name: 'Card Image',
        props: { src: 'https://via.placeholder.com/320x180', alt: 'Card image' },
        styles: {
          width: { value: 100, unit: '%' },
          height: { value: 180, unit: 'px' },
          objectFit: 'cover',
        },
        children: [],
        parentId: 'root',
        events: [],
      },
      'cardContent': {
        id: 'cardContent',
        type: 'Stack',
        name: 'Card Content',
        props: {},
        styles: {
          display: 'flex',
          flexDirection: 'column',
          padding: { value: 16, unit: 'px' },
          gap: { value: 8, unit: 'px' },
        },
        children: ['cardTitle', 'cardDesc'],
        parentId: 'root',
        events: [],
      },
      'cardTitle': {
        id: 'cardTitle',
        type: 'Heading',
        name: 'Card Title',
        props: { content: 'Card Title', level: 'h3' },
        styles: {
          fontSize: { value: 18, unit: 'px' },
          fontWeight: 600,
          color: '#1e293b',
          margin: { value: 0, unit: 'px' },
        },
        children: [],
        parentId: 'cardContent',
        events: [],
      },
      'cardDesc': {
        id: 'cardDesc',
        type: 'Paragraph',
        name: 'Card Description',
        props: { content: 'This is a brief description of the card content. It can span multiple lines.' },
        styles: {
          fontSize: { value: 14, unit: 'px' },
          color: '#64748b',
          margin: { value: 0, unit: 'px' },
        },
        children: [],
        parentId: 'cardContent',
        events: [],
      },
    },
  },
  {
    id: 'template_form_login',
    name: 'Login Form',
    description: 'A simple login form with email and password fields',
    category: 'forms',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'PhilJS',
    tags: ['form', 'login', 'authentication'],
    rootId: 'root',
    nodes: {
      'root': {
        id: 'root',
        type: 'Card',
        name: 'Login Form',
        props: {},
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: { value: 12, unit: 'px' },
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: { value: 32, unit: 'px' },
          maxWidth: { value: 400, unit: 'px' },
          width: { value: 100, unit: '%' },
        },
        children: ['formTitle', 'form'],
        parentId: null,
        events: [],
      },
      'formTitle': {
        id: 'formTitle',
        type: 'Heading',
        name: 'Form Title',
        props: { content: 'Sign In', level: 'h2' },
        styles: {
          fontSize: { value: 24, unit: 'px' },
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: { value: 24, unit: 'px' },
          textAlign: 'center',
        },
        children: [],
        parentId: 'root',
        events: [],
      },
      'form': {
        id: 'form',
        type: 'Form',
        name: 'Form',
        props: {},
        styles: {
          display: 'flex',
          flexDirection: 'column',
          gap: { value: 16, unit: 'px' },
        },
        children: ['emailField', 'passwordField', 'submitBtn'],
        parentId: 'root',
        events: [],
      },
      'emailField': {
        id: 'emailField',
        type: 'FormField',
        name: 'Email Field',
        props: { label: 'Email' },
        styles: {
          display: 'flex',
          flexDirection: 'column',
          gap: { value: 4, unit: 'px' },
        },
        children: ['emailLabel', 'emailInput'],
        parentId: 'form',
        events: [],
      },
      'emailLabel': {
        id: 'emailLabel',
        type: 'Label',
        name: 'Email Label',
        props: { content: 'Email' },
        styles: {
          fontSize: { value: 14, unit: 'px' },
          fontWeight: 500,
          color: '#374151',
        },
        children: [],
        parentId: 'emailField',
        events: [],
      },
      'emailInput': {
        id: 'emailInput',
        type: 'Input',
        name: 'Email Input',
        props: { type: 'email', placeholder: 'you@example.com' },
        styles: {
          padding: { value: 12, unit: 'px' },
          border: '1px solid #d1d5db',
          borderRadius: { value: 8, unit: 'px' },
          fontSize: { value: 14, unit: 'px' },
        },
        children: [],
        parentId: 'emailField',
        events: [],
      },
      'passwordField': {
        id: 'passwordField',
        type: 'FormField',
        name: 'Password Field',
        props: { label: 'Password' },
        styles: {
          display: 'flex',
          flexDirection: 'column',
          gap: { value: 4, unit: 'px' },
        },
        children: ['passwordLabel', 'passwordInput'],
        parentId: 'form',
        events: [],
      },
      'passwordLabel': {
        id: 'passwordLabel',
        type: 'Label',
        name: 'Password Label',
        props: { content: 'Password' },
        styles: {
          fontSize: { value: 14, unit: 'px' },
          fontWeight: 500,
          color: '#374151',
        },
        children: [],
        parentId: 'passwordField',
        events: [],
      },
      'passwordInput': {
        id: 'passwordInput',
        type: 'Input',
        name: 'Password Input',
        props: { type: 'password', placeholder: 'Enter your password' },
        styles: {
          padding: { value: 12, unit: 'px' },
          border: '1px solid #d1d5db',
          borderRadius: { value: 8, unit: 'px' },
          fontSize: { value: 14, unit: 'px' },
        },
        children: [],
        parentId: 'passwordField',
        events: [],
      },
      'submitBtn': {
        id: 'submitBtn',
        type: 'Button',
        name: 'Submit Button',
        props: { label: 'Sign In', type: 'submit', fullWidth: true },
        styles: {
          width: { value: 100, unit: '%' },
          padding: { value: 12, unit: 'px' },
          backgroundColor: '#2563eb',
          color: '#ffffff',
          borderRadius: { value: 8, unit: 'px' },
          fontWeight: 600,
          marginTop: { value: 8, unit: 'px' },
        },
        children: [],
        parentId: 'form',
        events: [],
      },
    },
  },
];

// ============================================================================
// Template Manager Implementation
// ============================================================================

/**
 * Create a template manager
 */
export function createTemplateManager(options: TemplateManagerOptions = {}): TemplateManager {
  const {
    storage = 'localStorage',
    storageKey = 'philjs_builder_templates',
    onSave,
    onLoad,
    onDelete,
  } = options;

  // Initialize signals
  const templates = signal<Template[]>([...builtInTemplates]);
  const categories = signal<TemplateCategory[]>([...defaultCategories]);

  // Load from storage
  if (storage === 'localStorage' && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          templates.set([...builtInTemplates, ...parsed]);
        }
      }
    } catch (e) {
      console.error('Failed to load templates from localStorage:', e);
    }
  }

  // Save to storage
  const persistTemplates = () => {
    if (storage === 'localStorage' && typeof window !== 'undefined') {
      try {
        // Only save custom templates, not built-in ones
        const customTemplates = templates().filter(t => !builtInTemplates.some(bt => bt.id === t.id));
        localStorage.setItem(storageKey, JSON.stringify(customTemplates));
      } catch (e) {
        console.error('Failed to save templates to localStorage:', e);
      }
    }
  };

  /**
   * Save a new template
   */
  const saveTemplate = async (
    template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Template> => {
    const newTemplate: Template = {
      ...template,
      id: `template_${generateId()}`,
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    templates.set([...templates(), newTemplate]);
    persistTemplates();

    if (onSave) {
      await onSave(newTemplate);
    }

    return newTemplate;
  };

  /**
   * Load a template by ID
   */
  const loadTemplate = (templateId: string): Template | undefined => {
    const template = templates().find(t => t.id === templateId);
    if (template && onLoad) {
      onLoad(template);
    }
    return template;
  };

  /**
   * Delete a template
   */
  const deleteTemplate = (templateId: string): void => {
    // Don't allow deleting built-in templates
    if (builtInTemplates.some(t => t.id === templateId)) {
      console.warn('Cannot delete built-in templates');
      return;
    }

    templates.set(templates().filter(t => t.id !== templateId));
    persistTemplates();

    if (onDelete) {
      onDelete(templateId);
    }
  };

  /**
   * Update an existing template
   */
  const updateTemplate = (templateId: string, updates: Partial<Template>): Template | undefined => {
    const index = templates().findIndex(t => t.id === templateId);
    if (index === -1) return undefined;

    const existing = templates()[index]!;

    // Build the updated template, preserving optional properties correctly
    const updatedTemplate: Template = {
      id: templateId, // Ensure ID doesn't change
      name: updates.name ?? existing.name,
      category: updates.category ?? existing.category,
      version: updates.version ?? existing.version,
      createdAt: updates.createdAt ?? existing.createdAt,
      updatedAt: Date.now(),
      tags: updates.tags ?? existing.tags,
      nodes: updates.nodes ?? existing.nodes,
      rootId: updates.rootId ?? existing.rootId,
    };

    // Handle optional properties - only add if they have a value
    const description = 'description' in updates ? updates.description : existing.description;
    if (description !== undefined) {
      updatedTemplate.description = description;
    }

    const thumbnail = 'thumbnail' in updates ? updates.thumbnail : existing.thumbnail;
    if (thumbnail !== undefined) {
      updatedTemplate.thumbnail = thumbnail;
    }

    const author = 'author' in updates ? updates.author : existing.author;
    if (author !== undefined) {
      updatedTemplate.author = author;
    }

    const metadata = 'metadata' in updates ? updates.metadata : existing.metadata;
    if (metadata !== undefined) {
      updatedTemplate.metadata = metadata;
    }

    const newTemplates = [...templates()];
    newTemplates[index] = updatedTemplate;
    templates.set(newTemplates);
    persistTemplates();

    return updatedTemplate;
  };

  /**
   * Duplicate a template
   */
  const duplicateTemplate = (templateId: string, newName?: string): Template | undefined => {
    const original = templates().find(t => t.id === templateId);
    if (!original) return undefined;

    // Deep clone nodes with new IDs
    const nodeIdMap = new Map<NodeId, NodeId>();
    const clonedNodes: Record<NodeId, ComponentNode> = {};

    // First pass: create new IDs
    for (const nodeId of Object.keys(original.nodes)) {
      const newId = `node_${generateId()}`;
      nodeIdMap.set(nodeId, newId);
    }

    // Second pass: clone nodes with updated references
    for (const [oldId, node] of Object.entries(original.nodes)) {
      const newId = nodeIdMap.get(oldId)!;
      clonedNodes[newId] = {
        ...node,
        id: newId,
        parentId: node.parentId ? nodeIdMap.get(node.parentId) || null : null,
        children: node.children.map(childId => nodeIdMap.get(childId) || childId),
      };
    }

    const newRootId = nodeIdMap.get(original.rootId)!;

    const duplicatedTemplate: Template = {
      ...original,
      id: `template_${generateId()}`,
      name: newName || `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: clonedNodes,
      rootId: newRootId,
    };

    templates.set([...templates(), duplicatedTemplate]);
    persistTemplates();

    return duplicatedTemplate;
  };

  /**
   * Export a template as JSON string
   */
  const exportTemplate = (templateId: string): string => {
    const template = templates().find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return JSON.stringify({
      type: 'philjs-builder-template',
      version: '1.0',
      exportedAt: Date.now(),
      template,
    }, null, 2);
  };

  /**
   * Import a template from JSON string
   */
  const importTemplate = (json: string): Template | undefined => {
    try {
      const data = JSON.parse(json);

      if (data.type !== 'philjs-builder-template') {
        console.error('Invalid template format');
        return undefined;
      }

      const imported = data.template as Template;

      // Create new template with fresh IDs
      const newTemplate: Template = {
        ...imported,
        id: `template_${generateId()}`,
        name: `${imported.name} (Imported)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      templates.set([...templates(), newTemplate]);
      persistTemplates();

      return newTemplate;
    } catch (e) {
      console.error('Failed to import template:', e);
      return undefined;
    }
  };

  /**
   * Get templates by category
   */
  const getTemplatesByCategory = (categoryId: string): Template[] => {
    return templates().filter(t => t.category === categoryId);
  };

  /**
   * Search templates
   */
  const searchTemplates = (query: string): Template[] => {
    const lowerQuery = query.toLowerCase();
    return templates().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  /**
   * Add a category
   */
  const addCategory = (category: TemplateCategory): void => {
    if (categories().some(c => c.id === category.id)) {
      console.warn(`Category ${category.id} already exists`);
      return;
    }
    categories.set([...categories(), category]);
  };

  /**
   * Remove a category
   */
  const removeCategory = (categoryId: string): void => {
    // Don't allow removing default categories
    if (defaultCategories.some(c => c.id === categoryId)) {
      console.warn('Cannot remove default categories');
      return;
    }
    categories.set(categories().filter(c => c.id !== categoryId));
  };

  /**
   * Clear all custom templates
   */
  const clearAllTemplates = (): void => {
    templates.set([...builtInTemplates]);
    persistTemplates();
  };

  return {
    templates,
    categories,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    updateTemplate,
    duplicateTemplate,
    exportTemplate,
    importTemplate,
    getTemplatesByCategory,
    searchTemplates,
    addCategory,
    removeCategory,
    clearAllTemplates,
  };
}

/**
 * Apply a template to create nodes
 */
export function applyTemplate(
  template: Template,
  parentId: NodeId | null = null
): { nodes: Record<NodeId, ComponentNode>; rootId: NodeId } {
  // Deep clone nodes with new IDs
  const nodeIdMap = new Map<NodeId, NodeId>();
  const clonedNodes: Record<NodeId, ComponentNode> = {};

  // First pass: create new IDs
  for (const nodeId of Object.keys(template.nodes)) {
    const newId = `node_${generateId()}`;
    nodeIdMap.set(nodeId, newId);
  }

  // Second pass: clone nodes with updated references
  for (const [oldId, node] of Object.entries(template.nodes)) {
    const newId = nodeIdMap.get(oldId)!;
    const isRoot = oldId === template.rootId;

    clonedNodes[newId] = {
      ...node,
      id: newId,
      parentId: isRoot ? parentId : (node.parentId ? nodeIdMap.get(node.parentId) || null : null),
      children: node.children.map(childId => nodeIdMap.get(childId) || childId),
      props: { ...node.props },
      styles: { ...node.styles },
      events: [...node.events],
    };
  }

  const newRootId = nodeIdMap.get(template.rootId)!;

  return {
    nodes: clonedNodes,
    rootId: newRootId,
  };
}

export default {
  createTemplateManager,
  applyTemplate,
  defaultCategories,
  builtInTemplates,
};
