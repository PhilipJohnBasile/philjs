/**
 * PhilJS CLI - Store Generator
 *
 * Generate state stores with signals
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
import { toPascalCase, toCamelCase, toKebabCase } from './template-engine.js';

export interface StoreOptions {
  name: string;
  directory?: string;
  typescript?: boolean;
  withTest?: boolean;
}

/**
 * Generate a state store
 */
export async function generateStore(options: StoreOptions): Promise<string[]> {
  const {
    name,
    directory = 'src/stores',
    typescript = true,
    withTest = true,
  } = options;

  const storeName = toKebabCase(name);
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const ext = typescript ? 'ts' : 'js';
  const storeDir = path.join(process.cwd(), directory);
  const createdFiles: string[] = [];

  // Create directory
  await fs.mkdir(storeDir, { recursive: true });

  // Generate store file
  const storeContent = generateStoreTemplate(storeName, pascalName, camelName, typescript);
  const storePath = path.join(storeDir, `${storeName}.${ext}`);
  await fs.writeFile(storePath, storeContent);
  createdFiles.push(storePath);
  console.log(pc.green(`  + Created ${storeName}.${ext}`));

  // Generate test file
  if (withTest) {
    const testContent = generateTestTemplate(storeName, pascalName, camelName, typescript);
    const testPath = path.join(storeDir, `${storeName}.test.${ext}`);
    await fs.writeFile(testPath, testContent);
    createdFiles.push(testPath);
    console.log(pc.green(`  + Created ${storeName}.test.${ext}`));
  }

  // Update index file
  await updateIndexFile(storeDir, storeName, camelName, typescript);

  return createdFiles;
}

function generateStoreTemplate(
  storeName: string,
  pascalName: string,
  camelName: string,
  typescript: boolean
): string {
  const stateType = typescript
    ? `\nexport interface ${pascalName}State {\n  items: ${pascalName}Item[];\n  selectedId: string | null;\n  loading: boolean;\n  error: string | null;\n}\n`
    : '';

  const itemType = typescript
    ? `\nexport interface ${pascalName}Item {\n  id: string;\n  name: string;\n  // Add more fields as needed\n}\n`
    : '';

  return `/**
 * ${pascalName} Store
 *
 * Centralized state management using PhilJS signals.
 */

import { signal, computed, effect } from 'philjs-core';
${itemType}${stateType}
const initialState${typescript ? `: ${pascalName}State` : ''} = {
  items: [],
  selectedId: null,
  loading: false,
  error: null,
};

// Private state signal
const state = signal${typescript ? `<${pascalName}State>` : ''}(initialState);

/**
 * ${pascalName} Store
 *
 * Usage:
 *   import { ${camelName}Store } from '@/stores/${storeName}';
 *
 *   // Read state
 *   const items = ${camelName}Store.items;
 *
 *   // Perform actions
 *   ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
 */
export const ${camelName}Store = {
  // ============================================
  // State Accessors (Reactive)
  // ============================================

  /** Get all items */
  get items()${typescript ? `: ${pascalName}Item[]` : ''} {
    return state.get().items;
  },

  /** Get currently selected item ID */
  get selectedId()${typescript ? `: string | null` : ''} {
    return state.get().selectedId;
  },

  /** Get loading state */
  get loading()${typescript ? `: boolean` : ''} {
    return state.get().loading;
  },

  /** Get error message */
  get error()${typescript ? `: string | null` : ''} {
    return state.get().error;
  },

  // ============================================
  // Computed Values
  // ============================================

  /** Total number of items */
  itemCount: computed(() => state.get().items.length),

  /** Currently selected item */
  selectedItem: computed(() => {
    const { items, selectedId } = state.get();
    return items.find(item => item.id === selectedId) ?? null;
  }),

  /** Check if store has items */
  hasItems: computed(() => state.get().items.length > 0),

  // ============================================
  // Actions
  // ============================================

  /** Add a new item */
  addItem(item${typescript ? `: ${pascalName}Item` : ''}) {
    const current = state.get();
    state.set({
      ...current,
      items: [...current.items, item],
    });
  },

  /** Update an existing item */
  updateItem(id${typescript ? ': string' : ''}, updates${typescript ? `: Partial<${pascalName}Item>` : ''}) {
    const current = state.get();
    state.set({
      ...current,
      items: current.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  },

  /** Remove an item by ID */
  removeItem(id${typescript ? ': string' : ''}) {
    const current = state.get();
    state.set({
      ...current,
      items: current.items.filter(item => item.id !== id),
      selectedId: current.selectedId === id ? null : current.selectedId,
    });
  },

  /** Select an item by ID */
  selectItem(id${typescript ? ': string | null' : ''}) {
    const current = state.get();
    state.set({
      ...current,
      selectedId: id,
    });
  },

  /** Set loading state */
  setLoading(loading${typescript ? ': boolean' : ''}) {
    const current = state.get();
    state.set({
      ...current,
      loading,
      error: loading ? null : current.error,
    });
  },

  /** Set error message */
  setError(error${typescript ? ': string | null' : ''}) {
    const current = state.get();
    state.set({
      ...current,
      error,
      loading: false,
    });
  },

  /** Reset store to initial state */
  reset() {
    state.set(initialState);
  },

  // ============================================
  // Async Actions
  // ============================================

  /** Fetch items from API */
  async fetchItems() {
    this.setLoading(true);
    try {
      const response = await fetch('/api/${storeName}');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      state.set({
        ...state.get(),
        items: data.items || data,
        loading: false,
      });
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Unknown error');
    }
  },

  /** Create item via API */
  async createItem(item${typescript ? `: Omit<${pascalName}Item, 'id'>` : ''}) {
    this.setLoading(true);
    try {
      const response = await fetch('/api/${storeName}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to create');
      const created = await response.json();
      this.addItem(created);
      this.setLoading(false);
      return created;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  },

  /** Delete item via API */
  async deleteItem(id${typescript ? ': string' : ''}) {
    this.setLoading(true);
    try {
      const response = await fetch(\`/api/${storeName}/\${id}\`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      this.removeItem(id);
      this.setLoading(false);
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Unknown error');
    }
  },

  // ============================================
  // Subscribe to changes
  // ============================================

  /** Subscribe to state changes */
  subscribe(callback${typescript ? ': (state: ' + pascalName + 'State) => void' : ''}) {
    return effect(() => {
      callback(state.get());
    });
  },
};

// Optional: Debug logging in development
if (import.meta.env?.DEV) {
  ${camelName}Store.subscribe((state) => {
    console.log('[${pascalName}Store]', state);
  });
}
`;
}

