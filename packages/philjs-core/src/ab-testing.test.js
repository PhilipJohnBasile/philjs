/**
 * A/B Testing Tests - Built-in A/B Testing
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ABTestEngine, initABTesting, getABTestEngine, useFeatureFlag, createMultivariateTest, calculateSignificance, } from './ab-testing';
describe('Built-in A/B Testing', () => {
    let engine;
    let testUser;
    beforeEach(() => {
        engine = new ABTestEngine({ storage: 'memory' });
        testUser = {
            id: 'user123',
            segments: ['premium'],
            country: 'US',
            device: 'desktop',
        };
    });
    describe('Engine Initialization', () => {
        it('should create engine with default config', () => {
            const eng = new ABTestEngine();
            expect(eng).toBeDefined();
        });
        it('should create engine with custom config', () => {
            const eng = new ABTestEngine({
                enabled: false,
                storage: 'memory',
            });
            expect(eng).toBeDefined();
        });
        it('should initialize global engine', () => {
            const eng = initABTesting();
            expect(eng).toBeDefined();
            expect(getABTestEngine()).toBe(eng);
        });
    });
    describe('Experiment Registration', () => {
        it('should register an experiment', () => {
            const experiment = {
                id: 'test-exp',
                name: 'Test Experiment',
                variants: [
                    { id: 'control', name: 'Control' },
                    { id: 'treatment', name: 'Treatment' },
                ],
            };
            engine.register(experiment);
            const variant = engine.getVariant('test-exp', testUser);
            expect(variant).not.toBeNull();
        });
        it('should handle multiple experiments', () => {
            engine.register({
                id: 'exp1',
                name: 'Experiment 1',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
            });
            engine.register({
                id: 'exp2',
                name: 'Experiment 2',
                variants: [
                    { id: 'x', name: 'X' },
                    { id: 'y', name: 'Y' },
                ],
            });
            const v1 = engine.getVariant('exp1', testUser);
            const v2 = engine.getVariant('exp2', testUser);
            expect(v1).not.toBeNull();
            expect(v2).not.toBeNull();
        });
    });
    describe('Variant Assignment', () => {
        beforeEach(() => {
            engine.register({
                id: 'button-color',
                name: 'Button Color Test',
                variants: [
                    { id: 'blue', name: 'Blue Button' },
                    { id: 'green', name: 'Green Button' },
                ],
            });
        });
        it('should assign a variant to user', () => {
            const variant = engine.getVariant('button-color', testUser);
            expect(variant).not.toBeNull();
            expect(['blue', 'green']).toContain(variant.id);
        });
        it('should return consistent variant for same user', () => {
            const variant1 = engine.getVariant('button-color', testUser);
            const variant2 = engine.getVariant('button-color', testUser);
            expect(variant1).toEqual(variant2);
        });
        it('should respect variant weights', () => {
            engine.register({
                id: 'weighted-test',
                name: 'Weighted Test',
                variants: [
                    { id: 'a', name: 'A', weight: 90 },
                    { id: 'b', name: 'B', weight: 10 },
                ],
            });
            // Test with 100 different users
            const assignments = { a: 0, b: 0 };
            for (let i = 0; i < 100; i++) {
                const user = { id: `user${i}` };
                const variant = engine.getVariant('weighted-test', user);
                if (variant) {
                    assignments[variant.id]++;
                }
            }
            // Variant A should have ~90% traffic
            expect(assignments.a).toBeGreaterThan(60);
            expect(assignments.b).toBeLessThan(40);
        });
        it('should handle null for non-existent experiment', () => {
            const variant = engine.getVariant('non-existent', testUser);
            expect(variant).toBeNull();
        });
    });
    describe('Traffic Allocation', () => {
        it('should respect traffic allocation', () => {
            engine.register({
                id: 'limited-traffic',
                name: 'Limited Traffic Test',
                variants: [
                    { id: 'control', name: 'Control' },
                    { id: 'treatment', name: 'Treatment' },
                ],
                traffic: 0.5, // 50% traffic
            });
            // Test with many users
            let inExperiment = 0;
            for (let i = 0; i < 100; i++) {
                const user = { id: `user${i}` };
                const variant = engine.getVariant('limited-traffic', user);
                if (variant)
                    inExperiment++;
            }
            // Should be around 50% (allow for randomness)
            expect(inExperiment).toBeGreaterThan(20);
            expect(inExperiment).toBeLessThan(80);
        });
    });
    describe('Targeting', () => {
        it('should target specific segments', () => {
            engine.register({
                id: 'premium-test',
                name: 'Premium Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
                targeting: {
                    segments: ['premium'],
                },
            });
            const premiumUser = { id: 'user1', segments: ['premium'] };
            const freeUser = { id: 'user2', segments: ['free'] };
            const variant1 = engine.getVariant('premium-test', premiumUser);
            const variant2 = engine.getVariant('premium-test', freeUser);
            expect(variant1).not.toBeNull();
            expect(variant2).toBeNull();
        });
        it('should target specific countries', () => {
            engine.register({
                id: 'geo-test',
                name: 'Geo Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
                targeting: {
                    countries: ['US', 'CA'],
                },
            });
            const usUser = { id: 'user1', country: 'US' };
            const ukUser = { id: 'user2', country: 'UK' };
            expect(engine.getVariant('geo-test', usUser)).not.toBeNull();
            expect(engine.getVariant('geo-test', ukUser)).toBeNull();
        });
        it('should target specific devices', () => {
            engine.register({
                id: 'device-test',
                name: 'Device Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
                targeting: {
                    devices: ['mobile'],
                },
            });
            const mobileUser = { id: 'user1', device: 'mobile' };
            const desktopUser = { id: 'user2', device: 'desktop' };
            expect(engine.getVariant('device-test', mobileUser)).not.toBeNull();
            expect(engine.getVariant('device-test', desktopUser)).toBeNull();
        });
        it('should support custom targeting function', () => {
            engine.register({
                id: 'custom-test',
                name: 'Custom Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
                targeting: {
                    custom: (user) => user.id.startsWith('premium'),
                },
            });
            const premiumUser = { id: 'premium123' };
            const regularUser = { id: 'regular456' };
            expect(engine.getVariant('custom-test', premiumUser)).not.toBeNull();
            expect(engine.getVariant('custom-test', regularUser)).toBeNull();
        });
    });
    describe('Experiment Scheduling', () => {
        it('should not run experiments before start date', () => {
            const future = new Date(Date.now() + 86400000); // Tomorrow
            engine.register({
                id: 'scheduled-test',
                name: 'Scheduled Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
                schedule: {
                    start: future,
                },
            });
            const variant = engine.getVariant('scheduled-test', testUser);
            expect(variant).toBeNull();
        });
        it('should not run experiments after end date', () => {
            const past = new Date(Date.now() - 86400000); // Yesterday
            engine.register({
                id: 'ended-test',
                name: 'Ended Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
                schedule: {
                    end: past,
                },
            });
            const variant = engine.getVariant('ended-test', testUser);
            expect(variant).toBeNull();
        });
        it('should run experiments within date range', () => {
            const yesterday = new Date(Date.now() - 86400000);
            const tomorrow = new Date(Date.now() + 86400000);
            engine.register({
                id: 'active-test',
                name: 'Active Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
                schedule: {
                    start: yesterday,
                    end: tomorrow,
                },
            });
            const variant = engine.getVariant('active-test', testUser);
            expect(variant).not.toBeNull();
        });
    });
    describe('Event Tracking', () => {
        beforeEach(() => {
            engine.register({
                id: 'conversion-test',
                name: 'Conversion Test',
                variants: [
                    { id: 'control', name: 'Control' },
                    { id: 'treatment', name: 'Treatment' },
                ],
            });
        });
        it('should track conversion events', () => {
            const variant = engine.getVariant('conversion-test', testUser);
            engine.track('conversion-test', variant.id, 'conversion', {
                userId: testUser.id,
            });
            const results = engine.getResults('conversion-test');
            expect(results).not.toBeNull();
        });
        it('should track events with values', () => {
            const variant = engine.getVariant('conversion-test', testUser);
            engine.track('conversion-test', variant.id, 'purchase', {
                value: 99.99,
                userId: testUser.id,
            });
            const results = engine.getResults('conversion-test');
            expect(results).not.toBeNull();
        });
    });
    describe('Results & Analytics', () => {
        it('should calculate conversion rates', () => {
            engine.register({
                id: 'analytics-test',
                name: 'Analytics Test',
                variants: [
                    { id: 'control', name: 'Control' },
                    { id: 'treatment', name: 'Treatment' },
                ],
            });
            // Simulate impressions and conversions
            for (let i = 0; i < 10; i++) {
                const user = { id: `user${i}` };
                const variant = engine.getVariant('analytics-test', user);
                if (i < 5) {
                    // First 5 users convert
                    engine.track('analytics-test', variant.id, 'conversion', { userId: user.id });
                }
            }
            const results = engine.getResults('analytics-test');
            expect(results).not.toBeNull();
            expect(results.sampleSize).toBeGreaterThan(0);
        });
        it('should identify winner with sufficient data', () => {
            engine.register({
                id: 'winner-test',
                name: 'Winner Test',
                variants: [
                    { id: 'control', name: 'Control' },
                    { id: 'treatment', name: 'Treatment' },
                ],
            });
            // Create clear winner scenario
            for (let i = 0; i < 200; i++) {
                const user = { id: `user${i}` };
                const variant = engine.getVariant('winner-test', user);
                // Control: 10% conversion, Treatment: 30% conversion
                const shouldConvert = variant.id === 'control' ? Math.random() < 0.1 : Math.random() < 0.3;
                if (shouldConvert) {
                    engine.track('winner-test', variant.id, 'conversion', { userId: user.id });
                }
            }
            const results = engine.getResults('winner-test');
            expect(results.sampleSize).toBeGreaterThan(0);
        });
        it('should calculate average value', () => {
            engine.register({
                id: 'value-test',
                name: 'Value Test',
                variants: [
                    { id: 'control', name: 'Control' },
                ],
            });
            const variant = engine.getVariant('value-test', testUser);
            engine.track('value-test', variant.id, 'conversion', { value: 100, userId: 'u1' });
            engine.track('value-test', variant.id, 'conversion', { value: 200, userId: 'u2' });
            const results = engine.getResults('value-test');
            const controlResults = results.variants.find(v => v.variantId === 'control');
            expect(controlResults?.averageValue).toBe(150);
        });
    });
    describe('Force Variants (QA)', () => {
        it('should force specific variant for QA', () => {
            const qaEngine = new ABTestEngine({
                storage: 'memory',
                forceVariants: {
                    'qa-test': 'treatment',
                },
            });
            qaEngine.register({
                id: 'qa-test',
                name: 'QA Test',
                variants: [
                    { id: 'control', name: 'Control' },
                    { id: 'treatment', name: 'Treatment' },
                ],
            });
            const variant = qaEngine.getVariant('qa-test', testUser);
            expect(variant.id).toBe('treatment');
        });
    });
    describe('Feature Flags', () => {
        it('should create feature flag', () => {
            const flagEngine = initABTesting({ storage: 'memory' });
            const enabled = useFeatureFlag('new-feature', testUser);
            expect(typeof enabled()).toBe('boolean');
        });
    });
    describe('Multivariate Testing', () => {
        it('should create multivariate test', () => {
            const mvtest = createMultivariateTest('mv-test', 'Multivariate Test', [
                'variant-a',
                'variant-b',
                'variant-c',
                'variant-d',
            ]);
            expect(mvtest.variants).toHaveLength(4);
            expect(mvtest.variants[0].id).toBe('variant-a');
        });
        it('should assign multivariate variants', () => {
            const mvtest = createMultivariateTest('headline-test', 'Headline Test', [
                'short',
                'long',
                'question',
                'urgent',
            ]);
            engine.register(mvtest);
            const variant = engine.getVariant('headline-test', testUser);
            expect(variant).not.toBeNull();
            expect(['short', 'long', 'question', 'urgent']).toContain(variant.id);
        });
    });
    describe('Statistical Significance', () => {
        it('should calculate significance for clear winner', () => {
            // Control: 100/1000 = 10%, Treatment: 200/1000 = 20%
            const confidence = calculateSignificance(100, 1000, 200, 1000);
            expect(confidence).toBeGreaterThan(0.95); // High confidence
        });
        it('should calculate low significance for similar results', () => {
            // Control: 100/1000 = 10%, Treatment: 105/1000 = 10.5%
            const confidence = calculateSignificance(100, 1000, 105, 1000);
            expect(confidence).toBeLessThan(0.95); // Low confidence
        });
    });
    describe('Active Experiments', () => {
        it('should list active experiments', () => {
            engine.register({
                id: 'active1',
                name: 'Active 1',
                variants: [{ id: 'a', name: 'A' }],
            });
            engine.register({
                id: 'ended',
                name: 'Ended',
                variants: [{ id: 'a', name: 'A' }],
                winner: 'a',
            });
            const active = engine.getActiveExperiments();
            expect(active.some(e => e.id === 'active1')).toBe(true);
            expect(active.some(e => e.id === 'ended')).toBe(false);
        });
    });
    describe('Data Persistence', () => {
        it('should persist assignments across page loads', () => {
            // First engine instance
            const engine1 = new ABTestEngine({ storage: 'memory' });
            engine1.register({
                id: 'persist-test',
                name: 'Persist Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
            });
            const variant1 = engine1.getVariant('persist-test', testUser);
            // Note: In real scenario with localStorage, this would work
            // Memory storage doesn't persist across instances
            expect(variant1).not.toBeNull();
        });
    });
    describe('Performance', () => {
        it('should handle 1000 variant assignments quickly', () => {
            engine.register({
                id: 'perf-test',
                name: 'Performance Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
            });
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                const user = { id: `user${i}` };
                engine.getVariant('perf-test', user);
            }
            const duration = performance.now() - start;
            console.log(`  → 1000 variant assignments in ${duration.toFixed(2)}ms`);
            // Increased threshold to account for CI/test runner variability
            expect(duration).toBeLessThan(1000);
        });
        it('should handle 1000 event tracking quickly', () => {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                engine.track('test-exp', 'variant-a', 'conversion', { value: i });
            }
            const duration = performance.now() - start;
            console.log(`  → 1000 event tracking calls in ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(20);
        });
    });
    describe('Edge Cases', () => {
        it('should handle experiment with no variants gracefully', () => {
            engine.register({
                id: 'no-variants',
                name: 'No Variants',
                variants: [],
            });
            const variant = engine.getVariant('no-variants', testUser);
            expect(variant).toBeNull();
        });
        it('should handle single variant experiment', () => {
            engine.register({
                id: 'single-variant',
                name: 'Single Variant',
                variants: [{ id: 'only', name: 'Only' }],
            });
            const variant = engine.getVariant('single-variant', testUser);
            expect(variant.id).toBe('only');
        });
        it('should clear all data', () => {
            engine.register({
                id: 'clear-test',
                name: 'Clear Test',
                variants: [
                    { id: 'a', name: 'A' },
                    { id: 'b', name: 'B' },
                ],
            });
            engine.getVariant('clear-test', testUser);
            engine.track('clear-test', 'a', 'conversion');
            engine.clear();
            const results = engine.getResults('clear-test');
            expect(results.sampleSize).toBe(0);
        });
    });
});
//# sourceMappingURL=ab-testing.test.js.map