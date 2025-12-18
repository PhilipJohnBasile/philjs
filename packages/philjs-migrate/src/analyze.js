/**
 * PhilJS Migrate - Project Analyzer
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
export async function analyzeProject(projectPath) {
    const analysis = {
        framework: 'unknown',
        typescript: false,
        packageManager: 'unknown',
        features: {
            hooks: false,
            context: false,
            redux: false,
            router: false,
            stateManagement: [],
            cssFramework: [],
            testingFramework: [],
        },
        complexity: {
            totalFiles: 0,
            componentFiles: 0,
            linesOfCode: 0,
            avgComponentSize: 0,
            maxComponentSize: 0,
        },
        dependencies: [],
    };
    // Read package.json
    try {
        const packageJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
        // Detect framework
        analysis.framework = detectFramework(packageJson);
        analysis.version = getFrameworkVersion(packageJson, analysis.framework);
        // Detect TypeScript
        analysis.typescript = !!packageJson.devDependencies?.typescript ||
            !!packageJson.dependencies?.typescript;
        // Analyze dependencies
        analysis.dependencies = analyzeDependencies(packageJson);
        // Detect features
        analysis.features = detectFeatures(packageJson);
    }
    catch (error) {
        console.warn('Could not read package.json:', error);
    }
    // Detect package manager
    analysis.packageManager = await detectPackageManager(projectPath);
    // Analyze code complexity
    analysis.complexity = await analyzeCodeComplexity(projectPath, analysis.framework);
    return analysis;
}
function detectFramework(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (deps.react || deps['react-dom'])
        return 'react';
    if (deps.vue)
        return 'vue';
    if (deps.svelte)
        return 'svelte';
    return 'unknown';
}
function getFrameworkVersion(packageJson, framework) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    switch (framework) {
        case 'react':
            return deps.react;
        case 'vue':
            return deps.vue;
        case 'svelte':
            return deps.svelte;
        default:
            return undefined;
    }
}
function analyzeDependencies(packageJson) {
    const deps = [];
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const categoryMap = {
        // React ecosystem
        'react': { category: 'framework', philjs: 'philjs-core' },
        'react-dom': { category: 'framework', philjs: 'philjs-core' },
        'react-router': { category: 'routing', philjs: 'philjs-router' },
        'react-router-dom': { category: 'routing', philjs: 'philjs-router' },
        '@tanstack/react-query': { category: 'state', philjs: 'philjs-core (signals)' },
        'redux': { category: 'state', philjs: 'philjs-core (signals)' },
        '@reduxjs/toolkit': { category: 'state', philjs: 'philjs-core (signals)' },
        'zustand': { category: 'state', philjs: 'philjs-core (signals)' },
        'jotai': { category: 'state', philjs: 'philjs-core (signals)' },
        'recoil': { category: 'state', philjs: 'philjs-core (signals)' },
        'mobx': { category: 'state', philjs: 'philjs-core (signals)' },
        // Vue ecosystem
        'vue': { category: 'framework', philjs: 'philjs-core' },
        'vue-router': { category: 'routing', philjs: 'philjs-router' },
        'pinia': { category: 'state', philjs: 'philjs-core (signals)' },
        'vuex': { category: 'state', philjs: 'philjs-core (signals)' },
        // Svelte ecosystem
        'svelte': { category: 'framework', philjs: 'philjs-core' },
        'svelte-routing': { category: 'routing', philjs: 'philjs-router' },
        // Testing
        'jest': { category: 'testing', philjs: 'vitest + philjs-testing' },
        'vitest': { category: 'testing', philjs: 'vitest + philjs-testing' },
        '@testing-library/react': { category: 'testing', philjs: 'philjs-testing' },
        '@testing-library/vue': { category: 'testing', philjs: 'philjs-testing' },
        'cypress': { category: 'testing' },
        'playwright': { category: 'testing' },
        // Styling
        'tailwindcss': { category: 'styling' },
        'styled-components': { category: 'styling' },
        '@emotion/react': { category: 'styling' },
        'sass': { category: 'styling' },
    };
    for (const [name, version] of Object.entries(allDeps)) {
        const info = categoryMap[name];
        deps.push({
            name,
            version: version,
            category: info?.category || 'other',
            philjsEquivalent: info?.philjs,
        });
    }
    return deps;
}
function detectFeatures(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const features = {
        hooks: true, // Assume hooks for modern projects
        context: true,
        redux: !!deps.redux || !!deps['@reduxjs/toolkit'],
        router: !!deps['react-router'] || !!deps['react-router-dom'] || !!deps['vue-router'],
        stateManagement: [],
        cssFramework: [],
        testingFramework: [],
    };
    // State management
    if (deps.redux || deps['@reduxjs/toolkit'])
        features.stateManagement.push('Redux');
    if (deps.zustand)
        features.stateManagement.push('Zustand');
    if (deps.jotai)
        features.stateManagement.push('Jotai');
    if (deps.recoil)
        features.stateManagement.push('Recoil');
    if (deps.mobx)
        features.stateManagement.push('MobX');
    if (deps.pinia)
        features.stateManagement.push('Pinia');
    if (deps.vuex)
        features.stateManagement.push('Vuex');
    // CSS frameworks
    if (deps.tailwindcss)
        features.cssFramework.push('Tailwind');
    if (deps['styled-components'])
        features.cssFramework.push('Styled Components');
    if (deps['@emotion/react'])
        features.cssFramework.push('Emotion');
    if (deps.sass || deps['node-sass'])
        features.cssFramework.push('Sass');
    // Testing
    if (deps.jest)
        features.testingFramework.push('Jest');
    if (deps.vitest)
        features.testingFramework.push('Vitest');
    if (deps.cypress)
        features.testingFramework.push('Cypress');
    if (deps.playwright || deps['@playwright/test'])
        features.testingFramework.push('Playwright');
    return features;
}
async function detectPackageManager(projectPath) {
    try {
        await fs.access(path.join(projectPath, 'pnpm-lock.yaml'));
        return 'pnpm';
    }
    catch { }
    try {
        await fs.access(path.join(projectPath, 'yarn.lock'));
        return 'yarn';
    }
    catch { }
    try {
        await fs.access(path.join(projectPath, 'package-lock.json'));
        return 'npm';
    }
    catch { }
    return 'unknown';
}
async function analyzeCodeComplexity(projectPath, framework) {
    const metrics = {
        totalFiles: 0,
        componentFiles: 0,
        linesOfCode: 0,
        avgComponentSize: 0,
        maxComponentSize: 0,
    };
    const extensions = framework === 'vue' ? '*.vue' :
        framework === 'svelte' ? '*.svelte' :
            '*.{jsx,tsx}';
    try {
        const files = await glob(`**/${extensions}`, {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
            absolute: true,
        });
        metrics.componentFiles = files.length;
        const allFiles = await glob('**/*.{js,jsx,ts,tsx,vue,svelte}', {
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
            absolute: true,
        });
        metrics.totalFiles = allFiles.length;
        let totalLines = 0;
        let maxLines = 0;
        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const lines = content.split('\n').length;
            totalLines += lines;
            maxLines = Math.max(maxLines, lines);
        }
        metrics.linesOfCode = totalLines;
        metrics.avgComponentSize = files.length > 0 ? Math.round(totalLines / files.length) : 0;
        metrics.maxComponentSize = maxLines;
    }
    catch (error) {
        console.warn('Error analyzing code complexity:', error);
    }
    return metrics;
}
//# sourceMappingURL=analyze.js.map