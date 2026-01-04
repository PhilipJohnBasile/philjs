/**
 * White-Label Support for PhilJS Enterprise
 */
export class WhiteLabelManager {
    configs = new Map();
    register(config) {
        this.configs.set(config.tenantId, config);
    }
    get(tenantId) {
        return this.configs.get(tenantId);
    }
    getBranding(tenantId) {
        return this.configs.get(tenantId)?.branding || null;
    }
    generateCSS(tenantId) {
        const config = this.configs.get(tenantId);
        if (!config)
            return '';
        const { branding } = config;
        return `
      :root {
        --brand-primary: ${branding.primaryColor};
        --brand-secondary: ${branding.secondaryColor};
        --brand-accent: ${branding.accentColor || branding.primaryColor};
        --brand-background: ${branding.backgroundColor || '#ffffff'};
        --brand-text: ${branding.textColor || '#1e1e1e'};
        --brand-font: ${branding.fontFamily || 'system-ui, -apple-system, sans-serif'};
      }
      ${branding.customCSS || ''}
    `;
    }
    getMetaTags(tenantId) {
        const config = this.configs.get(tenantId);
        if (!config)
            return '';
        const { branding } = config;
        return `
      <title>${branding.appName}</title>
      <link rel="icon" href="${branding.favicon}" />
      <meta name="theme-color" content="${branding.primaryColor}" />
    `;
    }
}
export function createWhiteLabelManager() {
    return new WhiteLabelManager();
}
//# sourceMappingURL=white-label.js.map