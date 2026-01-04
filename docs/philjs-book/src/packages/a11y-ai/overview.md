# @philjs/a11y-ai - AI-Powered Accessibility

**Automatic WCAG compliance with AI-generated fixes.**

@philjs/a11y-ai brings AI-powered accessibility auditing and auto-remediation to your PhilJS applications. It automatically detects WCAG violations, generates alt text using vision AI, fixes color contrast issues, and adds missing ARIA labels - all with minimal configuration.

## Installation

```bash
npm install @philjs/a11y-ai
# or
pnpm add @philjs/a11y-ai
# or
bun add @philjs/a11y-ai
```

## Why @philjs/a11y-ai?

Building accessible applications typically requires:
- Manual auditing with tools like axe or Lighthouse
- Writing descriptive alt text for every image
- Calculating and fixing color contrast ratios
- Adding ARIA labels to interactive elements
- Understanding WCAG success criteria

@philjs/a11y-ai automates all of this with AI-powered detection and remediation.

## Features

| Feature | Description |
|---------|-------------|
| **AI Alt Text** | Auto-generate descriptive alt text using GPT-4V or Claude Vision |
| **Contrast Fixing** | Automatically adjust colors to meet WCAG AA/AAA ratios |
| **ARIA Generation** | Intelligently add missing ARIA labels to buttons, links, inputs |
| **WCAG Auditing** | Comprehensive audit against WCAG 2.1 A, AA, and AAA criteria |
| **Auto-Fix** | One-click remediation for all auto-fixable issues |
| **Detailed Reports** | Accessibility scores, issue breakdowns, and fix explanations |
| **Caching** | AI responses cached to reduce API costs |
| **Multi-Provider** | Support for OpenAI, Anthropic, or local fallback |

## Quick Start

```typescript
import { A11yAI, initA11yAI } from '@philjs/a11y-ai';

// Create an instance with AI provider
const a11y = new A11yAI({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  wcagLevel: 'AA',
  autoFix: true
});

// Run accessibility audit on the page
const report = await a11y.audit(document.body);

console.log('Accessibility Score:', report.score);
console.log('Total Issues:', report.summary.totalIssues);
console.log('Critical Issues:', report.summary.criticalIssues);
console.log('Auto-Fixed:', report.summary.fixed);
```

## Configuration

The `A11yAIConfig` interface provides full control over the AI-powered accessibility engine:

```typescript
import { A11yAI, type A11yAIConfig } from '@philjs/a11y-ai';

const config: A11yAIConfig = {
  // AI provider: 'openai', 'anthropic', or 'local'
  provider: 'openai',

  // API key for the selected provider
  apiKey: process.env.OPENAI_API_KEY,

  // Model for image analysis (alt text generation)
  visionModel: 'gpt-4-vision-preview',

  // Model for text generation tasks
  textModel: 'gpt-4',

  // Target WCAG compliance level
  wcagLevel: 'AA', // 'A' | 'AA' | 'AAA'

  // Automatically fix issues when detected
  autoFix: true,

  // Languages for generated content
  languages: ['en', 'es', 'fr']
};

const a11y = new A11yAI(config);
```

## AI-Generated Alt Text

The most powerful feature is automatic alt text generation using vision AI models:

```typescript
import { useAutoAltText, initA11yAI } from '@philjs/a11y-ai';

// Initialize with your preferred AI provider
initA11yAI({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Generate alt text for any image
const altText = await useAutoAltText(
  'https://example.com/product-photo.jpg',
  'Product photo on e-commerce page' // Optional context
);

console.log(altText.text);       // "Red leather handbag with gold clasp"
console.log(altText.confidence); // 0.92 (high confidence with AI provider)
console.log(altText.language);   // "en"
```

### Alt Text with Context

Providing context improves alt text quality:

```typescript
// E-commerce context
const productAlt = await useAutoAltText(
  imageUrl,
  'Main product image for a luxury fashion store'
);

// Blog context
const blogAlt = await useAutoAltText(
  imageUrl,
  'Header image for a travel blog post about Japan'
);

// Documentation context
const docAlt = await useAutoAltText(
  imageUrl,
  'Screenshot showing the settings panel in the dashboard'
);
```

### Fallback Behavior

When no API key is configured, alt text is generated from the image filename:

```typescript
const a11y = new A11yAI({ provider: 'local' });

// Fallback extracts from URL
// 'https://cdn.example.com/red-leather-bag.jpg' -> 'Image: red leather bag'
```

## Color Contrast Utilities

