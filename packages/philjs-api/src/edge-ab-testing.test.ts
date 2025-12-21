/**
 * Edge A/B Testing Tests
 */

import { describe, it, expect } from 'vitest';
import {
  abTestingMiddleware,
  variantMiddleware,
  variantRewriteMiddleware,
  multivariateTestingMiddleware,
  calculateSignificance,
  selectVariantDeterministic,
  type Experiment,
  type Variant,
} from './edge-ab-testing.js';
import { executeEdgeMiddleware, type EdgeMiddleware } from './edge-middleware.js';

describe('Edge A/B Testing', () => {
  const mockVariants: Variant[] = [
    { id: 'control', name: 'Control', weight: 50 },
    { id: 'variant-a', name: 'Variant A', weight: 50 },
  ];

  const mockExperiment: Experiment = {
    id: 'test-1',
    name: 'Test Experiment',
    variants: mockVariants,
  };

  describe('abTestingMiddleware', () => {
    it('should assign variant to new users', async () => {
      const middleware = abTestingMiddleware({
        experiments: [mockExperiment],
      });

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware);

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('exp_test-1=');
      expect(setCookie).toMatch(/exp_test-1=(control|variant-a)/);
    });

    it('should persist variant in cookie', async () => {
      const middleware = abTestingMiddleware({
        experiments: [mockExperiment],
      });

      const request = new Request('https://example.com/', {
        headers: { Cookie: 'exp_test-1=control' },
      });
      const response = await executeEdgeMiddleware(request, middleware);

      const experiments = response.headers.get('X-Experiments');
      expect(experiments).toBeTruthy();

      const parsed = JSON.parse(experiments!);
      expect(parsed['test-1'].variantId).toBe('control');
      expect(parsed['test-1'].isNew).toBe(false);
    });

    it('should call onAssignment for new assignments', async () => {
      let assignmentCalled = false;

      const middleware = abTestingMiddleware({
        experiments: [mockExperiment],
        onAssignment: () => {
          assignmentCalled = true;
        },
      });

      const request = new Request('https://example.com/');
      await executeEdgeMiddleware(request, middleware);

      expect(assignmentCalled).toBe(true);
    });

    it('should not call onAssignment for existing assignments', async () => {
      let assignmentCalled = false;

      const middleware = abTestingMiddleware({
        experiments: [mockExperiment],
        onAssignment: () => {
          assignmentCalled = true;
        },
      });

      const request = new Request('https://example.com/', {
        headers: { Cookie: 'exp_test-1=control' },
      });
      await executeEdgeMiddleware(request, middleware);

      expect(assignmentCalled).toBe(false);
    });

    it('should respect traffic allocation', async () => {
      const lowTrafficExperiment: Experiment = {
        ...mockExperiment,
        traffic: 0, // 0% traffic
      };

      const middleware = abTestingMiddleware({
        experiments: [lowTrafficExperiment],
      });

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware);

      const experiments = response.headers.get('X-Experiments');
      expect(experiments).toBeFalsy();
    });

    it('should use custom cookie name', async () => {
      const experiment: Experiment = {
        ...mockExperiment,
        cookieName: 'custom_exp',
      };

      const middleware = abTestingMiddleware({
        experiments: [experiment],
      });

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware);

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('custom_exp=');
    });
  });

  describe('Targeting', () => {
    it('should target specific countries', async () => {
      const experiment: Experiment = {
        ...mockExperiment,
        targeting: {
          countries: ['US', 'CA'],
        },
      };

      const middleware = abTestingMiddleware({
        experiments: [experiment],
      });

      // US should be targeted
      const usRequest = new Request('https://example.com/');
      const usResponse = await executeEdgeMiddleware(usRequest, middleware, {
        geo: { country: 'US' },
      });
      expect(usResponse.headers.get('X-Experiments')).toBeTruthy();

      // UK should not be targeted
      const ukRequest = new Request('https://example.com/');
      const ukResponse = await executeEdgeMiddleware(ukRequest, middleware, {
        geo: { country: 'UK' },
      });
      expect(ukResponse.headers.get('X-Experiments')).toBeFalsy();
    });

    it('should target URL patterns', async () => {
      const experiment: Experiment = {
        ...mockExperiment,
        targeting: {
          urlPatterns: ['/products/*'],
        },
      };

      const middleware = abTestingMiddleware({
        experiments: [experiment],
      });

      // /products/ should be targeted
      const productRequest = new Request('https://example.com/products/123');
      const productResponse = await executeEdgeMiddleware(productRequest, middleware);
      expect(productResponse.headers.get('X-Experiments')).toBeTruthy();

      // /about should not be targeted
      const aboutRequest = new Request('https://example.com/about');
      const aboutResponse = await executeEdgeMiddleware(aboutRequest, middleware);
      expect(aboutResponse.headers.get('X-Experiments')).toBeFalsy();
    });

    it('should use custom targeting function', async () => {
      const experiment: Experiment = {
        ...mockExperiment,
        targeting: {
          custom: (context) => {
            return context.request.headers.get('X-Test-User') === 'true';
          },
        },
      };

      const middleware = abTestingMiddleware({
        experiments: [experiment],
      });

      // With header should be targeted
      const withHeader = new Request('https://example.com/', {
        headers: { 'X-Test-User': 'true' },
      });
      const withResponse = await executeEdgeMiddleware(withHeader, middleware);
      expect(withResponse.headers.get('X-Experiments')).toBeTruthy();

      // Without header should not be targeted
      const withoutHeader = new Request('https://example.com/');
      const withoutResponse = await executeEdgeMiddleware(withoutHeader, middleware);
      expect(withoutResponse.headers.get('X-Experiments')).toBeFalsy();
    });
  });

  describe('variantMiddleware', () => {
    it('should execute variant-specific middleware', async () => {
      let executedVariant: string | null = null;

      const abMiddleware = abTestingMiddleware({
        experiments: [mockExperiment],
      });

      const variantMw = variantMiddleware('test-1', {
        control: async (context) => {
          executedVariant = 'control';
          return context.next();
        },
        'variant-a': async (context) => {
          executedVariant = 'variant-a';
          return context.next();
        },
      });

      const request = new Request('https://example.com/', {
        headers: { Cookie: 'exp_test-1=control' },
      });

      await executeEdgeMiddleware(request, [abMiddleware, variantMw]);
      expect(executedVariant).toBe('control');
    });

    it('should use default handler if variant not found', async () => {
      let usedDefault = false;

      const abMiddleware = abTestingMiddleware({
        experiments: [mockExperiment],
      });

      const variantMw = variantMiddleware('test-1', {
        default: async (context) => {
          usedDefault = true;
          return context.next();
        },
      });

      const request = new Request('https://example.com/', {
        headers: { Cookie: 'exp_test-1=unknown-variant' },
      });

      await executeEdgeMiddleware(request, [abMiddleware, variantMw]);
      expect(usedDefault).toBe(true);
    });
  });

  describe('variantRewriteMiddleware', () => {
    it('should rewrite URL based on variant', async () => {
      const abMiddleware = abTestingMiddleware({
        experiments: [mockExperiment],
      });

      const rewriteMw = variantRewriteMiddleware('test-1', {
        control: '/control-page',
        'variant-a': '/variant-a-page',
      });

      const request = new Request('https://example.com/', {
        headers: { Cookie: 'exp_test-1=variant-a' },
      });

      const response = await executeEdgeMiddleware(request, [abMiddleware, rewriteMw]);
      expect(response).toBeDefined();
    });
  });

  describe('multivariateTestingMiddleware', () => {
    it('should assign variants for multiple factors', async () => {
      const middleware = multivariateTestingMiddleware({
        id: 'mvt-1',
        name: 'Multivariate Test',
        factors: [
          {
            id: 'headline',
            name: 'Headline',
            variants: [
              { id: 'h1', name: 'Headline 1', weight: 50 },
              { id: 'h2', name: 'Headline 2', weight: 50 },
            ],
          },
          {
            id: 'cta',
            name: 'Call to Action',
            variants: [
              { id: 'c1', name: 'CTA 1', weight: 50 },
              { id: 'c2', name: 'CTA 2', weight: 50 },
            ],
          },
        ],
      });

      const request = new Request('https://example.com/');
      const response = await executeEdgeMiddleware(request, middleware);

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('mvt_mvt-1_headline=');
      expect(setCookie).toContain('mvt_mvt-1_cta=');
    });

    it('should call onAssignment with all factor assignments', async () => {
      let capturedAssignments: any = null;

      const middleware = multivariateTestingMiddleware(
        {
          id: 'mvt-1',
          name: 'Multivariate Test',
          factors: [
            {
              id: 'factor1',
              name: 'Factor 1',
              variants: [{ id: 'f1', name: 'F1', weight: 100 }],
            },
          ],
        },
        {
          onAssignment: (assignments) => {
            capturedAssignments = assignments;
          },
        }
      );

      const request = new Request('https://example.com/');
      await executeEdgeMiddleware(request, middleware);

      expect(capturedAssignments).toBeTruthy();
      expect(capturedAssignments.factor1).toBeTruthy();
    });
  });

  describe('selectVariantDeterministic', () => {
    it('should return same variant for same user ID', () => {
      const variants: Variant[] = [
        { id: 'a', name: 'A', weight: 50 },
        { id: 'b', name: 'B', weight: 50 },
      ];

      const variant1 = selectVariantDeterministic(variants, 'user123');
      const variant2 = selectVariantDeterministic(variants, 'user123');

      expect(variant1).toEqual(variant2);
    });

    it('should distribute variants according to weights', () => {
      const variants: Variant[] = [
        { id: 'a', name: 'A', weight: 80 },
        { id: 'b', name: 'B', weight: 20 },
      ];

      const results = { a: 0, b: 0 };

      // Test with 1000 different user IDs
      for (let i = 0; i < 1000; i++) {
        const variant = selectVariantDeterministic(variants, `user${i}`);
        results[variant.id as 'a' | 'b']++;
      }

      // Should be roughly 80/20 distribution (allow for some variance)
      expect(results.a).toBeGreaterThan(700);
      expect(results.a).toBeLessThan(900);
      expect(results.b).toBeGreaterThan(100);
      expect(results.b).toBeLessThan(300);
    });
  });

  describe('calculateSignificance', () => {
    it('should calculate statistical significance', () => {
      const control = {
        variantId: 'control',
        impressions: 1000,
        conversions: 100,
        conversionRate: 0.1,
      };

      const variant = {
        variantId: 'variant',
        impressions: 1000,
        conversions: 150,
        conversionRate: 0.15,
      };

      const result = calculateSignificance(control, variant);

      expect(result.zScore).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(0.05);
      expect(result.isSignificant).toBe(true);
      expect(result.confidence).toBeGreaterThan(95);
    });

    it('should not be significant with small difference', () => {
      const control = {
        variantId: 'control',
        impressions: 100,
        conversions: 10,
        conversionRate: 0.1,
      };

      const variant = {
        variantId: 'variant',
        impressions: 100,
        conversions: 11,
        conversionRate: 0.11,
      };

      const result = calculateSignificance(control, variant);

      expect(result.isSignificant).toBe(false);
      expect(result.pValue).toBeGreaterThan(0.05);
    });

    it('should handle identical variants', () => {
      const control = {
        variantId: 'control',
        impressions: 1000,
        conversions: 100,
        conversionRate: 0.1,
      };

      const variant = {
        variantId: 'variant',
        impressions: 1000,
        conversions: 100,
        conversionRate: 0.1,
      };

      const result = calculateSignificance(control, variant);

      expect(result.zScore).toBeCloseTo(0, 1);
      expect(result.isSignificant).toBe(false);
    });
  });

  describe('Client-side hooks', () => {
    it('should access experiments from window object', () => {
      // Mock window object
      (global as any).window = {
        __EXPERIMENTS__: {
          'test-1': {
            experimentId: 'test-1',
            variantId: 'control',
            variantName: 'Control',
            isNew: false,
          },
        },
      };

      const { useVariant, isVariant, getActiveExperiments } = require('./edge-ab-testing.js');

      const result = useVariant('test-1');
      expect(result.variant).toBe('Control');
      expect(result.isLoading).toBe(false);

      expect(isVariant('test-1', 'Control')).toBe(true);
      expect(isVariant('test-1', 'Variant')).toBe(false);

      const experiments = getActiveExperiments();
      expect(experiments['test-1']).toBeTruthy();

      delete (global as any).window;
    });
  });
});
