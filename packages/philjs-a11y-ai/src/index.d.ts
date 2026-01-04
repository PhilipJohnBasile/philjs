/**
 * @philjs/a11y-ai - AI-Powered Accessibility
 *
 * Automatically fix and enhance accessibility:
 * - Auto-generate alt text for images using AI vision
 * - Fix color contrast issues automatically
 * - Add missing ARIA labels intelligently
 * - Generate accessible descriptions
 * - Keyboard navigation optimization
 * - Screen reader optimization
 * - Focus management
 * - WCAG compliance checking
 *
 * ACCESSIBILITY WITHOUT THE EFFORT.
 */
export interface A11yAIConfig {
    /** AI provider for vision/text */
    provider?: 'openai' | 'anthropic' | 'local';
    /** API key */
    apiKey?: string;
    /** Model for vision tasks */
    visionModel?: string;
    /** Model for text tasks */
    textModel?: string;
    /** WCAG level target */
    wcagLevel?: 'A' | 'AA' | 'AAA';
    /** Auto-fix issues */
    autoFix?: boolean;
    /** Languages for descriptions */
    languages?: string[];
}
export interface A11yIssue {
    id: string;
    type: A11yIssueType;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    element: Element;
    selector: string;
    wcagCriteria: string[];
    description: string;
    suggestion?: string;
    autoFixable: boolean;
}
export type A11yIssueType = 'missing-alt' | 'empty-alt' | 'low-contrast' | 'missing-label' | 'missing-aria' | 'missing-heading' | 'skip-heading-level' | 'missing-lang' | 'missing-focus-indicator' | 'keyboard-trap' | 'missing-form-label' | 'empty-button' | 'empty-link' | 'auto-playing-media' | 'missing-captions';
export interface A11yFix {
    issueId: string;
    type: A11yIssueType;
    element: Element;
    fix: string;
    explanation: string;
    applied: boolean;
}
export interface A11yReport {
    timestamp: number;
    url: string;
    issues: A11yIssue[];
    fixes: A11yFix[];
    score: number;
    wcagLevel: string;
    summary: A11ySummary;
}
export interface A11ySummary {
    totalIssues: number;
    criticalIssues: number;
    autoFixable: number;
    fixed: number;
    byType: Record<string, number>;
}
export interface GeneratedAltText {
    text: string;
    confidence: number;
    language: string;
    context?: string;
}
export interface ColorContrastFix {
    foreground: string;
    background: string;
    originalRatio: number;
    fixedRatio: number;
    wcagLevel: 'AA' | 'AAA';
}
declare function getContrastRatio(color1: string, color2: string): number;
declare function adjustColorForContrast(foreground: string, background: string, targetRatio: number): string;
declare class AltTextGenerator {
    private config;
    private cache;
    constructor(config: A11yAIConfig);
    generateAltText(imageUrl: string, context?: string): Promise<GeneratedAltText>;
    private generateWithOpenAI;
    private generateWithAnthropic;
    private generateFallback;
    private blobToBase64;
}
declare class AriaLabelGenerator {
    generateForButton(button: Element): string;
    generateForLink(link: Element): string;
    generateForInput(input: Element): string;
    generateForImage(img: Element): string;
    private capitalizeFirst;
}
export declare class A11yAI {
    private config;
    private altTextGenerator;
    private ariaGenerator;
    private issues;
    private fixes;
    constructor(config?: A11yAIConfig);
    audit(root?: Element): Promise<A11yReport>;
    private auditImages;
    private isLikelyDecorative;
    private auditContrast;
    private getBackgroundColor;
    private auditForms;
    private auditButtons;
    private auditLinks;
    private auditHeadings;
    private auditLanguage;
    private auditFocus;
    private auditMedia;
    autoFixAll(): Promise<void>;
    fixIssue(issue: A11yIssue): Promise<A11yFix | null>;
    private addIssue;
    private getSelector;
    private generateReport;
}
export declare function initA11yAI(config?: A11yAIConfig): A11yAI;
export declare function getA11yAI(): A11yAI | null;
export declare function useA11yAudit(root?: Element): Promise<A11yReport>;
export declare function useAutoAltText(imageUrl: string, context?: string): Promise<GeneratedAltText>;
export { AltTextGenerator, AriaLabelGenerator, getContrastRatio, adjustColorForContrast };
//# sourceMappingURL=index.d.ts.map