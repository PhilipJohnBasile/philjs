/**
 * AST Validator
 * Security validation for AI-generated UI specifications
 */
import type { A2UIMessage, A2UIError } from '../protocol/a2ui-schema.js';
/**
 * Sandbox configuration
 */
export interface SandboxConfig {
    /** Whitelist of allowed component types */
    allowedComponents: string[];
    /** Props whitelist per component */
    allowedProps: Map<string, string[]>;
    /** Allowed action types */
    allowedActions: ('emit' | 'navigate' | 'signal' | 'agent')[];
    /** Maximum component tree depth */
    maxDepth: number;
    /** Maximum number of components in a single render */
    maxComponents: number;
    /** Maximum number of bindings */
    maxBindings: number;
    /** Maximum number of actions */
    maxActions: number;
    /** Forbidden patterns in string values */
    forbiddenPatterns: RegExp[];
    /** Allow inline styles */
    allowInlineStyles: boolean;
    /** Allow custom events */
    allowCustomEvents: boolean;
    /** Navigation URL whitelist (if set, only these URLs are allowed) */
    allowedNavigationUrls?: RegExp[];
    /** Blocked navigation patterns */
    blockedNavigationPatterns?: RegExp[];
}
/**
 * Validation error with details
 */
export interface ValidationError extends A2UIError {
    /** Component or element that caused the error */
    source?: string;
    /** Path to the problematic value */
    path?: string;
}
/**
 * Validation result
 */
export interface SandboxValidationResult {
    /** Whether the message passed validation */
    valid: boolean;
    /** List of validation errors */
    errors: ValidationError[];
    /** Sanitized message (with blocked content removed) */
    sanitized?: A2UIMessage;
    /** Warnings (non-blocking issues) */
    warnings: string[];
}
/**
 * Default security configuration
 */
export declare const DEFAULT_SANDBOX_CONFIG: SandboxConfig;
/**
 * AST Validator class
 * Validates A2UI messages for security
 */
export declare class ASTValidator {
    private config;
    constructor(config?: Partial<SandboxConfig>);
    /**
     * Validate a complete A2UI message
     */
    validate(message: A2UIMessage): SandboxValidationResult;
    /**
     * Validate render payload
     */
    private validateRenderPayload;
    /**
     * Validate update payload
     */
    private validateUpdatePayload;
    /**
     * Validate component tree recursively
     */
    private validateComponents;
    /**
     * Validate a single component
     */
    private validateComponent;
    /**
     * Validate component props
     */
    private validateProps;
    /**
     * Validate binding
     */
    private validateBinding;
    /**
     * Validate action
     */
    private validateAction;
    /**
     * Validate navigation URL
     */
    private validateNavigationUrl;
    /**
     * Validate an expression string
     */
    private validateExpression;
    /**
     * Validate a string value
     */
    private validateString;
    /**
     * Recursively validate all strings in an object
     */
    private validateStringsInObject;
    /**
     * Count total components in tree
     */
    private countComponents;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<SandboxConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<SandboxConfig>;
}
/**
 * Create a new AST validator
 */
export declare function createValidator(config?: Partial<SandboxConfig>): ASTValidator;
//# sourceMappingURL=ast-validator.d.ts.map