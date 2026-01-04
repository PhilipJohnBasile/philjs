
export interface HealPattern {
    name: string;
    errorRegex: RegExp;
    fixDescription: string;
    confidence: number;
    applyMockFix: (componentState: any) => any;
}

/**
 * Knowledge base of known error patterns and their autonomous fixes.
 */
export const healingPatterns: HealPattern[] = [
    {
        name: 'Undefined Property Access',
        errorRegex: /Cannot read properties of undefined|Cannot read property .* of undefined/,
        fixDescription: 'Wrap access in optional chaining or guard clause',
        confidence: 0.95,
        applyMockFix: (state) => ({ ...state, safeMode: true, patched: true })
    },
    {
        name: 'Network Timeout',
        errorRegex: /Network Error|timeout|ETIMEDOUT/,
        fixDescription: 'Inject exponential backoff retry wrapper',
        confidence: 0.88,
        applyMockFix: (state) => ({ ...state, retryCount: (state.retryCount || 0) + 1 })
    },
    {
        name: 'Infinite Loop (React)',
        errorRegex: /Maximum update depth exceeded/,
        fixDescription: 'Memoize dependency array or break effect cycle',
        confidence: 0.75,
        applyMockFix: (state) => ({ ...state, renderProtection: true })
    }
];

/**
 * Finds a matching self-healing pattern for a given error.
 * 
 * @param error - The runtime error to analyze.
 * @returns The matching HealPattern descriptor, or undefined if no match is found.
 */
export function findPattern(error: Error): HealPattern | undefined {
    return healingPatterns.find(p => p.errorRegex.test(error.message));
}
