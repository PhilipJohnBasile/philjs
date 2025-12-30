/**
 * Compiler Error Detection and Enhancement
 *
 * Provides helpful error messages for:
 * - JSX syntax errors
 * - Unsupported features
 * - Optimization warnings
 * - Build-time errors
 */

import { createPhilJSError, type PhilJSError, type SourceLocation, type ErrorSuggestion } from './error-codes.js';

/**
 * Compiler error context
 */
export interface CompilerErrorContext {
  code: string;
  filePath: string;
  line?: number;
  column?: number;
  originalError?: Error;
}

/**
 * JSX syntax error detection
 */
export function createJSXSyntaxError(
  details: string,
  context: CompilerErrorContext
): PhilJSError {
  const error = createPhilJSError('PHIL-300', {
    details,
    location: context.filePath + (context.line ? `:${context.line}` : ''),
  });

  if (context.line && context.column) {
    const sourceLocation: SourceLocation = {
      file: context.filePath,
      line: context.line,
      column: context.column,
    };
    const source = extractLineFromCode(context.code, context.line);
    if (source !== undefined) {
      sourceLocation.source = source;
    }
    error.sourceLocation = sourceLocation;
  }

  return error;
}

/**
 * Unsupported feature error
 */
export function createUnsupportedFeatureError(
  feature: string,
  reason: string,
  context: CompilerErrorContext
): PhilJSError {
  const error = createPhilJSError('PHIL-301', {
    feature,
    reason,
  });

  if (context.line && context.column) {
    const sourceLocation: SourceLocation = {
      file: context.filePath,
      line: context.line,
      column: context.column,
    };
    const source = extractLineFromCode(context.code, context.line);
    if (source !== undefined) {
      sourceLocation.source = source;
    }
    error.sourceLocation = sourceLocation;
  }

  return error;
}

/**
 * Optimization warning
 */
export function createOptimizationWarning(
  issue: string,
  context: CompilerErrorContext
): PhilJSError {
  const error = createPhilJSError('PHIL-302', { issue });

  if (context.line && context.column) {
    const sourceLocation: SourceLocation = {
      file: context.filePath,
      line: context.line,
      column: context.column,
    };
    const source = extractLineFromCode(context.code, context.line);
    if (source !== undefined) {
      sourceLocation.source = source;
    }
    error.sourceLocation = sourceLocation;
  }

  return error;
}

/**
 * Extract line from code
 */
function extractLineFromCode(code: string, lineNumber: number): string | undefined {
  const lines = code.split('\n');
  return lines[lineNumber - 1];
}

/**
 * Extract code snippet with context
 */
export function extractCodeSnippet(
  code: string,
  line: number,
  column: number,
  contextLines = 2
): string {
  const lines = code.split('\n');
  const startLine = Math.max(0, line - contextLines - 1);
  const endLine = Math.min(lines.length, line + contextLines);

  const snippet: string[] = [];

  for (let i = startLine; i < endLine; i++) {
    const lineNum = i + 1;
    const prefix = lineNum === line ? '>' : ' ';
    const paddedLineNum = String(lineNum).padStart(4, ' ');

    snippet.push(`${prefix} ${paddedLineNum} | ${lines[i]}`);

    // Add pointer to column if this is the error line
    if (lineNum === line) {
      const pointer = ' '.repeat(8 + column) + '^';
      snippet.push(pointer);
    }
  }

  return snippet.join('\n');
}

/**
 * Common JSX error patterns
 */
export interface JSXErrorPattern {
  pattern: RegExp;
  message: string;
  suggestion: string;
}

export const JSX_ERROR_PATTERNS: JSXErrorPattern[] = [
  {
    pattern: /Unexpected token [<>]/,
    message: 'Unclosed or mismatched JSX tag',
    suggestion: 'Ensure all JSX tags are properly closed and nested correctly',
  },
  {
    pattern: /Adjacent JSX elements must be wrapped/,
    message: 'Multiple root elements in JSX',
    suggestion: 'Wrap adjacent JSX elements in a fragment (<>...</>) or parent element',
  },
  {
    pattern: /class=/,
    message: 'Using "class" instead of "className"',
    suggestion: 'Use "className" for CSS classes in JSX',
  },
  {
    pattern: /for=/,
    message: 'Using "for" instead of "htmlFor"',
    suggestion: 'Use "htmlFor" for label associations in JSX',
  },
  {
    pattern: /onclick/i,
    message: 'Event handler should be camelCase',
    suggestion: 'Use "onClick" instead of "onclick"',
  },
];

/**
 * Detect JSX error pattern
 */
