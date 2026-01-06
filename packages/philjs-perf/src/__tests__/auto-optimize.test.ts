import { describe, it, expect } from 'vitest';
import { AutoOptimize } from '../auto-optimize.js';

describe('PhilJS Perf: Auto-Optimize', () => {
    it('should suggest memoization for expensive calculations', () => {
        const code = `
      function expensive(n) {
        // heavy work
        return n * 2;
      }
      const val = expensive(props.val);
    `;
        const optimized = AutoOptimize.optimize(code);
        expect(optimized).toContain('memo(() =>');
    });

    it('should detect unnecessary re-renders', () => {
        // Mock analysis
        const stats = AutoOptimize.analyzeRenderCount();
        expect(stats).toBeDefined();
    });
});
