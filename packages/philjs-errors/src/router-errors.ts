/**
 * Router Error Detection and Handling
 *
 * Detects and provides helpful messages for:
 * - Invalid route patterns
 * - Missing route parameters
 * - Route not found errors
 * - Navigation errors
 */

import { createPhilJSError, type PhilJSError } from './error-codes.js';
import { getPrimaryLocation } from './stack-trace.js';

/**
 * Route pattern validation
 */
export interface RoutePattern {
  path: string;
  params: string[];
  isValid: boolean;
  errors: string[];
}

/**
 * Validate route pattern syntax
 */
export function validateRoutePattern(pattern: string): RoutePattern {
  const errors: string[] = [];
  const params: string[] = [];

  // Extract parameters
  const paramPattern = /:(\w+)(\?)?/g;
  let match;

  while ((match = paramPattern.exec(pattern)) !== null) {
    const paramName = match[1]!;
    params.push(paramName);

    // Validate parameter name (must be valid identifier)
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(paramName)) {
      errors.push(`Invalid parameter name '${paramName}' - must be a valid identifier`);
    }
  }

  // Check for invalid characters
  const invalidChars = pattern.match(/[^\w/:?*.-]/g);
  if (invalidChars) {
    errors.push(`Invalid characters in pattern: ${invalidChars.join(', ')}`);
  }

  // Check for conflicting wildcards
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  if (wildcardCount > 1) {
    errors.push('Multiple wildcards (*) not allowed in a single pattern');
  }

  // Check for wildcard position
  if (wildcardCount === 1 && !pattern.endsWith('*')) {
    errors.push('Wildcard (*) must be at the end of the pattern');
  }

  return {
    path: pattern,
    params,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Throw error for invalid route pattern
 */
export function throwInvalidRoutePattern(
  pattern: string,
  reason: string
): never {
  const error = createPhilJSError('PHIL-200', { pattern, reason });
  const location = getPrimaryLocation(error);
  if (location) {
    error.sourceLocation = location;
  }
  throw error;
}

/**
 * Validate route pattern and throw if invalid
 */
export function ensureValidRoutePattern(pattern: string): RoutePattern {
  const validation = validateRoutePattern(pattern);

  if (!validation.isValid) {
    throwInvalidRoutePattern(pattern, validation.errors.join(', '));
  }

  return validation;
}

/**
 * Check if path matches pattern
 */
export function matchPath(
  path: string,
  pattern: string
): { matches: boolean; params: Record<string, string> } | null {
  const validation = validateRoutePattern(pattern);

  if (!validation.isValid) {
    return null;
  }

  // Convert pattern to regex
  let regexPattern = pattern
    .replace(/:\w+\?/g, '([^/]*)') // Optional params
    .replace(/:\w+/g, '([^/]+)') // Required params
    .replace(/\*/g, '(.*)'); // Wildcard

  regexPattern = `^${regexPattern}$`;

  const regex = new RegExp(regexPattern);
  const match = path.match(regex);

  if (!match) {
    return null;
  }

  // Extract params
  const params: Record<string, string> = {};
  validation.params.forEach((paramName, index) => {
    params[paramName] = match[index + 1]!;
  });

  return {
    matches: true,
    params,
  };
}

/**
 * Extract required parameters from pattern
 */
export function getRequiredParams(pattern: string): string[] {
  const validation = validateRoutePattern(pattern);
  // Filter out optional params (those with ?)
  return validation.params.filter(param => {
    const optionalPattern = new RegExp(`:${param}\\?`);
    return !optionalPattern.test(pattern);
  });
}

/**
 * Validate navigation parameters
 */
export function validateNavigationParams(
  pattern: string,
  providedParams: Record<string, string>
): { valid: boolean; missing: string[]; extra: string[] } {
  const validation = validateRoutePattern(pattern);
  const required = getRequiredParams(pattern);
  const provided = Object.keys(providedParams);

  const missing = required.filter(param => !provided.includes(param));
  const extra = provided.filter(param => !validation.params.includes(param));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Throw error for missing route parameter
 */
export function throwMissingRouteParameter(
  pattern: string,
  paramName: string
): never {
  const error = createPhilJSError('PHIL-201', { paramName, pattern });
  const location = getPrimaryLocation(error);
  if (location) {
    error.sourceLocation = location;
  }
  throw error;
}

/**
 * Build path from pattern and params
 */
export function buildPath(
  pattern: string,
  params: Record<string, string>
): string {
  const validation = validateNavigationParams(pattern, params);

  if (!validation.valid) {
    throwMissingRouteParameter(pattern, validation.missing[0]!);
  }

  let path = pattern;

  // Replace parameters
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value);
    path = path.replace(`:${key}?`, value);
  }

  // Remove optional parameters that weren't provided
  path = path.replace(/\/:\w+\?/g, '');

  return path;
}