export function detectJSXErrorPattern(errorMessage: string): JSXErrorPattern | null {
  for (const pattern of JSX_ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Enhance compiler error with better message
 */
export function enhanceCompilerError(
  originalError: Error,
  context: CompilerErrorContext
): PhilJSError {
  // Check for known patterns
  const pattern = detectJSXErrorPattern(originalError.message);

  if (pattern) {
    const error = createJSXSyntaxError(pattern.message, context);

    // Add pattern-specific suggestion
    error.suggestions.unshift({
      description: pattern.suggestion,
      confidence: 0.9,
    });

    return error;
  }

  // Generic compiler error
  return createJSXSyntaxError(originalError.message, context);
}

/**
 * Validate JSX attribute names
 */
const VALID_JSX_ATTRIBUTES = new Set([
  'className',
  'htmlFor',
  'onClick',
  'onChange',
  'onInput',
  'onSubmit',
  'onFocus',
  'onBlur',
  'onKeyDown',
  'onKeyUp',
  'onKeyPress',
  'onMouseDown',
  'onMouseUp',
  'onMouseEnter',
  'onMouseLeave',
  'dangerouslySetInnerHTML',
  // Add more as needed
]);

const DEPRECATED_ATTRIBUTES = new Map([
  ['class', 'className'],
  ['for', 'htmlFor'],
  ['onclick', 'onClick'],
  ['onchange', 'onChange'],
  ['oninput', 'onInput'],
]);

/**
 * Check for deprecated JSX attributes
 */
export function checkDeprecatedAttributes(
  attributes: string[]
): Array<{ attribute: string; replacement: string }> {
  const deprecated: Array<{ attribute: string; replacement: string }> = [];

  for (const attr of attributes) {
    if (DEPRECATED_ATTRIBUTES.has(attr)) {
      deprecated.push({
        attribute: attr,
        replacement: DEPRECATED_ATTRIBUTES.get(attr)!,
      });
    }
  }

  return deprecated;
}

/**
 * Compiler warning aggregation
 */
interface CompilerWarning {
  code: string;
  message: string;
  file: string;
  line?: number;
  column?: number;
  severity: 'warning' | 'info';
}

const compilerWarnings: CompilerWarning[] = [];
const MAX_WARNINGS = 100;

/**
 * Add compiler warning
 */
export function addCompilerWarning(warning: CompilerWarning): void {
  compilerWarnings.push(warning);

  // Keep only recent warnings
  if (compilerWarnings.length > MAX_WARNINGS) {
    compilerWarnings.shift();
  }
}

/**
 * Get all compiler warnings
 */
export function getCompilerWarnings(): CompilerWarning[] {
  return [...compilerWarnings];
}

/**
 * Get warnings for a specific file
 */
export function getWarningsForFile(filePath: string): CompilerWarning[] {
  return compilerWarnings.filter(w => w.file === filePath);
}

/**
 * Clear compiler warnings
 */
export function clearCompilerWarnings(): void {
  compilerWarnings.length = 0;
}

/**
 * Format compiler error for display
 */
export function formatCompilerError(
  error: PhilJSError,
  code: string
): string {
  let output = `\n${'='.repeat(80)}\n`;
  output += `[${error.code}] ${error.message}\n`;
  output += `${'='.repeat(80)}\n\n`;

  if (error.sourceLocation) {
    output += `File: ${error.sourceLocation.file}\n`;
    output += `Location: ${error.sourceLocation.line}:${error.sourceLocation.column}\n\n`;

    // Add code snippet
    const snippet = extractCodeSnippet(
      code,
      error.sourceLocation.line,
      error.sourceLocation.column
    );
    output += snippet + '\n\n';
  }

  if (error.suggestions.length > 0) {
    output += 'Suggestions:\n';
    error.suggestions.forEach((suggestion: ErrorSuggestion, idx: number) => {
      output += `  ${idx + 1}. ${suggestion.description}\n`;

      if (suggestion.codeExample) {
        output += '\n    Before:\n';
        output += suggestion.codeExample.before
          .split('\n')
          .map((line: string) => `    ${line}`)
          .join('\n');
        output += '\n\n    After:\n';
        output += suggestion.codeExample.after
          .split('\n')
          .map((line: string) => `    ${line}`)
          .join('\n');
        output += '\n\n';
      }
    });
  }

  if (error.documentationUrl) {
    output += `\nLearn more: ${error.documentationUrl}\n`;
  }

  output += `\n${'='.repeat(80)}\n`;

  return output;
}

/**
 * Get compiler error statistics
 */
export function getCompilerErrorStats(): {
  totalWarnings: number;
  warningsByFile: Record<string, number>;
  warningsByCode: Record<string, number>;
} {
  const warningsByFile: Record<string, number> = {};
  const warningsByCode: Record<string, number> = {};

  for (const warning of compilerWarnings) {
    // Count by file
    warningsByFile[warning.file] = (warningsByFile[warning.file] || 0) + 1;

    // Count by code
    warningsByCode[warning.code] = (warningsByCode[warning.code] || 0) + 1;
  }

  return {
    totalWarnings: compilerWarnings.length,
    warningsByFile,
    warningsByCode,
  };
}
