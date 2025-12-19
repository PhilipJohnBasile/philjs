/**
 * PhilJS React Compatibility Layer
 *
 * This package provides a React-compatible API for PhilJS, making it easy to migrate
 * existing React applications to PhilJS with minimal code changes.
 *
 * @example
 * ```tsx
 * // Before (React)
 * import { useState, useEffect, useMemo } from 'react';
 *
 * // After (PhilJS with compat layer)
 * import { useState, useEffect, useMemo } from 'philjs-react-compat';
 *
 * // Or migrate to PhilJS patterns
 * import { signal, effect, memo } from 'philjs-core';
 * ```
 */

// Re-export all hooks
export * from './hooks/index.js';

// Re-export all components
export * from './components/index.js';

// Re-export core PhilJS primitives for gradual migration
export {
  signal,
  memo,
  effect,
  batch,
  untrack,
  onCleanup,
  createRoot,
  resource,
  type Signal,
  type Memo,
  type Resource,
  type EffectCleanup
} from 'philjs-core';

// Version and metadata
export const VERSION = '2.0.0';
export const COMPAT_VERSION = 'react@18.x';

/**
 * Check if running in compatibility mode.
 */
export function isCompatMode(): boolean {
  return true;
}

/**
 * Get compatibility warnings and suggestions.
 */
export function getCompatibilityReport(): {
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (process.env.NODE_ENV !== 'production') {
    suggestions.push(
      'Consider migrating to PhilJS native patterns for better performance:',
      '- Replace useState with signal()',
      '- Remove dependency arrays from useEffect and useMemo',
      '- Remove useCallback wrappers (unnecessary in PhilJS)',
      '- Remove React.memo wrappers (automatic in PhilJS)'
    );
  }

  return { warnings, suggestions };
}

/**
 * Migration helper to analyze React code and suggest PhilJS equivalents.
 */
export function analyzeMigration(componentSource: string): {
  patterns: {
    useState: number;
    useEffect: number;
    useMemo: number;
    useCallback: number;
    useRef: number;
    classComponents: number;
  };
  suggestions: string[];
} {
  const patterns = {
    useState: (componentSource.match(/useState/g) || []).length,
    useEffect: (componentSource.match(/useEffect/g) || []).length,
    useMemo: (componentSource.match(/useMemo/g) || []).length,
    useCallback: (componentSource.match(/useCallback/g) || []).length,
    useRef: (componentSource.match(/useRef/g) || []).length,
    classComponents: (componentSource.match(/class\s+\w+\s+extends\s+/g) || []).length
  };

  const suggestions: string[] = [];

  if (patterns.useState > 0) {
    suggestions.push(
      `Found ${patterns.useState} useState hook(s). Consider migrating to signal() for reactive state.`
    );
  }

  if (patterns.useEffect > 0) {
    suggestions.push(
      `Found ${patterns.useEffect} useEffect hook(s). Remove dependency arrays - PhilJS tracks automatically.`
    );
  }

  if (patterns.useMemo > 0) {
    suggestions.push(
      `Found ${patterns.useMemo} useMemo hook(s). Remove dependency arrays - PhilJS tracks automatically.`
    );
  }

  if (patterns.useCallback > 0) {
    suggestions.push(
      `Found ${patterns.useCallback} useCallback hook(s). These are unnecessary in PhilJS - remove them.`
    );
  }

  if (patterns.classComponents > 0) {
    suggestions.push(
      `Found ${patterns.classComponents} class component(s). Convert to functional components with hooks.`
    );
  }

  return { patterns, suggestions };
}

// Type definitions for better IDE support
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
