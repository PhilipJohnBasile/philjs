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
export declare class WhiteLabelManager {
    private configs;
    register(config: WhiteLabelConfig): void;
    get(tenantId: string): WhiteLabelConfig | undefined;
    getBranding(tenantId: string): BrandingConfig | null;
    generateCSS(tenantId: string): string;
    getMetaTags(tenantId: string): string;
}
export declare function createWhiteLabelManager(): WhiteLabelManager;
//# sourceMappingURL=white-label.d.ts.map