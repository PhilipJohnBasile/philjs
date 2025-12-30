/**
 * Stack Trace Processing and Source Map Integration
 *
 * Improves stack traces to point to user code instead of framework internals.
 * Integrates with source maps for accurate error locations.
 */

import type { SourceLocation } from './error-codes.js';

export interface StackFrame {
  functionName?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  source?: string;
  isFramework?: boolean;
  isUserCode?: boolean;
  isNodeModules?: boolean;
}

export interface ProcessedStack {
  frames: StackFrame[];
  userCodeFrames: StackFrame[];
  frameworkFrames: StackFrame[];
  rawStack: string;
}

/**
 * Framework internal patterns to filter out
 */
const FRAMEWORK_PATTERNS = [
  /philjs-core\/dist/,
  /philjs-core\/src/,
  /node_modules\/philjs/,
  /@philjs\//,
  /jsx-runtime/,
  /signals\.js/,
  /error-boundary\.js/,
];

/**
 * Node modules pattern
 */
const NODE_MODULES_PATTERN = /node_modules/;

/**
 * Parse error stack trace into structured frames
 */
export function parseStack(error: Error): StackFrame[] {
  if (!error.stack) return [];

  const lines = error.stack.split('\n');
  const frames: StackFrame[] = [];

  for (const line of lines) {
    // Skip the error message line
    if (line.includes('Error:') || line.includes('at ')) {
      const frame = parseStackLine(line);
      if (frame) {
        frames.push(frame);
      }
    }
  }

  return frames;
}

/**
 * Parse a single stack trace line
 */
function parseStackLine(line: string): StackFrame | null {
  // Common formats:
  // "    at functionName (file.js:10:5)"
  // "    at file.js:10:5"
  // "    at async functionName (file.js:10:5)"

  const match = line.match(/at\s+(?:async\s+)?(?:(.+?)\s+)?\(?(.*?):(\d+):(\d+)\)?/);

  if (!match) return null;

  const [, functionName, fileName, lineNumber, columnNumber] = match;

  if (lineNumber === undefined || columnNumber === undefined) return null;

  const fnName = functionName?.trim();
  const fName = fileName?.trim();
  const frame: StackFrame = {
    lineNumber: parseInt(lineNumber, 10),
    columnNumber: parseInt(columnNumber, 10),
    ...(fnName !== undefined && { functionName: fnName }),
    ...(fName !== undefined && { fileName: fName }),
  };

  // Classify the frame
  frame.isFramework = isFrameworkCode(frame.fileName || '');
  frame.isNodeModules = isNodeModulesCode(frame.fileName || '');
  frame.isUserCode = !frame.isFramework && !frame.isNodeModules;

  return frame;
}

/**
 * Check if a file is framework code
 */
function isFrameworkCode(fileName: string): boolean {
  return FRAMEWORK_PATTERNS.some(pattern => pattern.test(fileName));
}

/**
 * Check if a file is from node_modules
 */
function isNodeModulesCode(fileName: string): boolean {
  return NODE_MODULES_PATTERN.test(fileName);
}

/**
 * Process stack trace to highlight user code
 */
export function processStack(error: Error): ProcessedStack {
  const frames = parseStack(error);
  const userCodeFrames = frames.filter(f => f.isUserCode);
  const frameworkFrames = frames.filter(f => f.isFramework);

  return {
    frames,
    userCodeFrames,
    frameworkFrames,
    rawStack: error.stack || '',
  };
}

/**
 * Get the primary error location (first user code frame)
 */
export function getPrimaryLocation(error: Error): SourceLocation | null {
  const processed = processStack(error);

  // Prefer user code frames
  const primaryFrame = processed.userCodeFrames[0] || processed.frames[0];

  if (!primaryFrame || !primaryFrame.fileName) return null;

  return {
    file: primaryFrame.fileName,
    line: primaryFrame.lineNumber || 0,
    column: primaryFrame.columnNumber || 0,
  };
}

/**
 * Format stack trace for display, filtering framework internals
 */
