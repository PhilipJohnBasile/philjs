/**
 * PhilJS Rocket Templates
 *
 * Template integration for PhilJS with Rocket.
 * Supports Tera, Handlebars, and PhilJS component templates.
 */
/**
 * PhilJS Template Engine
 */
export class TemplateEngine {
    config;
    templates = new Map();
    constructor(options = {}) {
        this.config = {
            engine: 'tera',
            templateDir: 'templates',
            extension: '.html',
            cache: true,
            autoReload: process.env['NODE_ENV'] !== 'production',
            helpers: new Map(),
            globals: {},
            ...options,
        };
        this.registerBuiltinHelpers();
    }
    /**
     * Register built-in template helpers
     */
    registerBuiltinHelpers() {
        // Date formatting
        this.registerHelper('formatDate', (...args) => {
            const date = args[0];
            const format = args[1] || 'YYYY-MM-DD';
            const d = new Date(date);
            return format
                .replace('YYYY', d.getFullYear().toString())
                .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
                .replace('DD', d.getDate().toString().padStart(2, '0'));
        });
        // JSON stringify
        this.registerHelper('json', (...args) => {
            return JSON.stringify(args[0]);
        });
        // URL encoding
        this.registerHelper('urlencode', (...args) => {
            return encodeURIComponent(String(args[0]));
        });
        // HTML escaping
        this.registerHelper('escape', (...args) => {
            const str = String(args[0]);
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        });
        // Truncate text
        this.registerHelper('truncate', (...args) => {
            const str = String(args[0]);
            const length = args[1] || 100;
            const suffix = args[2] || '...';
            if (str.length <= length)
                return str;
            return str.substring(0, length) + suffix;
        });
    }
    /**
     * Register a custom helper
     */
    registerHelper(name, helper) {
        this.config.helpers.set(name, helper);
        return this;
    }
    /**
     * Set global context data
     */
    setGlobal(key, value) {
        this.config.globals[key] = value;
        return this;
    }
    /**
     * Render a template
     */
    render(templateName, context) {
        // In a real implementation, this would load and render the template
        // This is a placeholder that returns a simple HTML structure
        const fullContext = {
            ...this.config.globals,
            ...context.data,
            title: context.title,
            flash: context.flash,
            user: context.user,
            csrf_token: context.csrfToken,
            path: context.path,
        };
        return this.renderTemplate(templateName, fullContext);
    }
    /**
     * Internal template rendering
     */
    renderTemplate(name, context) {
        // Placeholder - actual implementation would use the configured engine
        const template = this.templates.get(name) || this.getDefaultTemplate(name);
        return this.processTemplate(template, context);
    }
    /**
     * Get default template for a name
     */
    getDefaultTemplate(name) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    <div id="app">
        <!-- Template: ${name} -->
        {{ content }}
    </div>
    <script type="module" src="/static/app.js"></script>
</body>
</html>
`.trim();
    }
    /**
     * Process template variables
     */
    processTemplate(template, context) {
        let result = template;
        // Simple variable replacement ({{ variable }})
        for (const [key, value] of Object.entries(context)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            result = result.replace(regex, String(value ?? ''));
        }
        return result;
    }
    /**
     * Generate Rust template code
     */
    toRustCode() {
        return `
use rocket_dyn_templates::{Template, context};
use serde::Serialize;

/// Render a template with PhilJS context
pub fn render_template<T: Serialize>(
    name: &str,
    context: T,
) -> Template {
    Template::render(name, context)
}

/// Template context builder
#[derive(Debug, Serialize)]
pub struct TemplateContext {
    pub title: String,
    pub data: serde_json::Value,
    pub flash: Vec<FlashMessage>,
    pub user: Option<serde_json::Value>,
    pub csrf_token: Option<String>,
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct FlashMessage {
    #[serde(rename = "type")]
    pub kind: String,
    pub message: String,
}

impl TemplateContext {
    pub fn new(title: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            data: serde_json::Value::Null,
            flash: Vec::new(),
            user: None,
            csrf_token: None,
            path: String::new(),
        }
    }

    pub fn with_data<T: Serialize>(mut self, data: T) -> Self {
        self.data = serde_json::to_value(data).unwrap_or_default();
        self
    }

    pub fn with_flash(mut self, kind: &str, message: &str) -> Self {
        self.flash.push(FlashMessage {
            kind: kind.to_string(),
            message: message.to_string(),
        });
        self
    }

    pub fn with_user<T: Serialize>(mut self, user: T) -> Self {
        self.user = serde_json::to_value(user).ok();
        self
    }

    pub fn with_csrf(mut self, token: &str) -> Self {
        self.csrf_token = Some(token.to_string());
        self
    }

