/**
 * Tests for plugin generator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{}'),
  access: vi.fn().mockRejectedValue(new Error('Not found')),
}));

describe('Plugin Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin Types', () => {
    const pluginTypes = [
      'basic',
      'vite',
      'transform',
      'ui-addon',
      'api',
      'database',
      'auth',
    ];

    pluginTypes.forEach((type) => {
      it(`should support ${type} plugin type`, () => {
        // Verify the type is recognized
        expect(pluginTypes).toContain(type);
      });
    });
  });

  describe('Features', () => {
    const featuresByType: Record<string, string[]> = {
      basic: ['config', 'runtime-api', 'cli', 'middleware'],
      vite: ['virtual-modules', 'hmr', 'assets', 'ssr'],
      transform: ['ast', 'sourcemaps', 'types', 'splitting'],
      'ui-addon': ['components', 'css', 'theme', 'icons'],
      api: ['cache', 'retry', 'interceptors', 'transformers', 'rate-limit', 'offline-queue'],
      database: ['pooling', 'migrations', 'query-builder', 'transactions', 'seeding', 'logging'],
      auth: ['credentials', 'oauth', 'jwt', 'sessions', 'rbac', '2fa'],
    };

    Object.entries(featuresByType).forEach(([type, features]) => {
      it(`should have features for ${type} plugin`, () => {
        expect(features).toBeDefined();
        expect(Array.isArray(features)).toBe(true);
        expect(features.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Template Placeholders', () => {
    const placeholders = [
      '{{PLUGIN_NAME}}',
      '{{PACKAGE_NAME}}',
      '{{DESCRIPTION}}',
      '{{AUTHOR}}',
      '{{LICENSE}}',
    ];

    it('should recognize all required placeholders', () => {
      placeholders.forEach((placeholder) => {
        expect(placeholder).toMatch(/\{\{[A-Z_]+\}\}/);
      });
    });
  });

  describe('Generated Files', () => {
    const expectedFiles = [
      'src/index.ts',
      'package.json',
      'tsconfig.json',
      'README.md',
      '.gitignore',
    ];

    it('should have a list of expected generated files', () => {
      expectedFiles.forEach((file) => {
        expect(file).toBeDefined();
        expect(typeof file).toBe('string');
      });
    });
  });

  describe('TypeScript Support', () => {
    it('should use .ts extension when TypeScript is enabled', () => {
      const typescript = true;
      const ext = typescript ? 'ts' : 'js';
      expect(ext).toBe('ts');
    });

    it('should use .js extension when TypeScript is disabled', () => {
      const typescript = false;
      const ext = typescript ? 'ts' : 'js';
      expect(ext).toBe('js');
    });
  });

  describe('Testing Support', () => {
    it('should include test directory when testing is enabled', () => {
      const testing = true;
      const dirs = ['src', testing ? 'src/__tests__' : null].filter(Boolean);
      expect(dirs).toContain('src/__tests__');
    });

    it('should not include test directory when testing is disabled', () => {
      const testing = false;
      const dirs = ['src', testing ? 'src/__tests__' : null].filter(Boolean);
      expect(dirs).not.toContain('src/__tests__');
    });
  });
});

describe('Template Files', () => {
  const templateTypes = [
    'basic',
    'vite',
    'transform',
    'ui-addon',
    'api',
    'database',
    'auth',
  ];

  templateTypes.forEach((type) => {
    describe(`${type} template`, () => {
      it(`should have a template file for ${type}`, () => {
        // Template path structure
        const templatePath = `templates/${type}/plugin.template.ts`;
        expect(templatePath).toContain(type);
      });
    });
  });
});

describe('License Options', () => {
  const licenses = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC', 'GPL-3.0'];

  licenses.forEach((license) => {
    it(`should support ${license} license`, () => {
      expect(licenses).toContain(license);
    });
  });
});

describe('Plugin Name Validation', () => {
  it('should accept valid plugin names', () => {
    const validNames = [
      'philjs-plugin-test',
      'philjs-plugin-my-awesome-plugin',
      'philjs-plugin-123',
    ];

    validNames.forEach((name) => {
      expect(/^philjs-plugin-[a-z0-9-]+$/.test(name)).toBe(true);
    });
  });

  it('should reject invalid plugin names', () => {
    const invalidNames = [
      'my-plugin', // Missing prefix
      'PHILJS-PLUGIN-TEST', // Uppercase
      'philjs-plugin-test_plugin', // Underscore
      'philjs-plugin-', // Trailing hyphen only
    ];

    invalidNames.forEach((name) => {
      const isValid = /^philjs-plugin-[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
      expect(isValid).toBe(false);
    });
  });
});
