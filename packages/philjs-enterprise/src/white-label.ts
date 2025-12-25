/**
 * White-Label Support for PhilJS Enterprise
 */

export interface WhiteLabelConfig {
  tenantId: string;
  branding: BrandingConfig;
  customization: CustomizationConfig;
  domains?: DomainConfig[];
}

export interface BrandingConfig {
  appName: string;
  logo: string;
  logoAlt?: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

export interface CustomizationConfig {
  hidePhilJSBranding: boolean;
  customFooter?: string;
  customHeader?: string;
  loginBackground?: string;
  emailTemplate?: EmailTemplate;
  termsUrl?: string;
  privacyUrl?: string;
  supportEmail?: string;
  supportUrl?: string;
}

export interface EmailTemplate {
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  footer?: string;
  logoUrl?: string;
}

export interface DomainConfig {
  domain: string;
  type: 'primary' | 'alias' | 'redirect';
  ssl: boolean;
  verified: boolean;
}

export class WhiteLabelManager {
  private configs: Map<string, WhiteLabelConfig> = new Map();

  register(config: WhiteLabelConfig): void {
    this.configs.set(config.tenantId, config);
  }

  get(tenantId: string): WhiteLabelConfig | undefined {
    return this.configs.get(tenantId);
  }

  getBranding(tenantId: string): BrandingConfig | null {
    return this.configs.get(tenantId)?.branding || null;
  }

  generateCSS(tenantId: string): string {
    const config = this.configs.get(tenantId);
    if (!config) return '';

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

  getMetaTags(tenantId: string): string {
    const config = this.configs.get(tenantId);
    if (!config) return '';

    const { branding } = config;

    return `
      <title>${branding.appName}</title>
      <link rel="icon" href="${branding.favicon}" />
      <meta name="theme-color" content="${branding.primaryColor}" />
    `;
  }
}

export function createWhiteLabelManager(): WhiteLabelManager {
  return new WhiteLabelManager();
}