function generateTestTemplate(
  storeName: string,
  pascalName: string,
  camelName: string,
  typescript: boolean
): string {
  return `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ${camelName}Store } from './${storeName}';

describe('${pascalName}Store', () => {
  beforeEach(() => {
    ${camelName}Store.reset();
    vi.resetAllMocks();
  });

  describe('state accessors', () => {
    it('starts with empty items', () => {
      expect(${camelName}Store.items).toEqual([]);
    });

    it('starts with no selection', () => {
      expect(${camelName}Store.selectedId).toBeNull();
    });

    it('starts with loading false', () => {
      expect(${camelName}Store.loading).toBe(false);
    });

    it('starts with no error', () => {
      expect(${camelName}Store.error).toBeNull();
    });
  });

  describe('computed values', () => {
    it('itemCount returns correct count', () => {
      expect(${camelName}Store.itemCount.get()).toBe(0);

      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
      expect(${camelName}Store.itemCount.get()).toBe(1);

      ${camelName}Store.addItem({ id: '2', name: 'Item 2' });
      expect(${camelName}Store.itemCount.get()).toBe(2);
    });

    it('selectedItem returns correct item', () => {
      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
      ${camelName}Store.addItem({ id: '2', name: 'Item 2' });

      expect(${camelName}Store.selectedItem.get()).toBeNull();

      ${camelName}Store.selectItem('2');
      expect(${camelName}Store.selectedItem.get()).toEqual({ id: '2', name: 'Item 2' });
    });

    it('hasItems returns correct boolean', () => {
      expect(${camelName}Store.hasItems.get()).toBe(false);

      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
      expect(${camelName}Store.hasItems.get()).toBe(true);
    });
  });

  describe('actions', () => {
    it('addItem adds an item', () => {
      ${camelName}Store.addItem({ id: '1', name: 'Test Item' });
      expect(${camelName}Store.items).toContainEqual({ id: '1', name: 'Test Item' });
    });

    it('updateItem updates an existing item', () => {
      ${camelName}Store.addItem({ id: '1', name: 'Original' });
      ${camelName}Store.updateItem('1', { name: 'Updated' });
      expect(${camelName}Store.items[0].name).toBe('Updated');
    });

    it('removeItem removes an item', () => {
      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
      ${camelName}Store.addItem({ id: '2', name: 'Item 2' });

      ${camelName}Store.removeItem('1');
      expect(${camelName}Store.items).toHaveLength(1);
      expect(${camelName}Store.items[0].id).toBe('2');
    });

    it('removeItem clears selection if removing selected item', () => {
      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
      ${camelName}Store.selectItem('1');

      ${camelName}Store.removeItem('1');
      expect(${camelName}Store.selectedId).toBeNull();
    });

    it('selectItem sets the selected ID', () => {
      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
      ${camelName}Store.selectItem('1');
      expect(${camelName}Store.selectedId).toBe('1');
    });

    it('setLoading sets loading state', () => {
      ${camelName}Store.setLoading(true);
      expect(${camelName}Store.loading).toBe(true);
    });

    it('setError sets error and clears loading', () => {
      ${camelName}Store.setLoading(true);
      ${camelName}Store.setError('Test error');

      expect(${camelName}Store.error).toBe('Test error');
      expect(${camelName}Store.loading).toBe(false);
    });

    it('reset restores initial state', () => {
      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });
      ${camelName}Store.selectItem('1');
      ${camelName}Store.setLoading(true);

      ${camelName}Store.reset();

      expect(${camelName}Store.items).toEqual([]);
      expect(${camelName}Store.selectedId).toBeNull();
      expect(${camelName}Store.loading).toBe(false);
    });
  });

  describe('async actions', () => {
    it('fetchItems fetches and stores items', async () => {
      const mockItems = [{ id: '1', name: 'Fetched Item' }];
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockItems),
      });

      await ${camelName}Store.fetchItems();

      expect(${camelName}Store.items).toEqual(mockItems);
      expect(${camelName}Store.loading).toBe(false);
    });

    it('fetchItems handles errors', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await ${camelName}Store.fetchItems();

      expect(${camelName}Store.error).toBe('Network error');
      expect(${camelName}Store.loading).toBe(false);
    });

    it('createItem creates and adds item', async () => {
      const newItem = { name: 'New Item' };
      const createdItem = { id: '1', name: 'New Item' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdItem),
      });

      const result = await ${camelName}Store.createItem(newItem);

      expect(result).toEqual(createdItem);
      expect(${camelName}Store.items).toContainEqual(createdItem);
    });

    it('deleteItem removes item from store', async () => {
      ${camelName}Store.addItem({ id: '1', name: 'Item 1' });

      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

      await ${camelName}Store.deleteItem('1');

      expect(${camelName}Store.items).toEqual([]);
    });
  });
});
`;
}

async function updateIndexFile(
  storeDir: string,
  storeName: string,
  camelName: string,
  typescript: boolean
): Promise<void> {
  const indexPath = path.join(storeDir, `index.${typescript ? 'ts' : 'js'}`);
  const exportLine = `export { ${camelName}Store } from './${storeName}';\n`;
  const typeExportLine = typescript
    ? `export type { ${toPascalCase(storeName)}State, ${toPascalCase(storeName)}Item } from './${storeName}';\n`
    : '';

  let existingContent = '';
  try {
    existingContent = await fs.readFile(indexPath, 'utf-8');
  } catch {
    // Index doesn't exist
  }

  let updated = false;
  if (!existingContent.includes(exportLine)) {
    existingContent += exportLine;
    updated = true;
  }
  if (typescript && typeExportLine && !existingContent.includes(typeExportLine)) {
    existingContent += typeExportLine;
    updated = true;
  }

  if (updated) {
    await fs.writeFile(indexPath, existingContent);
    console.log(pc.green(`  + Updated index.${typescript ? 'ts' : 'js'}`));
  }
}
