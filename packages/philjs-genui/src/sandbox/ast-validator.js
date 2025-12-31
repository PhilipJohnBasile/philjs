/**
 * AST Validator
 * Security validation for AI-generated UI specifications
 */
/**
 * Default security configuration
 */
export const DEFAULT_SANDBOX_CONFIG = {
    allowedComponents: [
        // Layout
        'Box', 'Stack', 'Grid', 'Flex', 'Container', 'Divider', 'Spacer',
        // Text
        'Text', 'Heading', 'Paragraph', 'Label', 'Code', 'Pre',
        // Input
        'Button', 'Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider',
        // Display
        'Card', 'Badge', 'Avatar', 'Icon', 'Image',
        // Feedback
        'Alert', 'Toast', 'Spinner', 'Progress', 'Skeleton',
        // Navigation
        'Link', 'Tabs', 'Breadcrumb', 'Pagination',
        // Data
        'Table', 'List', 'ListItem',
    ],
    allowedProps: new Map([
        ['Button', ['children', 'variant', 'size', 'disabled', 'loading', 'type', 'onClick']],
        ['Input', ['type', 'placeholder', 'value', 'disabled', 'required', 'name', 'onChange', 'onBlur']],
        ['Text', ['children', 'size', 'weight', 'color', 'align']],
        ['Heading', ['children', 'level']],
        ['Alert', ['children', 'variant', 'dismissible', 'onDismiss']],
        ['Card', ['children', 'title', 'description', 'padding']],
        ['Stack', ['direction', 'gap', 'align', 'justify', 'children']],
        ['Grid', ['columns', 'rows', 'gap', 'children']],
        ['Box', ['as', 'children']],
        ['Image', ['src', 'alt', 'width', 'height', 'loading']],
        ['Link', ['href', 'children', 'external']],
        ['Table', ['columns', 'data', 'striped', 'bordered']],
        ['Select', ['options', 'value', 'placeholder', 'disabled', 'onChange']],
        ['Checkbox', ['checked', 'label', 'disabled', 'onChange']],
        ['Radio', ['value', 'label', 'disabled', 'onChange']],
        ['Spinner', ['size', 'label']],
        ['Progress', ['value', 'max', 'label']],
        ['Badge', ['children', 'variant']],
        ['Tabs', ['items', 'activeTab', 'onTabChange']],
    ]),
    allowedActions: ['emit', 'navigate', 'signal', 'agent'],
    maxDepth: 10,
    maxComponents: 100,
    maxBindings: 50,
    maxActions: 50,
    forbiddenPatterns: [
        // Script injection
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        // Event handlers in strings
        /on\w+\s*=/i,
        // Script tags
        /<script/i,
        /<\/script/i,
        // Dangerous functions
        /eval\s*\(/i,
        /Function\s*\(/i,
        /setTimeout\s*\(/i,
        /setInterval\s*\(/i,
        // Import attempts
        /import\s*\(/i,
        /require\s*\(/i,
        // DOM manipulation
        /document\./i,
        /window\./i,
        /globalThis\./i,
        // Prototype pollution
        /__proto__/i,
        /constructor\s*\[/i,
        /prototype\s*\[/i,
    ],
    allowInlineStyles: true,
    allowCustomEvents: false,
    blockedNavigationPatterns: [
        /javascript:/i,
        /data:/i,
        /file:/i,
    ],
};
/**
 * AST Validator class
 * Validates A2UI messages for security
 */
export class ASTValidator {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
    }
    /**
     * Validate a complete A2UI message
     */
    validate(message) {
        const errors = [];
        const warnings = [];
        // Validate version
        if (message.version !== '1.0') {
            errors.push({
                code: 'INVALID_MESSAGE',
                message: `Unsupported protocol version: ${message.version}`,
            });
        }
        // Validate based on message type
        if (message.type === 'render' && message.payload.type === 'render') {
            this.validateRenderPayload(message.payload, errors, warnings);
        }
        else if (message.type === 'update' && message.payload.type === 'update') {
            this.validateUpdatePayload(message.payload, errors, warnings);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            sanitized: errors.length === 0 ? message : undefined,
        };
    }
    /**
     * Validate render payload
     */
    validateRenderPayload(payload, errors, warnings) {
        // Validate component count
        const componentCount = this.countComponents(payload.components);
        if (componentCount > this.config.maxComponents) {
            errors.push({
                code: 'SECURITY_VIOLATION',
                message: `Too many components: ${componentCount} (max: ${this.config.maxComponents})`,
            });
        }
        // Validate component tree
        this.validateComponents(payload.components, errors, warnings, 0);
        // Validate bindings
        if (payload.bindings) {
            if (payload.bindings.length > this.config.maxBindings) {
                errors.push({
                    code: 'SECURITY_VIOLATION',
                    message: `Too many bindings: ${payload.bindings.length} (max: ${this.config.maxBindings})`,
                });
            }
            for (const binding of payload.bindings) {
                this.validateBinding(binding, errors);
            }
        }
        // Validate actions
        if (payload.actions) {
            if (payload.actions.length > this.config.maxActions) {
                errors.push({
                    code: 'SECURITY_VIOLATION',
                    message: `Too many actions: ${payload.actions.length} (max: ${this.config.maxActions})`,
                });
            }
            for (const action of payload.actions) {
                this.validateAction(action, errors);
            }
        }
    }
    /**
     * Validate update payload
     */
    validateUpdatePayload(payload, errors, warnings) {
        if (payload.props) {
            this.validateProps(payload.props, 'unknown', errors);
        }
        if (payload.children) {
            this.validateComponents(payload.children, errors, warnings, 0);
        }
    }
    /**
     * Validate component tree recursively
     */
    validateComponents(components, errors, warnings, depth) {
        if (depth > this.config.maxDepth) {
            errors.push({
                code: 'SECURITY_VIOLATION',
                message: `Component tree too deep: ${depth} (max: ${this.config.maxDepth})`,
            });
            return;
        }
        for (const component of components) {
            this.validateComponent(component, errors, warnings, depth);
        }
    }
    /**
     * Validate a single component
     */
    validateComponent(component, errors, warnings, depth) {
        // Check if component type is allowed
        if (!this.config.allowedComponents.includes(component.type)) {
            errors.push({
                code: 'INVALID_COMPONENT',
                message: `Component type not allowed: ${component.type}`,
                source: component.id,
            });
            return;
        }
        // Validate props
        this.validateProps(component.props, component.type, errors, component.id);
        // Validate string values for injection
        this.validateStringsInObject(component.props, errors, component.id);
        // Validate inline styles
        if (component.style && !this.config.allowInlineStyles) {
            warnings.push(`Inline styles are disabled (component: ${component.id})`);
        }
        // Validate children recursively
        if (component.children) {
            this.validateComponents(component.children, errors, warnings, depth + 1);
        }
        // Validate conditional rendering expression
        if (component.when) {
            this.validateExpression(component.when.expression, errors, component.id);
        }
        // Validate iteration
        if (component.each) {
            this.validateStringsInObject({ source: component.each.source }, errors, component.id);
        }
    }
    /**
     * Validate component props
     */
    validateProps(props, componentType, errors, componentId) {
        const allowedProps = this.config.allowedProps.get(componentType);
        if (allowedProps) {
            for (const propName of Object.keys(props)) {
                // Allow common props
                if (['id', 'className', 'style', 'children'].includes(propName))
                    continue;
                if (!allowedProps.includes(propName)) {
                    errors.push({
                        code: 'PROP_VALIDATION_FAILED',
                        message: `Prop not allowed for ${componentType}: ${propName}`,
                        source: componentId,
                        path: propName,
                    });
                }
            }
        }
    }
    /**
     * Validate binding
     */
    validateBinding(binding, errors) {
        // Validate transform expression if present
        if (binding.transform) {
            this.validateExpression(binding.transform, errors, binding.id);
        }
        // Validate path for injection
        this.validateString(binding.path, errors, binding.id, 'binding.path');
    }
    /**
     * Validate action
     */
    validateAction(action, errors) {
        // Check if action type is allowed
        if (!this.config.allowedActions.includes(action.handler.type)) {
            errors.push({
                code: 'SECURITY_VIOLATION',
                message: `Action type not allowed: ${action.handler.type}`,
                source: action.id,
            });
            return;
        }
        // Validate custom events
        if (action.trigger === 'custom' && !this.config.allowCustomEvents) {
            errors.push({
                code: 'SECURITY_VIOLATION',
                message: 'Custom events are not allowed',
                source: action.id,
            });
        }
        // Validate navigation URLs
        if (action.handler.type === 'navigate') {
            this.validateNavigationUrl(action.handler.to, errors, action.id);
        }
    }
    /**
     * Validate navigation URL
     */
    validateNavigationUrl(url, errors, source) {
        // Check blocked patterns
        if (this.config.blockedNavigationPatterns) {
            for (const pattern of this.config.blockedNavigationPatterns) {
                if (pattern.test(url)) {
                    errors.push({
                        code: 'SECURITY_VIOLATION',
                        message: `Navigation URL blocked: ${url}`,
                        source,
                    });
                    return;
                }
            }
        }
        // Check whitelist if configured
        if (this.config.allowedNavigationUrls) {
            const allowed = this.config.allowedNavigationUrls.some((pattern) => pattern.test(url));
            if (!allowed) {
                errors.push({
                    code: 'SECURITY_VIOLATION',
                    message: `Navigation URL not in whitelist: ${url}`,
                    source,
                });
            }
        }
    }
    /**
     * Validate an expression string
     */
    validateExpression(expression, errors, source) {
        for (const pattern of this.config.forbiddenPatterns) {
            if (pattern.test(expression)) {
                errors.push({
                    code: 'SECURITY_VIOLATION',
                    message: `Forbidden pattern in expression: ${pattern}`,
                    source,
                    path: 'expression',
                });
            }
        }
    }
    /**
     * Validate a string value
     */
    validateString(value, errors, source, path) {
        for (const pattern of this.config.forbiddenPatterns) {
            if (pattern.test(value)) {
                errors.push({
                    code: 'SECURITY_VIOLATION',
                    message: `Forbidden pattern in string: ${pattern}`,
                    source,
                    path,
                });
            }
        }
    }
    /**
     * Recursively validate all strings in an object
     */
    validateStringsInObject(obj, errors, source, path = '') {
        if (typeof obj === 'string') {
            this.validateString(obj, errors, source, path);
        }
        else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.validateStringsInObject(item, errors, source, `${path}[${index}]`);
            });
        }
        else if (obj && typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                this.validateStringsInObject(value, errors, source, path ? `${path}.${key}` : key);
            }
        }
    }
    /**
     * Count total components in tree
     */
    countComponents(components) {
        let count = components.length;
        for (const component of components) {
            if (component.children) {
                count += this.countComponents(component.children);
            }
        }
        return count;
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Create a new AST validator
 */
export function createValidator(config) {
    return new ASTValidator(config);
}
//# sourceMappingURL=ast-validator.js.map