The package exports utility functions for working with color contrast:

```typescript
import { getContrastRatio, adjustColorForContrast } from '@philjs/a11y-ai';

// Calculate WCAG contrast ratio between two colors
const ratio = getContrastRatio('#666666', '#ffffff');
console.log(ratio); // 5.74:1 (passes WCAG AA for normal text)

// Check if contrast passes WCAG AA
const passesAA = ratio >= 4.5; // Normal text
const passesAALarge = ratio >= 3; // Large text (18pt+ or 14pt bold+)

// Auto-fix low contrast by adjusting foreground color
const fixedColor = adjustColorForContrast(
  '#999999',   // Low contrast foreground
  '#ffffff',   // Background
  4.5          // Target ratio (WCAG AA)
);
console.log(fixedColor); // "rgb(118, 118, 118)"
```

### Supported Color Formats

The contrast utilities support common color formats:

```typescript
// RGB/RGBA format
getContrastRatio('rgb(102, 102, 102)', 'rgb(255, 255, 255)');
getContrastRatio('rgba(102, 102, 102, 1)', 'rgba(255, 255, 255, 1)');

// Hex format (with or without #)
getContrastRatio('#666666', '#ffffff');
getContrastRatio('666666', 'ffffff');
```

## ARIA Label Generation

The `AriaLabelGenerator` class intelligently generates accessible labels:

```typescript
import { AriaLabelGenerator } from '@philjs/a11y-ai';

const generator = new AriaLabelGenerator();

// Generate labels for buttons
const buttonLabel = generator.generateForButton(buttonElement);
// Extracts from: text content, icon classes, SVG titles, data-action attributes

// Generate labels for links
const linkLabel = generator.generateForLink(linkElement);
// Smart detection: mailto:, tel:, anchor links, external URLs

// Generate labels for inputs
const inputLabel = generator.generateForInput(inputElement);
// Uses: name attribute, placeholder, or input type
```

### Smart Label Detection

The ARIA generator uses multiple strategies:

```typescript
// Button with icon class
// <button class="icon-search"></button>
generator.generateForButton(button); // "Search"

// Button with SVG
// <button><svg><title>Close dialog</title></svg></button>
generator.generateForButton(button); // "Close dialog"

// Button with data-action
// <button data-action="submit-form"></button>
generator.generateForButton(button); // "Submit form"

// Link with special protocols
// <a href="mailto:hello@example.com"></a>
generator.generateForLink(link); // "Send email"

// <a href="tel:+1234567890"></a>
generator.generateForLink(link); // "Call phone number"

// Input with semantic name
// <input name="email_address" />
generator.generateForInput(input); // "Email address"
```

## Comprehensive Auditing

The `A11yAI` class performs thorough accessibility audits:

```typescript
import { A11yAI } from '@philjs/a11y-ai';

const a11y = new A11yAI({
  wcagLevel: 'AA',
  autoFix: false // Audit only, no auto-remediation
});

const report = await a11y.audit(document.body);

// Iterate through detected issues
for (const issue of report.issues) {
  console.log(`[${issue.severity}] ${issue.type}`);
  console.log(`  Description: ${issue.description}`);
  console.log(`  WCAG Criteria: ${issue.wcagCriteria.join(', ')}`);
  console.log(`  Element: ${issue.selector}`);
  console.log(`  Auto-fixable: ${issue.autoFixable}`);
}
```

### Issue Types Detected

| Issue Type | WCAG Criteria | Severity | Auto-fixable |
|------------|---------------|----------|--------------|
| `missing-alt` | 1.1.1 | Critical | Yes |
| `empty-alt` | 1.1.1 | Moderate | Yes |
| `low-contrast` | 1.4.3, 1.4.6 | Serious | Yes |
| `missing-label` | 1.3.1, 4.1.2 | Critical | Yes |
| `missing-aria` | 4.1.2 | Critical | Yes |
| `missing-heading` | 1.3.1, 2.4.6 | Moderate | No |
| `skip-heading-level` | 1.3.1 | Moderate | No |
| `missing-lang` | 3.1.1 | Serious | Yes |
| `missing-focus-indicator` | 2.4.7 | Serious | Yes |
| `keyboard-trap` | 2.1.2 | Critical | No |
| `missing-form-label` | 1.3.1, 3.3.2 | Critical | Yes |
| `empty-button` | 4.1.2 | Critical | Yes |
| `empty-link` | 2.4.4 | Critical | Yes |
| `auto-playing-media` | 1.4.2 | Serious | Yes |
| `missing-captions` | 1.2.2 | Critical | No |