export function formatStackTrace(
  error: Error,
  options: {
    maxFrames?: number;
    showFramework?: boolean;
    showNodeModules?: boolean;
    highlightUserCode?: boolean;
  } = {}
): string {
  const {
    maxFrames = 10,
    showFramework = false,
    showNodeModules = false,
    highlightUserCode = true,
  } = options;

  const processed = processStack(error);
  let frames = processed.frames;

  // Filter frames based on options
  if (!showFramework) {
    frames = frames.filter(f => !f.isFramework);
  }

  if (!showNodeModules) {
    frames = frames.filter(f => !f.isNodeModules);
  }

  // Limit number of frames
  frames = frames.slice(0, maxFrames);

  // Format each frame
  const lines = frames.map(frame => {
    const location = `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`;
    const func = frame.functionName || '<anonymous>';
    const prefix = highlightUserCode && frame.isUserCode ? '→' : ' ';

    return `  ${prefix} at ${func} (${location})`;
  });

  return lines.join('\n');
}

/**
 * Extract relevant code snippet around error location
 */
export async function getCodeSnippet(
  location: SourceLocation,
  options: {
    contextLines?: number;
  } = {}
): Promise<string | null> {
  const { contextLines = 3 } = options;

  // This would need to integrate with the build system to read source files
  // For now, we'll return null and implement this when we have file system access

  // In a real implementation:
  // 1. Read the source file
  // 2. Apply source maps if available
  // 3. Extract lines around the error location
  // 4. Format with line numbers and highlighting

  return null;
}

/**
 * Source map cache
 */
const sourceMaps = new Map<string, any>();

/**
 * Load source map for a file
 */
export async function loadSourceMap(fileName: string): Promise<any | null> {
  if (sourceMaps.has(fileName)) {
    return sourceMaps.get(fileName);
  }

  try {
    // In a browser environment, try to fetch the source map
    if (typeof window !== 'undefined') {
      const mapUrl = `${fileName}.map`;
      const response = await fetch(mapUrl);

      if (response.ok) {
        const sourceMap = await response.json();
        sourceMaps.set(fileName, sourceMap);
        return sourceMap;
      }
    }
  } catch (error) {
    // Source map not available or failed to load
    console.debug(`Failed to load source map for ${fileName}:`, error);
  }

  return null;
}

/**
 * Apply source map to a location
 */
export async function applySourceMap(
  location: SourceLocation
): Promise<SourceLocation> {
  const sourceMap = await loadSourceMap(location.file);

  if (!sourceMap) {
    return location;
  }

  // This would use a source map library to map the location
  // For now, return the original location
  // In a real implementation, use something like 'source-map' package:
  //
  // const consumer = await new SourceMapConsumer(sourceMap);
  // const original = consumer.originalPositionFor({
  //   line: location.line,
  //   column: location.column
  // });
  //
  // return {
  //   file: original.source || location.file,
  //   line: original.line || location.line,
  //   column: original.column || location.column,
  // };

  return location;
}

/**
 * Clean stack trace by removing framework internals
 */
export function cleanStack(stack: string): string {
  const lines = stack.split('\n');
  const cleaned: string[] = [];

  for (const line of lines) {
    // Keep error message
    if (!line.includes('at ')) {
      cleaned.push(line);
      continue;
    }

    // Check if this is framework code
    const isFramework = FRAMEWORK_PATTERNS.some(pattern => pattern.test(line));

    if (!isFramework) {
      cleaned.push(line);
    }
  }

  return cleaned.join('\n');
}

/**
 * Enhanced error with processed stack trace
 */
export function enhanceErrorStack(error: Error): Error {
  const processed = processStack(error);

  // Create a cleaned stack trace
  const cleanedFrames = [...processed.userCodeFrames];

  // Add a few framework frames for context (if needed)
  if (cleanedFrames.length === 0) {
    cleanedFrames.push(...processed.frames.slice(0, 3));
  }

  // Format the new stack
  const newStack = [
    error.toString(),
    ...cleanedFrames.map(frame => {
      const location = `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`;
      const func = frame.functionName || '<anonymous>';
      const marker = frame.isUserCode ? '→' : ' ';
      return `  ${marker} at ${func} (${location})`;
    }),
  ].join('\n');

  // Attach enhanced stack
  (error as any).__originalStack = error.stack;
  error.stack = newStack;

  return error;
}

/**
 * Create a development-friendly error display
 */
export function formatErrorForDev(error: Error): {
  message: string;
  stack: string;
  primaryLocation: SourceLocation | null;
  userFrames: StackFrame[];
} {
  const processed = processStack(error);
  const primaryLocation = getPrimaryLocation(error);

  return {
    message: error.message,
    stack: formatStackTrace(error, {
      showFramework: false,
      showNodeModules: false,
      highlightUserCode: true,
    }),
    primaryLocation,
    userFrames: processed.userCodeFrames,
  };
}