    pub fn with_path(mut self, path: &str) -> Self {
        self.path = path.to_string();
        self
    }
}

/// Render a page template
pub fn page(name: &str, ctx: TemplateContext) -> Template {
    Template::render(name, ctx)
}

/// Rocket configuration for templates
pub fn template_fairing() -> impl rocket::fairing::Fairing {
    Template::fairing()
}
`.trim();
    }
}
/**
 * Layout builder for composing page layouts
 */
export class LayoutBuilder {
    layouts = new Map();
    defaultLayout = 'default';
    /**
     * Register a layout
     */
    register(config) {
        this.layouts.set(config.name, config);
        return this;
    }
    /**
     * Set default layout
     */
    setDefault(name) {
        this.defaultLayout = name;
        return this;
    }
    /**
     * Get a layout
     */
    get(name) {
        return this.layouts.get(name || this.defaultLayout);
    }
    /**
     * Apply layout to content
     */
    apply(content, layoutName, context) {
        const layout = this.get(layoutName);
        if (!layout) {
            return content;
        }
        return `
${layout.header || ''}
${layout.navigation || ''}
<div class="layout-container">
    ${layout.sidebar ? `<aside class="sidebar">${layout.sidebar}</aside>` : ''}
    <main class="content">${content}</main>
</div>
${layout.footer || ''}
`.trim();
    }
    /**
     * Generate Rust layout code
     */
    toRustCode() {
        return `
use rocket_dyn_templates::Template;
use serde::Serialize;

/// Layout types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LayoutType {
    Default,
    Admin,
    Auth,
    Minimal,
    Landing,
}

impl LayoutType {
    pub fn template_name(&self) -> &'static str {
        match self {
            LayoutType::Default => "layouts/default",
            LayoutType::Admin => "layouts/admin",
            LayoutType::Auth => "layouts/auth",
            LayoutType::Minimal => "layouts/minimal",
            LayoutType::Landing => "layouts/landing",
        }
    }
}

/// Page with layout
#[derive(Debug, Serialize)]
pub struct Page<T: Serialize> {
    layout: String,
    content: T,
    title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
}

impl<T: Serialize> Page<T> {
    pub fn new(title: impl Into<String>, content: T) -> Self {
        Self {
            layout: "layouts/default".to_string(),
            content,
            title: title.into(),
            description: None,
        }
    }

    pub fn with_layout(mut self, layout: LayoutType) -> Self {
        self.layout = layout.template_name().to_string();
        self
    }

    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    pub fn render(self) -> Template {
        Template::render(&self.layout, self)
    }
}
`.trim();
    }
}
/**
 * Component template registry
 */
export class ComponentRegistry {
    components = new Map();
    /**
     * Register a component
     */
    register(component) {
        this.components.set(component.name, component);
        return this;
    }
    /**
     * Render a component
     */
    render(name, props = {}) {
        const component = this.components.get(name);
        if (!component) {
            console.warn(`Component '${name}' not found`);
            return '';
        }
        return component.render(props);
    }
    /**
     * Get a component
     */
    get(name) {
        return this.components.get(name);
    }
    /**
     * Check if a component exists
     */
    has(name) {
        return this.components.has(name);
    }
}
// ============================================================================
// Built-in Components
// ============================================================================
/**
 * Flash messages component
 */
export const FlashMessages = {
    name: 'flash-messages',
    render: (props) => {
        const messages = props['messages'] || [];
        if (messages.length === 0)
            return '';
        return `
<div class="flash-messages">
    ${messages.map(msg => `
    <div class="flash flash-${msg.type}" role="alert">
        <span class="flash-message">${msg.message}</span>
        <button type="button" class="flash-close" aria-label="Close">&times;</button>
    </div>
    `).join('')}
</div>
<script>
document.querySelectorAll('.flash-close').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.remove());
});
</script>
`.trim();
    },
};
/**
 * CSRF field component
 */
export const CSRFField = {
    name: 'csrf-field',
    render: (props) => {
        const token = props['token'] || '';
        return `<input type="hidden" name="_csrf" value="${token}">`;
    },
};
/**
 * Pagination component
 */
export const Pagination = {
    name: 'pagination',
    render: (props) => {
        const current = props['current'] || 1;
        const total = props['total'] || 1;
        const baseUrl = props['baseUrl'] || '?page=';
        if (total <= 1)
            return '';
        const pages = [];
        for (let i = 1; i <= total; i++) {
            if (i === current) {
                pages.push(`<span class="pagination-current">${i}</span>`);
            }
            else {
                pages.push(`<a href="${baseUrl}${i}" class="pagination-link">${i}</a>`);
            }
        }
        return `
<nav class="pagination" aria-label="Pagination">
    ${current > 1 ? `<a href="${baseUrl}${current - 1}" class="pagination-prev">&laquo; Previous</a>` : ''}
    <span class="pagination-pages">${pages.join('')}</span>
    ${current < total ? `<a href="${baseUrl}${current + 1}" class="pagination-next">Next &raquo;</a>` : ''}
</nav>
`.trim();
    },
};
/**
 * Form errors component
 */
export const FormErrors = {
    name: 'form-errors',
    render: (props) => {
        const errors = props['errors'] || {};
        const entries = Object.entries(errors);
        if (entries.length === 0)
            return '';
        return `
<div class="form-errors" role="alert">
    <ul>
        ${entries.flatMap(([field, msgs]) => msgs.map(msg => `<li><strong>${field}:</strong> ${msg}</li>`)).join('')}
    </ul>
</div>
`.trim();
    },
};
// ============================================================================
// Template Helpers
// ============================================================================
/**
 * Create a new template engine
 */
export function createTemplateEngine(options) {
    return new TemplateEngine(options);
}
/**
 * Create a new layout builder
 */
export function createLayoutBuilder() {
    return new LayoutBuilder();
}
/**
 * Create a new component registry
 */
export function createComponentRegistry() {
    const registry = new ComponentRegistry();
    // Register built-in components
    registry.register(FlashMessages);
    registry.register(CSRFField);
    registry.register(Pagination);
    registry.register(FormErrors);
    return registry;
}
//# sourceMappingURL=templates.js.map