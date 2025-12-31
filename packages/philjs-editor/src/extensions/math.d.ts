/**
 * Math Extension
 *
 * LaTeX math equation support with KaTeX rendering
 */
export interface MathOptions {
    /**
     * KaTeX options
     */
    katexOptions?: Record<string, any>;
    /**
     * Inline math delimiters (default: $...$)
     */
    inlineDelimiters?: [string, string];
    /**
     * Block math delimiters (default: $$...$$)
     */
    blockDelimiters?: [string, string];
    /**
     * Enable auto-render of delimited math
     */
    autoRender?: boolean;
}
/**
 * Inline Math Node
 */
export declare const InlineMath: any;
/**
 * Block Math Node
 */
export declare const BlockMath: any;
/**
 * Create configured math extensions
 */
export declare function createMathExtensions(options?: MathOptions): any[];
/**
 * Render LaTeX to HTML using KaTeX
 */
export declare function renderLatex(latex: string, displayMode?: boolean, options?: Record<string, any>): Promise<string>;
/**
 * Validate LaTeX syntax
 */
export declare function validateLatex(latex: string): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * Common math symbols for quick insert
 */
export declare const mathSymbols: {
    alpha: string;
    beta: string;
    gamma: string;
    delta: string;
    epsilon: string;
    theta: string;
    lambda: string;
    mu: string;
    pi: string;
    sigma: string;
    omega: string;
    sum: string;
    prod: string;
    int: string;
    oint: string;
    partial: string;
    nabla: string;
    sqrt: string;
    frac: string;
    leq: string;
    geq: string;
    neq: string;
    approx: string;
    equiv: string;
    subset: string;
    supset: string;
    in: string;
    notin: string;
    rightarrow: string;
    leftarrow: string;
    Rightarrow: string;
    Leftarrow: string;
    infty: string;
    forall: string;
    exists: string;
    times: string;
    div: string;
    pm: string;
    cdot: string;
};
/**
 * Math templates for quick insert
 */
export declare const mathTemplates: {
    fraction: string;
    power: string;
    subscript: string;
    squareRoot: string;
    nthRoot: string;
    sum: string;
    product: string;
    integral: string;
    limit: string;
    matrix: string;
    cases: string;
    binomial: string;
};
/**
 * Math extension keyboard shortcuts
 */
export declare const mathShortcuts: {
    insertInlineMath: string;
    insertBlockMath: string;
};
/**
 * Default math styles
 */
export declare const mathStyles = "\n.philjs-inline-math {\n  display: inline-block;\n  vertical-align: middle;\n}\n\n.philjs-block-math {\n  display: block;\n  margin: 1rem 0;\n  overflow-x: auto;\n  text-align: center;\n}\n\n.philjs-math-error {\n  background: #fef2f2;\n  border: 1px solid #fecaca;\n  border-radius: 0.25rem;\n  color: #dc2626;\n  padding: 0.25rem 0.5rem;\n}\n\n/* KaTeX specific styles */\n.katex-display {\n  margin: 0 !important;\n}\n\n.katex {\n  font-size: 1.1em;\n}\n";
export default createMathExtensions;
//# sourceMappingURL=math.d.ts.map