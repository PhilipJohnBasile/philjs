/**
 * PhilJS Edge A/B Testing
 *
 * Cookie-based A/B testing at the edge with zero layout shift.
 * Integrates with analytics and supports multivariate testing.
 *
 * Features:
 * - Cookie-based variant assignment
 * - Edge-computed variants (no client-side flicker)
 * - No layout shift
 * - Analytics integration
 * - Multivariate testing
 * - Targeting rules
 * - useVariant() hook
 */
// ============================================================================
// Variant Selection
// ============================================================================
/**
 * Select a variant based on weight distribution
 */
function selectVariantByWeight(variants) {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (const variant of variants) {
        cumulative += variant.weight;
        if (random <= cumulative) {
            return variant;
        }
    }
    return variants[0];
}
/**
 * Deterministic variant selection based on user ID
 */
export function selectVariantDeterministic(variants, userId) {
    // Use simple hash to ensure same user gets same variant
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const position = Math.abs(hash) % totalWeight;
    let cumulative = 0;
    for (const variant of variants) {
        cumulative += variant.weight;
        if (position < cumulative) {
            return variant;
        }
    }
    return variants[0];
}
// ============================================================================
// Targeting
// ============================================================================
/**
 * Check if request matches targeting rules
 */
function matchesTargeting(rules, context) {
    if (!rules)
        return true;
    const geo = context.geo;
    const url = context.request.url;
    // Check countries
    if (rules.countries && geo.country) {
        if (!rules.countries.includes(geo.country)) {
            return false;
        }
    }
    // Check regions
    if (rules.regions && geo.region) {
        if (!rules.regions.includes(geo.region)) {
            return false;
        }
    }
    // Check cities
    if (rules.cities && geo.city) {
        if (!rules.cities.includes(geo.city)) {
            return false;
        }
    }
    // Check URL patterns
    if (rules.urlPatterns) {
        const pathname = url.pathname;
        const matches = rules.urlPatterns.some((pattern) => {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            return regex.test(pathname);
        });
        if (!matches) {
            return false;
        }
    }
    // Custom targeting
    if (rules.custom) {
        if (!rules.custom(context)) {
            return false;
        }
    }
    return true;
}
// ============================================================================
// A/B Testing Middleware
// ============================================================================
/**
 * A/B testing middleware
 */
export function abTestingMiddleware(options) {
    const { experiments, onAssignment, cookiePath = '/', cookieDomain, cookieSecure = true, } = options;
    return async (context) => {
        const assignments = {};
        for (const experiment of experiments) {
            // Check targeting
            if (!matchesTargeting(experiment.targeting, context)) {
                continue;
            }
            // Check traffic allocation
            const traffic = experiment.traffic ?? 100;
            if (traffic < 100 && Math.random() * 100 > traffic) {
                continue;
            }
            const cookieName = experiment.cookieName || `exp_${experiment.id}`;
            let variantId = context.cookies.get(cookieName);
            let isNew = false;
            // Check if variant is still valid
            if (variantId) {
                const variant = experiment.variants.find((v) => v.id === variantId);
                if (!variant) {
                    variantId = undefined;
                }
            }
            // Assign new variant if needed
            if (!variantId) {
                const variant = selectVariantByWeight(experiment.variants);
                variantId = variant.id;
                isNew = true;
                // Set cookie
                const cookieOptions = {
                    maxAge: experiment.cookieMaxAge || 30 * 24 * 60 * 60, // 30 days
                    path: cookiePath,
                    secure: cookieSecure,
                    sameSite: 'lax',
                };
                if (cookieDomain !== undefined)
                    cookieOptions.domain = cookieDomain;
                context.cookies.set(cookieName, variantId, cookieOptions);
            }
            // Find variant
            const variant = experiment.variants.find((v) => v.id === variantId);
            if (!variant)
                continue;
            const assignment = {
                experimentId: experiment.id,
                variantId: variant.id,
                variantName: variant.name,
                isNew,
            };
            assignments[experiment.id] = assignment;
            // Call analytics callback
            if (onAssignment && isNew) {
                await onAssignment(assignment, context);
            }
        }
        // Add assignments to context
        context.experiments = assignments;
        const response = await context.next();
        // Add experiment data to response headers for analytics
        if (Object.keys(assignments).length > 0) {
            const headers = new Headers(response.headers);
            headers.set('X-Experiments', JSON.stringify(assignments));
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }
        return response;
    };
}
// ============================================================================
// Variant-based Response Modification
// ============================================================================
/**
 * Inject variant data into HTML response
 */
export function injectVariantData(html, assignments) {
    const script = `
    <script>
      window.__EXPERIMENTS__ = ${JSON.stringify(assignments)};
    </script>
  `;
    return html.replace('</head>', `${script}\n</head>`);
}
/**
 * Variant injection middleware
 */
export function variantInjectionMiddleware() {
    return async (context) => {
        const response = await context.next();
        const experiments = context.experiments;
        if (!experiments || Object.keys(experiments).length === 0) {
            return response;
        }
        // Only inject for HTML responses
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
            return response;
        }
        // Read and modify HTML
        const html = await response.text();
        const modifiedHtml = injectVariantData(html, experiments);
        return new Response(modifiedHtml, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    };
}
// ============================================================================
// Conditional Rendering
// ============================================================================
/**
 * Render different content based on variant
 */
