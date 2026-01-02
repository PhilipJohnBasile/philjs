/**
 * Tests for error pages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NotFoundPage,
  InternalErrorPage,
  DevErrorOverlay,
  generateErrorResponse,
  parseErrorStack,
  generateErrorSuggestions,
  configureErrorTracking,
  trackError,
  ErrorPage,
} from './error-pages.js';

describe('Error Pages', () => {
  describe('NotFoundPage', () => {
    it('should generate 404 page HTML', () => {
      const html = NotFoundPage({ url: '/missing-page' });

      expect(html).toContain('404');
      expect(html).toContain('Page Not Found');
      expect(html).toContain('/missing-page');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should include custom app name', () => {
      const html = NotFoundPage({
        url: '/test',
        config: { appName: 'My Cool App' },
      });

      expect(html).toContain('My Cool App');
    });

    it('should include support link when provided', () => {
      const html = NotFoundPage({
        config: { supportLink: 'https://support.example.com' },
      });

      expect(html).toContain('Contact Support');
      expect(html).toContain('support.example.com');
    });

    it('should handle missing URL', () => {
      const html = NotFoundPage({});

      expect(html).toContain('404');
      expect(html).not.toContain('url-box');
    });

    it('should escape HTML in URL', () => {
      const html = NotFoundPage({ url: '<script>alert("xss")</script>' });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include custom CSS', () => {
      const customCSS = '.custom { color: red; }';
      const html = NotFoundPage({
        config: { customCSS },
      });

      expect(html).toContain(customCSS);
    });
  });

  describe('InternalErrorPage', () => {
    it('should generate 500 page HTML', () => {
      const error = new Error('Something went wrong');
      const html = InternalErrorPage({ error });

      expect(html).toContain('500');
      expect(html).toContain('Internal Server Error');
      expect(html).toContain('Something went wrong');
    });

    it('should show details in development mode', () => {
      const error = new Error('Dev error');
      error.stack = 'Error: Dev error\n  at test.js:10:5';

      const html = InternalErrorPage({
        error,
        config: { showDetails: true },
      });

      expect(html).toContain('Error Details');
      expect(html).toContain('Stack Trace');
      expect(html).toContain('test.js:10:5');
    });

    it('should hide details in production mode', () => {
      const error = new Error('Prod error');
      error.stack = 'Error: Prod error\n  at secret.js:100:1';

      const html = InternalErrorPage({
        error,
        config: { showDetails: false },
      });

      expect(html).not.toContain('Error Details');
      expect(html).not.toContain('secret.js');
      expect(html).toContain('Something Went Wrong');
    });

    it('should include request ID and timestamp', () => {
      const error = new Error('Test error');
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const html = InternalErrorPage({
        error,
        requestId: 'req-123',
        timestamp,
      });

      expect(html).toContain('req-123');
      expect(html).toContain('2024-01-01');
    });

    it('should include suggestions', () => {
      const error = new Error('Cannot read property "foo" of undefined');
      const html = InternalErrorPage({ error });

      expect(html).toContain('What You Can Do');
      expect(html).toContain('suggestions');
    });

    it('should escape HTML in error messages', () => {
      const error = new Error('<script>alert("xss")</script>');
      const html = InternalErrorPage({ error });

      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('DevErrorOverlay', () => {
    it('should generate error overlay HTML', () => {
      const error = new Error('Runtime error');
      const html = DevErrorOverlay({ error });

      expect(html).toContain('philjs-error-overlay');
      expect(html).toContain('Runtime Error');
      expect(html).toContain('Runtime error');
    });

    it('should include component stack when provided', () => {
      const error = new Error('Component error');
      const componentStack = '  at MyComponent\n  at App';

      const html = DevErrorOverlay({ error, componentStack });

      expect(html).toContain('Component Stack');
      expect(html).toContain('MyComponent');
    });

    it('should include close button', () => {
      const error = new Error('Test');
      const html = DevErrorOverlay({ error });

      expect(html).toContain('✕ Close');
      expect(html).toContain('onclick');
    });

    it('should escape HTML in error messages', () => {
      const error = new Error('<img src=x onerror=alert(1)>');
      const html = DevErrorOverlay({ error });

      expect(html).not.toContain('<img src');
      expect(html).toContain('&lt;img');
    });
  });

  describe('parseErrorStack', () => {
    it('should parse error stack trace', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
  at myFunction (file.js:10:5)
  at anotherFunction (other.js:20:10)`;

      const diagnostics = parseErrorStack(error);

      expect(diagnostics).toHaveLength(3); // Error + 2 stack frames
      expect(diagnostics[0]).toMatchObject({
        type: 'error',
        message: 'Test error',
      });
      expect(diagnostics[1].message).toContain('myFunction');
      expect(diagnostics[2].message).toContain('anotherFunction');
    });

    it('should handle error without stack', () => {
      const error = new Error('No stack');
      delete error.stack;

      const diagnostics = parseErrorStack(error);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toBe('No stack');
    });

    it('should limit stack frames shown', () => {
      const error = new Error('Deep stack');
      const frames = Array.from({ length: 20 }, (_, i) =>
        `  at func${i} (file${i}.js:${i}:${i})`
      );
      error.stack = `Error: Deep stack\n${frames.join('\n')}`;

      const diagnostics = parseErrorStack(error);

      // Should show error + max 5 frames
      expect(diagnostics.length).toBeLessThanOrEqual(6);
    });
  });

  describe('generateErrorSuggestions', () => {
    it('should suggest for undefined property errors', () => {
      const error = new Error('Cannot read property "foo" of undefined');
      const suggestions = generateErrorSuggestions(error);

      expect(suggestions.some(s => s.includes('null/undefined checks'))).toBe(true);
    });

    it('should suggest for network errors', () => {
      const error = new Error('Network request failed');
      const suggestions = generateErrorSuggestions(error);

      expect(suggestions.some(s => s.includes('internet connection'))).toBe(true);
      expect(suggestions.some(s => s.includes('API endpoint'))).toBe(true);
    });

    it('should suggest for 404 errors', () => {
      const error = new Error('Resource not found - 404');
      const suggestions = generateErrorSuggestions(error);

      expect(suggestions.some(s => s.includes('URL path'))).toBe(true);
    });

    it('should suggest for permission errors', () => {
      const error = new Error('Permission denied - 403');
      const suggestions = generateErrorSuggestions(error);

      expect(suggestions.some(s => s.includes('authentication'))).toBe(true);
    });

    it('should suggest for timeout errors', () => {
      const error = new Error('Request timeout');
      const suggestions = generateErrorSuggestions(error);

      expect(suggestions.some(s => s.includes('took too long'))).toBe(true);
    });

    it('should provide default suggestions for unknown errors', () => {
      const error = new Error('Unknown mysterious error');
      const suggestions = generateErrorSuggestions(error);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('console'))).toBe(true);
    });
  });

  describe('error tracking', () => {
    let trackedErrors: Array<{ error: Error; context: any }>;

    beforeEach(() => {
      trackedErrors = [];
      configureErrorTracking((error, context) => {
        trackedErrors.push({ error, context });
      });
    });

    afterEach(() => {
      configureErrorTracking(() => {});
    });

    it('should track errors when configured', () => {
      const error = new Error('Tracked error');
      const context = { userId: '123', page: '/home' };

      trackError(error, context);

      expect(trackedErrors).toHaveLength(1);
      expect(trackedErrors[0].error).toBe(error);
      expect(trackedErrors[0].context).toEqual(context);
    });

    it('should track errors from InternalErrorPage', () => {
      const error = new Error('Page error');
      InternalErrorPage({
        error,
        requestId: 'req-456',
      });

      expect(trackedErrors).toHaveLength(1);
      expect(trackedErrors[0].error.message).toBe('Page error');
      expect(trackedErrors[0].context.requestId).toBe('req-456');
    });

    it('should handle tracking without context', () => {
      const error = new Error('No context');
      trackError(error);

      expect(trackedErrors).toHaveLength(1);
      expect(trackedErrors[0].context).toEqual({});
    });
  });

  describe('generateErrorResponse', () => {
    it('should generate 404 response', () => {
      const error = new Error('Not found');
      const response = generateErrorResponse(error, 404, undefined, {
        url: '/missing',
      });

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });

    it('should generate 500 response', () => {
      const error = new Error('Server error');
      const response = generateErrorResponse(error, 500);

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });

    it('should include request ID in headers', () => {
      const error = new Error('Test');
      const response = generateErrorResponse(error, 500, undefined, {
        requestId: 'test-123',
      });

      expect(response.headers.get('X-Error-ID')).toBe('test-123');
    });

    it('should generate request ID if not provided', () => {
      const error = new Error('Test');
      const response = generateErrorResponse(error, 500);

      expect(response.headers.get('X-Error-ID')).toBeTruthy();
    });

    it('should pass config to page generators', () => {
      const error = new Error('Test');
      const config = { appName: 'Test App', showDetails: true };
      const response = generateErrorResponse(error, 404, config);

      // Response should be successful
      expect(response.status).toBe(404);
    });
  });

  describe('ErrorPage component', () => {
    it('should create error page JSX element', () => {
      const element = ErrorPage({
        statusCode: 500,
        title: 'Server Error',
        message: 'Something went wrong',
      });

      expect(element.type).toBe('div');
      expect(element.props.className).toBe('error-page');
      expect(element.props.children).toHaveLength(3);
    });

    it('should include error details when provided', () => {
      const error = new Error('Test error');
      const element = ErrorPage({
        statusCode: 500,
        error,
      });

      const children = element.props.children as any[];
      expect(children.some((c: any) => c?.type === 'pre')).toBe(true);
    });

    it('should handle children', () => {
      const child = { type: 'a', props: { href: '/', children: 'Go Home' } };
      const element = ErrorPage({
        statusCode: 404,
        children: child,
      });

      expect(element.props.children).toContain(child);
    });

    it('should filter out falsy values', () => {
      const element = ErrorPage({
        statusCode: 404,
        // No title, message, error, or children
      });

      const children = element.props.children as any[];
      expect(children.every((c: any) => c)).toBe(true); // No falsy values
    });
  });

  describe('HTML escaping', () => {
    it('should escape all special HTML characters', () => {
      const html = NotFoundPage({ url: '&<>"\'' });

      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('&quot;');
      expect(html).toContain('&#039;');
    });

    it('should prevent XSS in error messages', () => {
      const error = new Error('"><script>alert(1)</script><"');
      const html = InternalErrorPage({ error, config: { showDetails: true } });

      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should prevent XSS in stack traces', () => {
      const error = new Error('XSS');
      error.stack = 'Error: XSS\n  at <script>alert(1)</script>';

      const html = InternalErrorPage({ error, config: { showDetails: true } });

      expect(html).not.toContain('<script>alert(1)</script>');
    });
  });

  describe('responsive design', () => {
    it('should include viewport meta tag', () => {
      const html = NotFoundPage({});

      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include mobile-friendly styles', () => {
      const error = new Error('Test');
      const html = InternalErrorPage({ error });

      expect(html).toContain('max-width');
      expect(html).toContain('padding');
    });
  });
});
