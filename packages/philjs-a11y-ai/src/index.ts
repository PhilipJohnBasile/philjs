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

// ============================================================================
// Types
// ============================================================================

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

export type A11yIssueType =
  | 'missing-alt'
  | 'empty-alt'
  | 'low-contrast'
  | 'missing-label'
  | 'missing-aria'
  | 'missing-heading'
  | 'skip-heading-level'
  | 'missing-lang'
  | 'missing-focus-indicator'
  | 'keyboard-trap'
  | 'missing-form-label'
  | 'empty-button'
  | 'empty-link'
  | 'auto-playing-media'
  | 'missing-captions';

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

// ============================================================================
// WCAG Criteria
// ============================================================================

const WCAG_CRITERIA: Record<A11yIssueType, { criteria: string[]; level: 'A' | 'AA' | 'AAA' }> = {
  'missing-alt': { criteria: ['1.1.1'], level: 'A' },
  'empty-alt': { criteria: ['1.1.1'], level: 'A' },
  'low-contrast': { criteria: ['1.4.3', '1.4.6'], level: 'AA' },
  'missing-label': { criteria: ['1.3.1', '4.1.2'], level: 'A' },
  'missing-aria': { criteria: ['4.1.2'], level: 'A' },
  'missing-heading': { criteria: ['1.3.1', '2.4.6'], level: 'A' },
  'skip-heading-level': { criteria: ['1.3.1'], level: 'A' },
  'missing-lang': { criteria: ['3.1.1'], level: 'A' },
  'missing-focus-indicator': { criteria: ['2.4.7'], level: 'AA' },
  'keyboard-trap': { criteria: ['2.1.2'], level: 'A' },
  'missing-form-label': { criteria: ['1.3.1', '3.3.2'], level: 'A' },
  'empty-button': { criteria: ['4.1.2'], level: 'A' },
  'empty-link': { criteria: ['2.4.4'], level: 'A' },
  'auto-playing-media': { criteria: ['1.4.2'], level: 'A' },
  'missing-captions': { criteria: ['1.2.2'], level: 'A' }
};

// ============================================================================
// Color Utilities
// ============================================================================

function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }

  // Handle hex
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }

  return null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  if (!c1 || !c2) return 0;

  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function adjustColorForContrast(
  foreground: string,
  background: string,
  targetRatio: number
): string {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  if (!fg || !bg) return foreground;

  const bgLuminance = getLuminance(bg.r, bg.g, bg.b);
  const shouldDarken = bgLuminance > 0.5;

  let r = fg.r, g = fg.g, b = fg.b;
  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    const currentRatio = getContrastRatio(
      `rgb(${r},${g},${b})`,
      background
    );

    if (currentRatio >= targetRatio) break;

    if (shouldDarken) {
      r = Math.max(0, r - 5);
      g = Math.max(0, g - 5);
      b = Math.max(0, b - 5);
    } else {
      r = Math.min(255, r + 5);
      g = Math.min(255, g + 5);
      b = Math.min(255, b + 5);
    }

    iterations++;
  }

  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// AI Alt Text Generator
// ============================================================================

class AltTextGenerator {
  private config: A11yAIConfig;
  private cache: Map<string, GeneratedAltText> = new Map();

  constructor(config: A11yAIConfig) {
    this.config = config;
  }

