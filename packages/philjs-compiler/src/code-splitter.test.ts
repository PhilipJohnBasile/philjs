/**
 * Tests for Code Splitter
 */

import { describe, it, expect } from 'vitest';
import { CodeSplitter } from './code-splitter';

describe('CodeSplitter', () => {
  it('should identify routes that need code splitting', () => {
    const files = new Map([
      [
        'src/routes/dashboard.tsx',
        `
        import { Chart } from 'chart.js';
        export default function Dashboard() {
          return <div><Chart /></div>;
        }
      `,
      ],
      [
        'src/routes/index.tsx',
        `
        export default function Home() {
          return <div>Home</div>;
        }
      `,
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    // Dashboard has heavy dependency (chart.js) so should be split
    const dashboardBoundary = report.boundaries.find(b =>
      b.route.includes('dashboard')
    );
    expect(dashboardBoundary).toBeDefined();
  });

  it('should not split very small components', () => {
    const files = new Map([
      [
        'src/routes/tiny.tsx',
        `
        export default function Tiny() {
          return <div>Tiny</div>;
        }
      `,
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    // Small component should not be split
    expect(report.boundaries).toHaveLength(0);
  });

  it('should calculate correct priority for routes', () => {
    const files = new Map([
      [
        'src/routes/index.tsx',
        'export default function Home() { return <div>'.repeat(60) + '</div>'.repeat(60),
      ],
      [
        'src/routes/admin/settings.tsx',
        'export default function Settings() { return <div>'.repeat(60) + '</div>'.repeat(60),
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    // Index route should be high priority
    const indexBoundary = report.boundaries.find(b => b.route === '/');
    if (indexBoundary) {
      expect(indexBoundary.priority).toBe('high');
    }

    // Deeply nested route should be low priority
    const settingsBoundary = report.boundaries.find(b =>
      b.route.includes('settings')
    );
    if (settingsBoundary) {
      expect(settingsBoundary.priority).toBe('low');
    }
  });

  it('should generate lazy import statements', () => {
    const files = new Map([
      [
        'src/routes/dashboard.tsx',
        'import { Chart } from "chart.js";\n' + 'x'.repeat(300),
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    const boundary = report.boundaries[0];
    expect(boundary.lazyImport).toContain('lazy');
    expect(boundary.lazyImport).toContain('import(');
    expect(boundary.lazyImport).toContain('/*#__PURE__*/');
  });

  it('should estimate bundle size savings', () => {
    const files = new Map([
      [
        'src/routes/large1.tsx',
        'x'.repeat(10000), // ~10KB
      ],
      [
        'src/routes/large2.tsx',
        'x'.repeat(10000), // ~10KB
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    expect(report.estimatedSavings).toBeGreaterThan(0);
    expect(report.totalChunks).toBeGreaterThan(0);
  });

  it('should detect heavy dependencies', () => {
    const heavyDependencies = [
      'chart.js',
      'd3',
      'three',
      '@tensorflow/tfjs',
      'monaco-editor',
    ];

    heavyDependencies.forEach(dep => {
      const files = new Map([
        [
          'src/routes/test.tsx',
          `
          import Something from '${dep}';
          export default function Test() {
            return <div><Something /></div>;
          }
        `,
        ],
      ]);

      const splitter = new CodeSplitter();
      const report = splitter.analyzeRoutes('src/routes', files);

      expect(report.boundaries.length).toBeGreaterThan(0);
      expect(report.recommendations).toContainEqual(
        expect.stringContaining('lazy-loaded')
      );
    });
  });

  it('should generate manual chunks configuration', () => {
    const boundaries = [
      {
        route: '/dashboard',
        filePath: 'src/routes/dashboard.tsx',
        lazyImport: 'const Dashboard = lazy(() => import("..."))',
        estimatedSize: 200,
        dependencies: [],
        priority: 'medium' as const,
      },
      {
        route: '/profile',
        filePath: 'src/routes/profile.tsx',
        lazyImport: 'const Profile = lazy(() => import("..."))',
        estimatedSize: 150,
        dependencies: [],
        priority: 'low' as const,
      },
    ];

    const manualChunks = CodeSplitter.generateManualChunks(boundaries);

    expect(manualChunks['routes/dashboard']).toEqual(['src/routes/dashboard.tsx']);
    expect(manualChunks['routes/profile']).toEqual(['src/routes/profile.tsx']);
  });

  it('should generate Vite dynamic imports', () => {
    const boundaries = [
      {
        route: '/dashboard',
        filePath: 'src/routes/dashboard.tsx',
        lazyImport: '',
        estimatedSize: 200,
        dependencies: [],
        priority: 'medium' as const,
      },
    ];

    const dynamicImports = CodeSplitter.generateViteDynamicImports(boundaries);

    expect(dynamicImports).toContain('src/routes/dashboard.tsx');
  });

  it('should handle route params correctly', () => {
    const files = new Map([
      [
        'src/routes/users/[id].tsx',
        'x'.repeat(300),
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    const boundary = report.boundaries[0];
    expect(boundary.route).toContain(':id');
  });

  it('should ignore layout and middleware files', () => {
    const files = new Map([
      [
        'src/routes/_layout.tsx',
        'x'.repeat(300),
      ],
      [
        'src/routes/_middleware.tsx',
        'x'.repeat(300),
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    // Layout and middleware files should not be treated as routes
    expect(report.boundaries).toHaveLength(0);
  });

  it('should provide optimization recommendations', () => {
    const files = new Map([
      [
        'src/routes/heavy.tsx',
        'import chart from "chart.js";\n' + 'x'.repeat(300),
      ],
    ]);

    const splitter = new CodeSplitter();
    const report = splitter.analyzeRoutes('src/routes', files);

    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations[0]).toContain('lazy-loaded');
  });
});
