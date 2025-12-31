/**
 * Code Generator - Exports visual designs to PhilJS/JSX code
 */
import type { ComponentNode, NodeId, NodeStyles, CodegenOptions } from '../types.js';
export interface GeneratedCode {
    code: string;
    imports: string[];
    filename?: string;
    language: 'jsx' | 'tsx' | 'philjs';
}
export interface CodeGeneratorOptions extends CodegenOptions {
    componentName?: string;
    exportType?: 'default' | 'named' | 'none';
    wrapInFunction?: boolean;
    addPropsInterface?: boolean;
}
/**
 * Generate complete component code
 */
export declare function generateCode(nodes: Record<NodeId, ComponentNode>, rootId: NodeId, userOptions?: Partial<CodeGeneratorOptions>): GeneratedCode;
/**
 * Generate code as a string without wrapper
 */
export declare function generateJSXString(nodes: Record<NodeId, ComponentNode>, rootId: NodeId, options?: Partial<CodeGeneratorOptions>): string;
/**
 * Generate inline CSS from styles
 */
export declare function generateInlineCSS(styles: NodeStyles): string;
/**
 * Generate a CSS class from styles
 */
export declare function generateCSSClass(className: string, styles: NodeStyles): string;
/**
 * Export design as JSON
 */
export declare function exportAsJSON(nodes: Record<NodeId, ComponentNode>, rootId: NodeId, metadata?: Record<string, any>): string;
declare const _default: {
    generateCode: typeof generateCode;
    generateJSXString: typeof generateJSXString;
    generateInlineCSS: typeof generateInlineCSS;
    generateCSSClass: typeof generateCSSClass;
    exportAsJSON: typeof exportAsJSON;
};
export default _default;
//# sourceMappingURL=CodeGenerator.d.ts.map