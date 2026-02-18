import { describe, it, expect, vi } from 'vitest';
import { optimizePerformance } from '../auto-optimize.js';

describe('PhilJS Perf: Auto-Optimize', () => {
  it('should return optimized files and performance gain', async () => {
    // Mock console.log to avoid output during tests
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await optimizePerformance();

    expect(result).toHaveProperty('optimizedFiles');
    expect(result).toHaveProperty('perfGain');
    expect(result.optimizedFiles).toContain('DashboardChart.tsx');
    expect(result.perfGain).toBe('40%');

    consoleSpy.mockRestore();
  });

  it('should log profiling steps', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await optimizePerformance();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Profiling'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('re-renders'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('React.memo'));

    consoleSpy.mockRestore();
  });
});
