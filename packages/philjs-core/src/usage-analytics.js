/**
 * Component usage analytics system.
 * Tracks which components are actually used in production,
 * suggests optimizations, and detects dead code.
 */
/**
 * Usage analytics manager.
 */
export class UsageAnalytics {
    usage = new Map();
    renderTimes = new Map();
    propPatterns = new Map();
    productionMode = false;
    /**
     * Track component import.
     */
    trackImport(component, importedBy, route) {
        const usage = this.getOrCreateUsage(component);
        usage.importCount++;
        if (!usage.importedBy.includes(importedBy)) {
            usage.importedBy.push(importedBy);
        }
        if (route) {
            usage.usedInRoutes.add(route);
        }
        // Track dependency graph
        const importerUsage = this.getOrCreateUsage(importedBy);
        if (!importerUsage.dependencies.includes(component)) {
            importerUsage.dependencies.push(component);
        }
    }
    /**
     * Track component render.
     */
    trackRender(component, props, renderTime, route) {
        const usage = this.getOrCreateUsage(component);
        usage.renderCount++;
        usage.lastUsed = Date.now();
        usage.usedInRoutes.add(route);
        // Track render times
        const times = this.renderTimes.get(component) || [];
        times.push(renderTime);
        if (times.length > 1000)
            times.shift();
        this.renderTimes.set(component, times);
        usage.avgRenderTime = times.reduce((a, b) => a + b, 0) / times.length;
        // Track prop usage
        this.trackPropUsage(component, props);
    }
    /**
     * Track prop usage patterns.
     */
    trackPropUsage(component, props) {
        const usage = this.getOrCreateUsage(component);
        for (const [key, value] of Object.entries(props)) {
            const propValues = this.propPatterns.get(component) || new Map();
            const values = propValues.get(key) || [];
            values.push(value);
            if (values.length > 1000)
                values.shift();
            propValues.set(key, values);
            this.propPatterns.set(component, propValues);
            // Update usage stats
            const serializedValue = JSON.stringify(value);
            let valueStatsMap = usage.propsUsage.get(key);
            if (!valueStatsMap) {
                valueStatsMap = new Map();
                usage.propsUsage.set(key, valueStatsMap);
            }
            const existing = Array.from(valueStatsMap.entries())
                .find(([v]) => JSON.stringify(v) === serializedValue);
            if (existing) {
                existing[1].count++;
            }
            else {
                valueStatsMap.set(value, {
                    value,
                    count: 1,
                    percentage: 0,
                });
            }
        }
        // Calculate percentages
        for (const [key, valueMap] of usage.propsUsage) {
            const total = Array.from(valueMap.values())
                .reduce((sum, v) => sum + v.count, 0);
            for (const stats of valueMap.values()) {
                stats.percentage = (stats.count / total) * 100;
            }
        }
    }
    /**
     * Get or create usage entry.
     */
    getOrCreateUsage(component) {
        if (!this.usage.has(component)) {
            this.usage.set(component, {
                component,
                importCount: 0,
                renderCount: 0,
                usedInRoutes: new Set(),
                propsUsage: new Map(),
                avgRenderTime: 0,
                bundleSize: 0,
                lastUsed: Date.now(),
                dependencies: [],
                importedBy: [],
                isActive: true,
            });
        }
        return this.usage.get(component);
    }
    /**
     * Detect dead code.
     */
    detectDeadCode(options = {}) {
        const { inactivityThreshold = 30, minConfidence = 0.7 } = options;
        const reports = [];
        const now = Date.now();
        const threshold = now - inactivityThreshold * 24 * 60 * 60 * 1000;
        for (const [component, usage] of this.usage) {
            let reason = null;
            let confidence = 0;
            let suggestion = "";
            // Never rendered
            if (usage.renderCount === 0 && usage.importCount > 0) {
                reason = "never-rendered";
                confidence = 0.9;
                suggestion = `Component imported ${usage.importCount} times but never rendered. Safe to remove.`;
            }
            // Not used recently
            else if (usage.lastUsed < threshold) {
                reason = "not-used-recently";
                confidence = 0.7;
                const daysSince = Math.floor((now - usage.lastUsed) / (24 * 60 * 60 * 1000));
                suggestion = `Not used in ${daysSince} days. Consider removing or archiving.`;
            }
            // Only imported by unused components
            else if (usage.importedBy.every(imp => {
                const importerUsage = this.usage.get(imp);
                return importerUsage && importerUsage.renderCount === 0;
            })) {
                reason = "only-imported";
                confidence = 0.8;
                suggestion = "Only imported by components that are themselves unused.";
            }
            // Circular dependency
            else if (this.hasCircularDependency(component)) {
                reason = "circular-dependency";
                confidence = 0.6;
                suggestion = "Part of circular dependency chain. Refactor to break cycle.";
            }
            if (reason && confidence >= minConfidence) {
                reports.push({
                    component,
                    reason,
                    lastUsed: usage.lastUsed,
                    importedBy: usage.importedBy,
                    suggestion,
                    confidence,
                });
            }
        }
        return reports.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Check for circular dependencies.
     */
    hasCircularDependency(component, visited = new Set()) {
        if (visited.has(component))
            return true;
        visited.add(component);
        const usage = this.usage.get(component);
        if (!usage)
            return false;
        for (const dep of usage.dependencies) {
            if (this.hasCircularDependency(dep, new Set(visited))) {
                return true;
            }
        }
        return false;
    }
    /**
     * Generate optimization suggestions.
     */
    generateOptimizations() {
        const suggestions = [];
        for (const [component, usage] of this.usage) {
            // Suggest default props for commonly used values
            for (const [prop, stats] of usage.propsUsage) {
                const mostCommon = Array.from(stats.values())
                    .sort((a, b) => b.count - a.count)[0];
                if (mostCommon && mostCommon.percentage > 80) {
                    suggestions.push({
                        component,
                        type: "default-prop",
                        description: `${mostCommon.percentage.toFixed(1)}% of uses pass "${mostCommon.value}" for prop "${prop}". Consider making it the default.`,
                        impact: "low",
                        autoFixAvailable: true,
                        codeChanges: [{
                                file: component,
                                before: `function ${component}({ ${prop}, ...props })`,
                                after: `function ${component}({ ${prop} = ${JSON.stringify(mostCommon.value)}, ...props })`,
                            }],
                    });
                }
            }
            // Suggest memoization for slow components
            if (usage.avgRenderTime > 16) {
                suggestions.push({
                    component,
                    type: "memo",
                    description: `Average render time is ${usage.avgRenderTime.toFixed(2)}ms. Consider memoization.`,
                    impact: "high",
                    autoFixAvailable: true,
                    codeChanges: [{
                            file: component,
                            before: `export function ${component}`,
                            after: `export const ${component} = memo(function ${component}`,
                        }],
                });
            }
            // Suggest lazy loading for large, infrequently used components
            if (usage.bundleSize > 50000 && usage.renderCount < usage.importCount * 0.1) {
                suggestions.push({
                    component,
                    type: "lazy-load",
                    description: `Large component (${(usage.bundleSize / 1024).toFixed(1)}KB) rarely rendered. Consider lazy loading.`,
                    impact: "high",
                    autoFixAvailable: true,
                    codeChanges: [{
                            file: "imports",
                            before: `import { ${component} } from './components/${component}'`,
                            after: `const ${component} = lazy(() => import('./components/${component}'))`,
                        }],
                });
            }
            // Suggest removing unused dependencies
            const unusedDeps = usage.dependencies.filter(dep => {
                const depUsage = this.usage.get(dep);
                return depUsage && depUsage.renderCount === 0;
            });
            if (unusedDeps.length > 0) {
                suggestions.push({
                    component,
                    type: "remove-dependency",
                    description: `Remove unused dependencies: ${unusedDeps.join(", ")}`,
                    impact: "medium",
                    autoFixAvailable: false,
                });
            }
        }
        return suggestions.sort((a, b) => {
            const impactScore = { high: 3, medium: 2, low: 1 };
            return impactScore[b.impact] - impactScore[a.impact];
        });
    }
    /**
     * Get component dependency graph.
     */
    getDependencyGraph() {
        const nodes = Array.from(this.usage.values()).map(usage => ({
            id: usage.component,
            size: usage.bundleSize || usage.renderCount,
            active: usage.isActive,
        }));
        const edges = [];
        for (const [component, usage] of this.usage) {
            for (const dep of usage.dependencies) {
                edges.push({
                    source: component,
                    target: dep,
                    weight: usage.renderCount,
                });
            }
        }
        return { nodes, edges };
    }
    /**
     * Export usage data.
     */
    exportUsageData() {
        const data = {};
        for (const [component, usage] of this.usage) {
            data[component] = {
                ...usage,
                usedInRoutes: new Set(usage.usedInRoutes),
                propsUsage: new Map(usage.propsUsage),
            };
        }
        return data;
    }
    /**
     * Generate automatic documentation from usage.
     */
    generateDocumentation(component) {
        const usage = this.usage.get(component);
        if (!usage)
            return "No usage data available";
        const doc = [`# ${component}`, ""];
        // Usage stats
        doc.push("## Usage Statistics");
        doc.push(`- Imported: ${usage.importCount} times`);
        doc.push(`- Rendered: ${usage.renderCount} times`);
        doc.push(`- Average render time: ${usage.avgRenderTime.toFixed(2)}ms`);
        doc.push(`- Bundle size: ${(usage.bundleSize / 1024).toFixed(1)}KB`);
        doc.push("");
        // Routes
        if (usage.usedInRoutes.size > 0) {
            doc.push("## Used in Routes");
            for (const route of usage.usedInRoutes) {
                doc.push(`- ${route}`);
            }
            doc.push("");
        }
        // Common props
        if (usage.propsUsage.size > 0) {
            doc.push("## Common Props");
            for (const [prop, stats] of usage.propsUsage) {
                const mostCommon = Array.from(stats.values())
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);
                doc.push(`### ${prop}`);
                for (const common of mostCommon) {
                    doc.push(`- \`${JSON.stringify(common.value)}\` (${common.percentage.toFixed(1)}%)`);
                }
                doc.push("");
            }
        }
        // Dependencies
        if (usage.dependencies.length > 0) {
            doc.push("## Dependencies");
            for (const dep of usage.dependencies) {
                doc.push(`- ${dep}`);
            }
            doc.push("");
        }
        // Imported by
        if (usage.importedBy.length > 0) {
            doc.push("## Imported By");
            for (const imp of usage.importedBy) {
                doc.push(`- ${imp}`);
            }
        }
        return doc.join("\n");
    }
}
/**
 * Global usage analytics instance.
 */
export const usageAnalytics = new UsageAnalytics();
//# sourceMappingURL=usage-analytics.js.map