export function variantMiddleware(experimentId, handlers) {
    return async (context) => {
        const experiments = context.experiments;
        const assignment = experiments?.[experimentId];
        if (!assignment) {
            return context.next();
        }
        const handler = handlers[assignment.variantId] || handlers['default'];
        if (handler) {
            const result = await handler(context);
            return result instanceof Response ? result : context.next();
        }
        return context.next();
    };
}
/**
 * Rewrite URL based on variant
 */
export function variantRewriteMiddleware(experimentId, rewrites) {
    return (context) => {
        const experiments = context.experiments;
        const assignment = experiments?.[experimentId];
        if (!assignment) {
            return context.next();
        }
        const rewritePath = rewrites[assignment.variantId];
        if (rewritePath) {
            const newUrl = new URL(rewritePath, context.request.url);
            context.rewrite(newUrl);
        }
        return context.next();
    };
}
/**
 * Google Analytics provider
 */
export const GoogleAnalyticsProvider = {
    async trackExperiment(assignment, context) {
        // In a real implementation, this would send to GA
        console.log('[GA] Experiment assignment:', assignment);
    },
    async trackConversion(experimentId, variantId, context) {
        console.log('[GA] Conversion:', { experimentId, variantId });
    },
};
/**
 * Custom analytics provider
 */
export function createAnalyticsProvider(options) {
    return {
        async trackExperiment(assignment, context) {
            await fetch(options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                body: JSON.stringify({
                    type: 'experiment_assignment',
                    ...assignment,
                    timestamp: Date.now(),
                    ip: context.request.ip,
                    userAgent: context.request.userAgent,
                }),
            });
        },
        async trackConversion(experimentId, variantId, context) {
            await fetch(options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                body: JSON.stringify({
                    type: 'conversion',
                    experimentId,
                    variantId,
                    timestamp: Date.now(),
                    ip: context.request.ip,
                }),
            });
        },
    };
}
// ============================================================================
// Client-side Hook
// ============================================================================
/**
 * useVariant hook for client-side
 */
export function useVariant(experimentId) {
    if (typeof window === 'undefined') {
        return { variant: null, isLoading: false };
    }
    const experiments = window.__EXPERIMENTS__;
    const assignment = experiments?.[experimentId];
    return {
        variant: assignment?.variantName || null,
        isLoading: false,
    };
}
/**
 * Check if user is in variant
 */
export function isVariant(experimentId, variantName) {
    if (typeof window === 'undefined')
        return false;
    const experiments = window.__EXPERIMENTS__;
    const assignment = experiments?.[experimentId];
    return assignment?.variantName === variantName;
}
/**
 * Get all active experiments
 */
export function getActiveExperiments() {
    if (typeof window === 'undefined')
        return {};
    return window.__EXPERIMENTS__ || {};
}
/**
 * Multivariate testing middleware
 */
export function multivariateTestingMiddleware(experiment, options = {}) {
    const { onAssignment, cookiePath = '/', cookieDomain, cookieSecure = true, } = options;
    return async (context) => {
        // Check targeting
        if (!matchesTargeting(experiment.targeting, context)) {
            return context.next();
        }
        const assignments = {};
        let hasNewAssignment = false;
        for (const factor of experiment.factors) {
            const cookieName = `${experiment.cookieNamePrefix || 'mvt'}_${experiment.id}_${factor.id}`;
            let variantId = context.cookies.get(cookieName);
            let isNew = false;
            // Assign new variant if needed
            if (!variantId || !factor.variants.find((v) => v.id === variantId)) {
                const variant = selectVariantByWeight(factor.variants);
                variantId = variant.id;
                isNew = true;
                hasNewAssignment = true;
                const mvtCookieOptions = {
                    maxAge: experiment.cookieMaxAge || 30 * 24 * 60 * 60,
                    path: cookiePath,
                    secure: cookieSecure,
                    sameSite: 'lax',
                };
                if (cookieDomain !== undefined)
                    mvtCookieOptions.domain = cookieDomain;
                context.cookies.set(cookieName, variantId, mvtCookieOptions);
            }
            const variant = factor.variants.find((v) => v.id === variantId);
            if (!variant)
                continue;
            assignments[factor.id] = {
                experimentId: `${experiment.id}_${factor.id}`,
                variantId: variant.id,
                variantName: variant.name,
                isNew,
            };
        }
        // Add to context
        context.multivariateExperiment = {
            id: experiment.id,
            assignments,
        };
        if (onAssignment && hasNewAssignment) {
            await onAssignment(assignments, context);
        }
        return context.next();
    };
}
/**
 * Calculate statistical significance (using Z-test)
 */
export function calculateSignificance(control, variant) {
    const p1 = control.conversionRate;
    const n1 = control.impressions;
    const p2 = variant.conversionRate;
    const n2 = variant.impressions;
    const pPooled = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
    const zScore = (p2 - p1) / se;
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    const isSignificant = pValue < 0.05;
    const confidence = (1 - pValue) * 100;
    return { zScore, pValue, isSignificant, confidence };
}
/**
 * Normal cumulative distribution function
 */
function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const p = d *
        t *
        (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
}
//# sourceMappingURL=edge-ab-testing.js.map