/**
 * PhilJS Migrate - Project Analyzer
 */
export interface ProjectAnalysis {
    framework: 'react' | 'vue' | 'svelte' | 'unknown';
    version?: string;
    typescript: boolean;
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
    features: FrameworkFeatures;
    complexity: ComplexityMetrics;
    dependencies: DependencyInfo[];
}
export interface FrameworkFeatures {
    hooks: boolean;
    context: boolean;
    redux: boolean;
    router: boolean;
    stateManagement: string[];
    cssFramework: string[];
    testingFramework: string[];
}
export interface ComplexityMetrics {
    totalFiles: number;
    componentFiles: number;
    linesOfCode: number;
    avgComponentSize: number;
    maxComponentSize: number;
}
export interface DependencyInfo {
    name: string;
    version: string;
    category: 'framework' | 'state' | 'routing' | 'testing' | 'styling' | 'other';
    philjsEquivalent?: string;
}
export declare function analyzeProject(projectPath: string): Promise<ProjectAnalysis>;
//# sourceMappingURL=analyze.d.ts.map