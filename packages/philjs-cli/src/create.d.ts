#!/usr/bin/env node
/**
 * PhilJS Create Command
 * Interactive project scaffolding with templates
 */
export interface ProjectConfig {
    name: string;
    template: 'basic' | 'ssr' | 'spa' | 'fullstack' | 'library';
    typescript: boolean;
    cssFramework: 'none' | 'tailwind' | 'css-modules' | 'styled';
    testing: boolean;
    testFramework?: 'vitest' | 'jest';
    linting: boolean;
    git: boolean;
    packageManager: 'npm' | 'pnpm' | 'yarn';
}
export declare function createProject(projectName?: string): Promise<void>;
//# sourceMappingURL=create.d.ts.map