/**
 * Route registry for detecting 404s
 */
const registeredRoutes = new Set<string>();

/**
 * Register a route pattern
 */
export function registerRoute(pattern: string): void {
  ensureValidRoutePattern(pattern);
  registeredRoutes.add(pattern);
}

/**
 * Unregister a route pattern
 */
export function unregisterRoute(pattern: string): void {
  registeredRoutes.delete(pattern);
}

/**
 * Check if any route matches path
 */
export function findMatchingRoute(
  path: string
): { pattern: string; params: Record<string, string> } | null {
  for (const pattern of registeredRoutes) {
    const match = matchPath(path, pattern);
    if (match?.matches) {
      return {
        pattern,
        params: match.params,
      };
    }
  }
  return null;
}

/**
 * Warn about route not found
 */
export function warnRouteNotFound(path: string): void {
  const error = createPhilJSError('PHIL-202', { path });
  console.warn(error.message);

  // Provide suggestions
  if (error.suggestions.length > 0) {
    console.warn('Suggestions:');
    error.suggestions.forEach((suggestion, idx) => {
      console.warn(`  ${idx + 1}. ${suggestion.description}`);
    });
  }

  // Show registered routes
  if (registeredRoutes.size > 0) {
    console.warn('Registered routes:', Array.from(registeredRoutes));
  }
}

/**
 * Navigation tracking
 */
interface NavigationEvent {
  from: string;
  to: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

const navigationHistory: NavigationEvent[] = [];
const MAX_NAVIGATION_HISTORY = 50;

/**
 * Record a navigation event
 */
export function recordNavigation(
  from: string,
  to: string,
  success: boolean,
  error?: string
): void {
  const event: NavigationEvent = {
    from,
    to,
    timestamp: Date.now(),
    success,
  };
  if (error !== undefined) {
    event.error = error;
  }

  navigationHistory.push(event);

  // Keep only recent history
  if (navigationHistory.length > MAX_NAVIGATION_HISTORY) {
    navigationHistory.shift();
  }
}

/**
 * Get navigation history
 */
export function getNavigationHistory(): NavigationEvent[] {
  return [...navigationHistory];
}

/**
 * Get recent failed navigations
 */
export function getFailedNavigations(): NavigationEvent[] {
  return navigationHistory.filter(nav => !nav.success);
}

/**
 * Clear navigation history
 */
export function clearNavigationHistory(): void {
  navigationHistory.length = 0;
}

/**
 * Get router error statistics
 */
export function getRouterErrorStats(): {
  registeredRoutes: number;
  navigationHistory: number;
  failedNavigations: number;
} {
  return {
    registeredRoutes: registeredRoutes.size,
    navigationHistory: navigationHistory.length,
    failedNavigations: getFailedNavigations().length,
  };
}

/**
 * Clear all router error tracking
 */
export function clearRouterErrorTracking(): void {
  registeredRoutes.clear();
  clearNavigationHistory();
}

/**
 * Suggest similar routes
 */
export function suggestSimilarRoutes(path: string, maxSuggestions = 3): string[] {
  const routes = Array.from(registeredRoutes);

  // Calculate similarity scores
  const scored = routes.map(route => ({
    route,
    score: calculateSimilarity(path, route),
  }));

  // Sort by score and return top matches
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .filter(r => r.score > 0.3)
    .map(r => r.route);
}

/**
 * Calculate similarity between two paths (Levenshtein-based)
 */
function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return (maxLen - distance) / maxLen;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1,     // insertion
          matrix[i - 1]![j]! + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}