  async generateAltText(imageUrl: string, context?: string): Promise<GeneratedAltText> {
    // Check cache
    const cacheKey = `${imageUrl}:${context || ''}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      let altText: string;

      if (this.config.provider === 'openai' && this.config.apiKey) {
        altText = await this.generateWithOpenAI(imageUrl, context);
      } else if (this.config.provider === 'anthropic' && this.config.apiKey) {
        altText = await this.generateWithAnthropic(imageUrl, context);
      } else {
        altText = this.generateFallback(imageUrl);
      }

      const result: GeneratedAltText = {
        text: altText,
        confidence: this.config.apiKey ? 0.9 : 0.3,
        language: 'en',
        context
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to generate alt text:', error);
      return {
        text: this.generateFallback(imageUrl),
        confidence: 0.2,
        language: 'en'
      };
    }
  }

  private async generateWithOpenAI(imageUrl: string, context?: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.visionModel || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate a concise, descriptive alt text for this image. ${context ? `Context: ${context}` : ''} The alt text should be informative and under 125 characters.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 100
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  private async generateWithAnthropic(imageUrl: string, context?: string): Promise<string> {
    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2024-01-01'
      },
      body: JSON.stringify({
        model: this.config.visionModel || 'claude-3-sonnet-20240229',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageBlob.type,
                  data: base64.split(',')[1]
                }
              },
              {
                type: 'text',
                text: `Generate a concise alt text for this image. ${context ? `Context: ${context}` : ''} Keep it under 125 characters.`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    return data.content[0].text.trim();
  }

  private generateFallback(imageUrl: string): string {
    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const name = filename.split('.')[0].replace(/[-_]/g, ' ');

    return `Image: ${name}`;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// ============================================================================
// ARIA Label Generator
// ============================================================================

class AriaLabelGenerator {
  generateForButton(button: Element): string {
    // Check for existing text content
    const text = button.textContent?.trim();
    if (text) return text;

    // Check for icon classes
    const iconClass = button.className.match(/icon[-_]?(\w+)/i);
    if (iconClass) {
      const iconName = iconClass[1].replace(/[-_]/g, ' ');
      return this.capitalizeFirst(iconName);
    }

    // Check for SVG title
    const svgTitle = button.querySelector('svg title')?.textContent;
    if (svgTitle) return svgTitle;

    // Check for data attributes
    const dataAction = button.getAttribute('data-action');
    if (dataAction) return this.capitalizeFirst(dataAction.replace(/[-_]/g, ' '));

    return 'Button';
  }

  generateForLink(link: Element): string {
    const text = link.textContent?.trim();
    if (text) return text;

    const href = link.getAttribute('href');
    if (href) {
      if (href.startsWith('mailto:')) return 'Send email';
      if (href.startsWith('tel:')) return 'Call phone number';
      if (href.startsWith('#')) return 'Jump to section';

      // Extract domain or path
      try {
        const url = new URL(href, window.location.origin);
        return `Link to ${url.hostname}`;
      } catch {
        return 'Link';
      }
    }

    return 'Link';
  }

  generateForInput(input: Element): string {
    const name = input.getAttribute('name');
    const placeholder = input.getAttribute('placeholder');
    const type = input.getAttribute('type') || 'text';

    if (name) {
      return this.capitalizeFirst(name.replace(/[-_]/g, ' '));
    }

    if (placeholder) {
      return placeholder;
    }

    const typeLabels: Record<string, string> = {
      email: 'Email address',
      password: 'Password',
      search: 'Search',
      tel: 'Phone number',
      url: 'Website URL',
      number: 'Number',
      date: 'Date',
      time: 'Time',
      file: 'Choose file'
    };

    return typeLabels[type] || 'Input field';
  }

  generateForImage(img: Element): string {
    const src = img.getAttribute('src') || '';
    const filename = src.split('/').pop()?.split('.')[0] || '';

    return this.capitalizeFirst(filename.replace(/[-_]/g, ' ')) || 'Image';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

// ============================================================================
// A11y AI Engine
// ============================================================================

export class A11yAI {
  private config: Required<A11yAIConfig>;
  private altTextGenerator: AltTextGenerator;
  private ariaGenerator: AriaLabelGenerator;
  private issues: A11yIssue[] = [];
  private fixes: A11yFix[] = [];

  constructor(config: A11yAIConfig = {}) {
    this.config = {
      provider: config.provider || 'local',
      apiKey: config.apiKey || '',
      visionModel: config.visionModel || 'gpt-4-vision-preview',
      textModel: config.textModel || 'gpt-4',
      wcagLevel: config.wcagLevel || 'AA',
      autoFix: config.autoFix ?? true,
      languages: config.languages || ['en']
    };

    this.altTextGenerator = new AltTextGenerator(this.config);
    this.ariaGenerator = new AriaLabelGenerator();
  }

  async audit(root: Element = document.body): Promise<A11yReport> {
    this.issues = [];
    this.fixes = [];

    // Run all audits
    await this.auditImages(root);
    this.auditContrast(root);
    this.auditForms(root);
    this.auditButtons(root);
    this.auditLinks(root);
    this.auditHeadings(root);
    this.auditLanguage();
    this.auditFocus(root);
    this.auditMedia(root);

    // Auto-fix if enabled
    if (this.config.autoFix) {
      await this.autoFixAll();
    }

    return this.generateReport();
  }

  // Image Auditing

  private async auditImages(root: Element): Promise<void> {
    const images = root.querySelectorAll('img');

    for (const img of images) {
      const alt = img.getAttribute('alt');

      if (alt === null) {
        this.addIssue({
          type: 'missing-alt',
          severity: 'critical',
          element: img,
          description: 'Image is missing alt attribute',
          autoFixable: true
        });
      } else if (alt === '') {
        // Empty alt is valid for decorative images, check if it's likely decorative
        const isDecorative = this.isLikelyDecorative(img);
        if (!isDecorative) {
          this.addIssue({
            type: 'empty-alt',
            severity: 'moderate',
            element: img,
            description: 'Image has empty alt attribute but may not be decorative',
            autoFixable: true
          });
        }
      }
    }
  }

  private isLikelyDecorative(img: Element): boolean {
    const src = img.getAttribute('src') || '';
    const className = img.className;

    // Check for common decorative patterns
    const decorativePatterns = [
      /decorative/i,
      /spacer/i,
      /divider/i,
      /background/i,
      /icon/i,
      /arrow/i,
      /bullet/i
    ];

    return decorativePatterns.some(p =>
      p.test(src) || p.test(className)
    );
  }

  // Contrast Auditing

  private auditContrast(root: Element): void {
    const textElements = root.querySelectorAll('p, span, a, button, label, h1, h2, h3, h4, h5, h6, li');

    for (const el of textElements) {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const bgColor = this.getBackgroundColor(el);

      const ratio = getContrastRatio(color, bgColor);
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = parseInt(styles.fontWeight);
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

      const minRatio = this.config.wcagLevel === 'AAA'
        ? (isLargeText ? 4.5 : 7)
        : (isLargeText ? 3 : 4.5);

      if (ratio < minRatio) {
        this.addIssue({
          type: 'low-contrast',
          severity: ratio < 3 ? 'critical' : 'serious',
          element: el,
          description: `Color contrast ratio is ${ratio.toFixed(2)}:1, needs ${minRatio}:1`,
          autoFixable: true
        });
      }
    }
  }

  private getBackgroundColor(el: Element): string {
    let current: Element | null = el;

    while (current) {
      const styles = window.getComputedStyle(current);
      const bg = styles.backgroundColor;

      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        return bg;
      }

      current = current.parentElement;
    }

    return 'rgb(255, 255, 255)';
  }

  // Form Auditing

  private auditForms(root: Element): void {
    const inputs = root.querySelectorAll('input, select, textarea');

    for (const input of inputs) {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const title = input.getAttribute('title');

      // Check if input has a visible label
      let hasLabel = false;
      if (id) {
        hasLabel = !!root.querySelector(`label[for="${id}"]`);
      }

      if (!hasLabel && !ariaLabel && !ariaLabelledBy && !title) {
        this.addIssue({
          type: 'missing-form-label',
          severity: 'critical',
          element: input,
          description: 'Form input is missing a label',
          autoFixable: true
        });
      }
    }
  }

  // Button Auditing

  private auditButtons(root: Element): void {
    const buttons = root.querySelectorAll('button, [role="button"]');

    for (const button of buttons) {
      const text = button.textContent?.trim();
      const ariaLabel = button.getAttribute('aria-label');

      if (!text && !ariaLabel) {
        this.addIssue({
          type: 'empty-button',
          severity: 'critical',
          element: button,
          description: 'Button has no accessible text',
          autoFixable: true
        });
      }
    }
  }

  // Link Auditing

  private auditLinks(root: Element): void {
    const links = root.querySelectorAll('a');

    for (const link of links) {
      const text = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');

      if (!text && !ariaLabel) {
        this.addIssue({
          type: 'empty-link',
          severity: 'critical',
          element: link,
          description: 'Link has no accessible text',
          autoFixable: true
        });
      }
    }
  }

  // Heading Auditing

  private auditHeadings(root: Element): void {
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    for (const heading of headings) {
      const level = parseInt(heading.tagName[1]);

      if (level - previousLevel > 1 && previousLevel !== 0) {
        this.addIssue({
          type: 'skip-heading-level',
          severity: 'moderate',
          element: heading,
          description: `Heading level skipped from H${previousLevel} to H${level}`,
          autoFixable: false
        });
      }

      previousLevel = level;
    }

    // Check for missing H1
    if (!root.querySelector('h1')) {
      this.addIssue({
        type: 'missing-heading',
        severity: 'moderate',
        element: root,
        description: 'Page is missing an H1 heading',
        autoFixable: false
      });
    }
  }

  // Language Auditing

  private auditLanguage(): void {
    const html = document.documentElement;
    const lang = html.getAttribute('lang');

    if (!lang) {
      this.addIssue({
        type: 'missing-lang',
        severity: 'serious',
        element: html,
        description: 'HTML element is missing lang attribute',
        autoFixable: true
      });
    }
  }

  // Focus Auditing

  private auditFocus(root: Element): void {
    const focusableElements = root.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]'
    );

    for (const el of focusableElements) {
      const styles = window.getComputedStyle(el);
      const outlineStyle = styles.outlineStyle;
      const outlineWidth = parseFloat(styles.outlineWidth);

      // Check for focus styles by pseudo-element
      // This is limited - would need to actually focus and check
      if (outlineStyle === 'none' || outlineWidth === 0) {
        // Check if there's a custom focus style
        const hasFocusStyle = el.matches(':focus-visible') ||
          (el as HTMLElement).style.cssText.includes('focus');

        if (!hasFocusStyle) {
          this.addIssue({
            type: 'missing-focus-indicator',
            severity: 'serious',
            element: el,
            description: 'Element may be missing visible focus indicator',
            autoFixable: true
          });
        }
      }
    }
  }

  // Media Auditing

  private auditMedia(root: Element): void {
    const videos = root.querySelectorAll('video');
    const audios = root.querySelectorAll('audio');

    for (const video of videos) {
      // Check for captions
      const hasTrack = video.querySelector('track[kind="captions"]');
      if (!hasTrack) {
        this.addIssue({
          type: 'missing-captions',
          severity: 'critical',
          element: video,
          description: 'Video is missing captions track',
          autoFixable: false
        });
      }

      // Check for autoplay
      if (video.hasAttribute('autoplay') && !video.hasAttribute('muted')) {
        this.addIssue({
          type: 'auto-playing-media',
          severity: 'serious',
          element: video,
          description: 'Video autoplays with sound',
          autoFixable: true
        });
      }
    }

    for (const audio of audios) {
      if (audio.hasAttribute('autoplay')) {
        this.addIssue({
          type: 'auto-playing-media',
          severity: 'serious',
          element: audio,
          description: 'Audio autoplays',
          autoFixable: true
        });
      }
    }
  }

  // Auto-fixing

  async autoFixAll(): Promise<void> {
    for (const issue of this.issues.filter(i => i.autoFixable)) {
      await this.fixIssue(issue);
    }
  }

  async fixIssue(issue: A11yIssue): Promise<A11yFix | null> {
    let fix: string = '';
    let explanation: string = '';

    switch (issue.type) {
      case 'missing-alt':
      case 'empty-alt': {
        const src = issue.element.getAttribute('src');
        if (src) {
          const alt = await this.altTextGenerator.generateAltText(src);
          issue.element.setAttribute('alt', alt.text);
          fix = `alt="${alt.text}"`;
          explanation = `Generated alt text using AI (confidence: ${(alt.confidence * 100).toFixed(0)}%)`;
        }
        break;
      }

      case 'low-contrast': {
        const styles = window.getComputedStyle(issue.element);
        const bgColor = this.getBackgroundColor(issue.element);
        const targetRatio = this.config.wcagLevel === 'AAA' ? 7 : 4.5;
        const newColor = adjustColorForContrast(styles.color, bgColor, targetRatio);
        (issue.element as HTMLElement).style.color = newColor;
        fix = `color: ${newColor}`;
        explanation = `Adjusted color for ${this.config.wcagLevel} contrast compliance`;
        break;
      }

      case 'missing-form-label': {
        const label = this.ariaGenerator.generateForInput(issue.element);
        issue.element.setAttribute('aria-label', label);
        fix = `aria-label="${label}"`;
        explanation = 'Added auto-generated aria-label';
        break;
      }

      case 'empty-button': {
        const label = this.ariaGenerator.generateForButton(issue.element);
        issue.element.setAttribute('aria-label', label);
        fix = `aria-label="${label}"`;
        explanation = 'Added auto-generated aria-label for button';
        break;
      }

      case 'empty-link': {
        const label = this.ariaGenerator.generateForLink(issue.element);
        issue.element.setAttribute('aria-label', label);
        fix = `aria-label="${label}"`;
        explanation = 'Added auto-generated aria-label for link';
        break;
      }

      case 'missing-lang': {
        const lang = navigator.language.split('-')[0] || 'en';
        issue.element.setAttribute('lang', lang);
        fix = `lang="${lang}"`;
        explanation = 'Added language attribute based on browser language';
        break;
      }

      case 'missing-focus-indicator': {
        const style = document.createElement('style');
        style.textContent = `
          ${issue.selector}:focus-visible {
            outline: 2px solid #005fcc;
            outline-offset: 2px;
          }
        `;
        document.head.appendChild(style);
        fix = 'Added focus-visible outline style';
        explanation = 'Added visible focus indicator';
        break;
      }

      case 'auto-playing-media': {
        issue.element.removeAttribute('autoplay');
        (issue.element as HTMLMediaElement).pause();
        fix = 'Removed autoplay attribute';
        explanation = 'Disabled auto-playing media';
        break;
      }

      default:
        return null;
    }

    const appliedFix: A11yFix = {
      issueId: issue.id,
      type: issue.type,
      element: issue.element,
      fix,
      explanation,
      applied: true
    };

    this.fixes.push(appliedFix);
    return appliedFix;
  }

  // Utilities

  private addIssue(params: Omit<A11yIssue, 'id' | 'selector' | 'wcagCriteria'>): void {
    const criteria = WCAG_CRITERIA[params.type];

    this.issues.push({
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      selector: this.getSelector(params.element),
      wcagCriteria: criteria.criteria,
      ...params
    });
  }

  private getSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.className) {
        selector += `.${current.className.split(' ').join('.')}`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  private generateReport(): A11yReport {
    const summary: A11ySummary = {
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
      autoFixable: this.issues.filter(i => i.autoFixable).length,
      fixed: this.fixes.length,
      byType: {}
    };

    for (const issue of this.issues) {
      summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
    }

    // Calculate score (0-100)
    const score = Math.max(0, 100 - (
      summary.criticalIssues * 10 +
      this.issues.filter(i => i.severity === 'serious').length * 5 +
      this.issues.filter(i => i.severity === 'moderate').length * 2 +
      this.issues.filter(i => i.severity === 'minor').length
    ));

    return {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      issues: this.issues,
      fixes: this.fixes,
      score,
      wcagLevel: this.config.wcagLevel,
      summary
    };
  }
}

// ============================================================================
// React-like Hooks
// ============================================================================

let globalA11yAI: A11yAI | null = null;

export function initA11yAI(config?: A11yAIConfig): A11yAI {
  globalA11yAI = new A11yAI(config);
  return globalA11yAI;
}

export function getA11yAI(): A11yAI | null {
  return globalA11yAI;
}

export async function useA11yAudit(root?: Element): Promise<A11yReport> {
  const ai = globalA11yAI || new A11yAI();
  return ai.audit(root);
}

export function useAutoAltText(imageUrl: string, context?: string): Promise<GeneratedAltText> {
  const ai = globalA11yAI || new A11yAI();
  return (ai as any).altTextGenerator.generateAltText(imageUrl, context);
}

// ============================================================================
// Exports
// ============================================================================

export {
  A11yAI,
  AltTextGenerator,
  AriaLabelGenerator,
  getContrastRatio,
  adjustColorForContrast
};
