/**
 * SSR and Hydration Error Detection
 *
 * Detects and provides helpful messages for:
 * - Hydration mismatches
 * - Browser API usage during SSR
 * - Missing SSR data
 * - Server/client state differences
 */

import { createPhilJSError, type PhilJSError } from './error-codes.js';
import { getPrimaryLocation } from './stack-trace.js';

/**
 * Track hydration state
 */
let isHydrating = false;
let hydrationMismatches: HydrationMismatch[] = [];

export interface HydrationMismatch {
  path: string;
  serverHTML?: string;
  clientHTML?: string;
  reason: string;
  timestamp: number;
}

/**
 * Mark start of hydration
 */
export function startHydration(): void {
  isHydrating = true;
  hydrationMismatches = [];
}

/**
 * Mark end of hydration
 */
export function endHydration(): void {
  isHydrating = false;

  // Report mismatches if any
  if (hydrationMismatches.length > 0) {
    console.warn(
      `[PhilJS] Detected ${hydrationMismatches.length} hydration mismatch(es). ` +
      'See details below:'
    );
    hydrationMismatches.forEach((mismatch, idx) => {
      console.warn(`Mismatch ${idx + 1}:`, mismatch);
    });
  }
}

/**
 * Record a hydration mismatch
 */
export function recordHydrationMismatch(
  path: string,
  serverHTML?: string,
  clientHTML?: string,
  reason?: string
): void {
  const mismatch: HydrationMismatch = {
    path,
    reason: reason || 'HTML content mismatch',
    timestamp: Date.now(),
  };
  if (serverHTML !== undefined) {
    mismatch.serverHTML = serverHTML;
  }
  if (clientHTML !== undefined) {
    mismatch.clientHTML = clientHTML;
  }

  hydrationMismatches.push(mismatch);

  // Throw error for the first mismatch
  if (hydrationMismatches.length === 1) {
    const error = createHydrationMismatchError(mismatch);
    throw error;
  }
}

/**
 * Create PHIL-100 error: Hydration Mismatch
 */
function createHydrationMismatchError(mismatch: HydrationMismatch): PhilJSError {
  const error = createPhilJSError('PHIL-100', {
    path: mismatch.path,
    serverHTML: mismatch.serverHTML,
    clientHTML: mismatch.clientHTML,
  });

  const location = getPrimaryLocation(error);
  if (location) {
    error.sourceLocation = location;
  }

  return error;
}

/**
 * Check if currently hydrating
 */
export function isCurrentlyHydrating(): boolean {
  return isHydrating;
}

/**
 * Get all hydration mismatches
 */
export function getHydrationMismatches(): HydrationMismatch[] {
  return [...hydrationMismatches];
}

/**
 * Clear hydration mismatches (useful for testing)
 */
export function clearHydrationMismatches(): void {
  hydrationMismatches = [];
}

/**
 * Browser API detection during SSR
 */
const browserAPIs = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
  'history',
  'screen',
  'alert',
  'confirm',
  'prompt',
];

/**
 * Check if code is running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Wrap browser API access with error checking
 */
export function guardBrowserAPI<T>(
  apiName: string,
  accessor: () => T,
  fallback?: T
): T {
  if (isServer()) {
    const error = createBrowserAPIDuringSSRError(apiName);
    if (fallback !== undefined) {
      console.warn(error.message, '- Using fallback value');
      return fallback;
    }
    throw error;
  }

  return accessor();
}

/**
 * Create PHIL-101 error: Browser API During SSR
 */
function createBrowserAPIDuringSSRError(api: string): PhilJSError {
  const error = createPhilJSError('PHIL-101', { api });
  const location = getPrimaryLocation(error);
  if (location) {
    error.sourceLocation = location;
  }
  return error;
}

/**
 * SSR data validation
 */
interface SSRData {
  [key: string]: any;
}

let ssrData: SSRData = {};

/**
 * Set SSR data (called during server rendering)
 */
export function setSSRData(data: SSRData): void {
  ssrData = data;
}

/**
 * Get SSR data
 */
export function getSSRData(): SSRData {
  return ssrData;
}

/**
 * Require SSR data key
 */
export function requireSSRData(key: string): any {
  if (!(key in ssrData)) {
    throw createMissingSSRDataError(key);
  }
  return ssrData[key];
}