## Auto-Fixing Issues

Enable automatic remediation for detected issues:

```typescript
import { A11yAI } from '@philjs/a11y-ai';

const a11y = new A11yAI({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  autoFix: true
});

// Audit and auto-fix in one call
const report = await a11y.audit(document.body);

console.log(`Fixed ${report.summary.fixed} of ${report.summary.autoFixable} issues`);

// Or fix issues manually after audit
const a11yManual = new A11yAI({ autoFix: false });
const manualReport = await a11yManual.audit();

// Fix all auto-fixable issues
await a11yManual.autoFixAll();

// Or fix individual issues
for (const issue of manualReport.issues.filter(i => i.autoFixable)) {
  const fix = await a11yManual.fixIssue(issue);
  if (fix) {
    console.log(`Applied: ${fix.fix}`);
    console.log(`Explanation: ${fix.explanation}`);
  }
}
```

### Fix Details

Each fix includes detailed information:

```typescript
interface A11yFix {
  issueId: string;      // Reference to the original issue
  type: A11yIssueType;  // Type of issue fixed
  element: Element;     // DOM element that was modified
  fix: string;          // Description of the fix applied
  explanation: string;  // AI-generated explanation
  applied: boolean;     // Whether the fix was successfully applied
}
```

Example fix outputs:

```typescript
// Alt text fix
{
  fix: 'alt="Red leather handbag with gold clasp on white background"',
  explanation: 'Generated alt text using AI (confidence: 92%)'
}

// Contrast fix
{
  fix: 'color: rgb(70, 70, 70)',
  explanation: 'Adjusted color for AA contrast compliance'
}

// ARIA label fix
{
  fix: 'aria-label="Submit form"',
  explanation: 'Added auto-generated aria-label for button'
}

// Language fix
{
  fix: 'lang="en"',
  explanation: 'Added language attribute based on browser language'
}
```

## Working with Reports

The audit generates comprehensive reports:

```typescript
import type { A11yReport, A11ySummary } from '@philjs/a11y-ai';

const report: A11yReport = await a11y.audit();

// Report structure
console.log(report.timestamp);  // Unix timestamp
console.log(report.url);        // Current page URL
console.log(report.score);      // 0-100 accessibility score
console.log(report.wcagLevel);  // Target WCAG level

// Summary statistics
const summary: A11ySummary = report.summary;
console.log(summary.totalIssues);    // Total issues found
console.log(summary.criticalIssues); // Critical severity count
console.log(summary.autoFixable);    // Issues that can be auto-fixed
console.log(summary.fixed);          // Issues that were fixed
console.log(summary.byType);         // Count by issue type

// Issues by type breakdown
console.log('Missing alt texts:', summary.byType['missing-alt']);
console.log('Low contrast:', summary.byType['low-contrast']);
console.log('Empty buttons:', summary.byType['empty-button']);
```

### Scoring Algorithm

The accessibility score (0-100) is calculated based on issue severity:

- Critical issues: -10 points each
- Serious issues: -5 points each
- Moderate issues: -2 points each
- Minor issues: -1 point each

```typescript
// Example score calculation
// 2 critical (-20) + 3 serious (-15) + 5 moderate (-10) + 2 minor (-2)
// Score: 100 - 47 = 53
```

## Global Initialization

For app-wide accessibility monitoring:

```typescript
import { initA11yAI, getA11yAI, useA11yAudit } from '@philjs/a11y-ai';

// Initialize once at app startup
initA11yAI({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  wcagLevel: 'AA',
  autoFix: true
});

// Get the global instance anywhere
const a11y = getA11yAI();

// Use the hook pattern for audits
const report = await useA11yAudit(document.body);

// Works without element argument (defaults to document.body)
const pageReport = await useA11yAudit();
```

## Provider Configuration

### OpenAI Provider

```typescript
const a11y = new A11yAI({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  visionModel: 'gpt-4-vision-preview', // or 'gpt-4o'
  textModel: 'gpt-4'
});
```

### Anthropic Provider

```typescript
const a11y = new A11yAI({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  visionModel: 'claude-3-sonnet-20240229' // or 'claude-3-opus-20240229'
});
```

### Local Fallback

For development without API keys:

```typescript
const a11y = new A11yAI({
  provider: 'local'
  // No API key needed - uses filename-based alt text
});
```

## Types Reference

### A11yAIConfig

```typescript
interface A11yAIConfig {
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
```