/**
 * Create PHIL-102 error: Missing SSR Data
 */
function createMissingSSRDataError(dataKey: string): PhilJSError {
  const error = createPhilJSError('PHIL-102', { dataKey });
  const location = getPrimaryLocation(error);
  if (location) {
    error.sourceLocation = location;
  }
  return error;
}

/**
 * Detect common hydration issues
 */
export function detectHydrationIssues(
  serverHTML: string,
  clientHTML: string,
  path: string
): string[] {
  const issues: string[] = [];

  // Check for date/time differences
  const serverDates = extractDates(serverHTML);
  const clientDates = extractDates(clientHTML);
  if (serverDates.length > 0 && clientDates.length > 0) {
    if (serverDates.some((d, i) => d !== clientDates[i])) {
      issues.push('Date/time values differ between server and client');
    }
  }

  // Check for random values
  const serverNumbers = extractNumbers(serverHTML);
  const clientNumbers = extractNumbers(clientHTML);
  if (serverNumbers.length > 0 && clientNumbers.length > 0) {
    if (serverNumbers.some((n, i) => n !== clientNumbers[i])) {
      issues.push('Numeric values differ - possible random number usage');
    }
  }

  // Check for different element counts
  const serverElementCount = (serverHTML.match(/<[^>]+>/g) || []).length;
  const clientElementCount = (clientHTML.match(/<[^>]+>/g) || []).length;
  if (serverElementCount !== clientElementCount) {
    issues.push(`Element count mismatch: server has ${serverElementCount}, client has ${clientElementCount}`);
  }

  // Check for attribute differences
  const serverAttrs = extractAttributes(serverHTML);
  const clientAttrs = extractAttributes(clientHTML);
  const attrDiff = compareAttributes(serverAttrs, clientAttrs);
  if (attrDiff.length > 0) {
    issues.push(...attrDiff);
  }

  return issues;
}

/**
 * Extract dates from HTML
 */
function extractDates(html: string): string[] {
  const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/g;
  return html.match(datePattern) || [];
}

/**
 * Extract numbers from HTML
 */
function extractNumbers(html: string): string[] {
  const numberPattern = />\s*(\d+(?:\.\d+)?)\s*</g;
  const matches: string[] = [];
  let match;
  while ((match = numberPattern.exec(html)) !== null) {
    matches.push(match[1]!);
  }
  return matches;
}

/**
 * Extract attributes from HTML
 */
function extractAttributes(html: string): Map<string, string[]> {
  const attrs = new Map<string, string[]>();
  const attrPattern = /(\w+)="([^"]*)"/g;
  let match;

  while ((match = attrPattern.exec(html)) !== null) {
    const [, name, value] = match;
    if (!attrs.has(name!)) {
      attrs.set(name!, []);
    }
    attrs.get(name!)!.push(value!);
  }

  return attrs;
}

/**
 * Compare attributes between server and client
 */
function compareAttributes(
  serverAttrs: Map<string, string[]>,
  clientAttrs: Map<string, string[]>
): string[] {
  const differences: string[] = [];

  // Check for missing attributes on client
  for (const [name, values] of serverAttrs) {
    if (!clientAttrs.has(name)) {
      differences.push(`Attribute '${name}' present on server but missing on client`);
    }
  }

  // Check for extra attributes on client
  for (const [name, values] of clientAttrs) {
    if (!serverAttrs.has(name)) {
      differences.push(`Attribute '${name}' present on client but missing on server`);
    }
  }

  return differences;
}

/**
 * Create hydration-safe wrapper for values that may differ
 */
export function hydrationSafe<T>(
  serverValue: T,
  clientValue: () => T
): T {
  if (isServer() || isCurrentlyHydrating()) {
    return serverValue;
  }
  return clientValue();
}

/**
 * Get SSR error statistics
 */
export function getSSRErrorStats(): {
  hydrationMismatches: number;
  isHydrating: boolean;
  ssrDataKeys: string[];
} {
  return {
    hydrationMismatches: hydrationMismatches.length,
    isHydrating: isCurrentlyHydrating(),
    ssrDataKeys: Object.keys(ssrData),
  };
}

/**
 * Clear all SSR error tracking
 */
export function clearSSRErrorTracking(): void {
  hydrationMismatches = [];
  ssrData = {};
  isHydrating = false;
}