### A11yIssue

```typescript
interface A11yIssue {
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
```

### A11yIssueType

```typescript
type A11yIssueType =
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
```

### A11yFix

```typescript
interface A11yFix {
  issueId: string;
  type: A11yIssueType;
  element: Element;
  fix: string;
  explanation: string;
  applied: boolean;
}
```

### A11yReport

```typescript
interface A11yReport {
  timestamp: number;
  url: string;
  issues: A11yIssue[];
  fixes: A11yFix[];
  score: number;
  wcagLevel: string;
  summary: A11ySummary;
}
```

### A11ySummary

```typescript
interface A11ySummary {
  totalIssues: number;
  criticalIssues: number;
  autoFixable: number;
  fixed: number;
  byType: Record<string, number>;
}
```

### GeneratedAltText

```typescript
interface GeneratedAltText {
  text: string;
  confidence: number;
  language: string;
  context?: string;
}
```

### ColorContrastFix

```typescript
interface ColorContrastFix {
  foreground: string;
  background: string;
  originalRatio: number;
  fixedRatio: number;
  wcagLevel: 'AA' | 'AAA';
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `A11yAI` | Main accessibility engine with audit and auto-fix capabilities |
| `AltTextGenerator` | AI-powered alt text generation for images |
| `AriaLabelGenerator` | Intelligent ARIA label generation for elements |

### A11yAI Methods

| Method | Description |
|--------|-------------|
| `audit(root?)` | Run full accessibility audit on element (defaults to document.body) |
| `autoFixAll()` | Auto-fix all fixable issues found in last audit |
| `fixIssue(issue)` | Fix a specific accessibility issue |

### Hooks and Functions

| Function | Description |
|----------|-------------|
| `initA11yAI(config)` | Initialize global A11yAI instance |
| `getA11yAI()` | Get the global A11yAI instance |
| `useA11yAudit(root?)` | Run audit using global instance |
| `useAutoAltText(url, context?)` | Generate alt text for an image URL |

### Utility Functions

| Function | Description |
|----------|-------------|
| `getContrastRatio(color1, color2)` | Calculate WCAG contrast ratio between two colors |
| `adjustColorForContrast(fg, bg, target)` | Adjust foreground color to meet target contrast ratio |

## Best Practices

1. **Run audits in development** - Catch issues early in the development cycle
2. **Use AI providers for production** - Get high-quality alt text with vision models
3. **Set appropriate WCAG level** - Start with AA, upgrade to AAA for critical applications
4. **Review auto-fixes** - Always review AI-generated content before deployment
5. **Cache API responses** - Alt text generation is cached to reduce API costs
6. **Provide context for images** - Better context produces better alt text
7. **Address critical issues first** - Focus on critical/serious issues before moderate/minor

## Integration Example

Full integration with a PhilJS application:

```typescript
import { createSignal, onMount } from '@philjs/core';
import { A11yAI, type A11yReport } from '@philjs/a11y-ai';

function AccessibilityDashboard() {
  const [report, setReport] = createSignal<A11yReport | null>(null);
  const [loading, setLoading] = createSignal(false);

  const a11y = new A11yAI({
    provider: 'openai',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    wcagLevel: 'AA',
    autoFix: false
  });

  const runAudit = async () => {
    setLoading(true);
    const result = await a11y.audit(document.body);
    setReport(result);
    setLoading(false);
  };

  const fixAll = async () => {
    setLoading(true);
    await a11y.autoFixAll();
    // Re-run audit to update report
    const result = await a11y.audit(document.body);
    setReport(result);
    setLoading(false);
  };

  onMount(() => {
    runAudit();
  });

  return (
    <div class="a11y-dashboard">
      <h2>Accessibility Report</h2>

      {loading() && <p>Auditing...</p>}

      {report() && (
        <>
          <div class="score">
            Score: {report()!.score}/100
          </div>

          <div class="summary">
            <p>Total Issues: {report()!.summary.totalIssues}</p>
            <p>Critical: {report()!.summary.criticalIssues}</p>
            <p>Auto-fixable: {report()!.summary.autoFixable}</p>
          </div>

          <button onClick={fixAll}>
            Fix All ({report()!.summary.autoFixable} issues)
          </button>

          <ul class="issues">
            {report()!.issues.map(issue => (
              <li class={`issue ${issue.severity}`}>
                <strong>[{issue.severity}]</strong> {issue.description}
                <br />
                <small>WCAG {issue.wcagCriteria.join(', ')}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

## License

MIT
