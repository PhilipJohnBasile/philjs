# @philjs/a11y-ai

AI-powered accessibility toolkit that automatically detects and fixes WCAG compliance issues.

![Node 24+](https://img.shields.io/badge/Node-24%2B-brightgreen)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-blue)

## Features

- Auto-generate alt text for images using AI vision
- Fix color contrast issues automatically
- Add missing ARIA labels intelligently
- Generate accessible descriptions
- Keyboard navigation optimization
- Screen reader optimization
- Focus management
- WCAG A/AA/AAA compliance checking

## Installation

```bash
npm install @philjs/a11y-ai
```

## Usage

### Basic Audit

```typescript
import { A11yAI, initA11yAI } from '@philjs/a11y-ai';

// Initialize with AI provider
const a11y = new A11yAI({
  provider: 'openai',
  apiKey: 'your-api-key',
  wcagLevel: 'AA',
  autoFix: true
});

// Run accessibility audit
const report = await a11y.audit(document.body);

console.log('Score:', report.score);
console.log('Issues found:', report.summary.totalIssues);
console.log('Auto-fixed:', report.summary.fixed);
```

### AI-Generated Alt Text

```typescript
import { useAutoAltText } from '@philjs/a11y-ai';

// Generate alt text for an image
const altText = await useAutoAltText(
  'https://example.com/image.jpg',
  'Product photo on e-commerce page'
);

console.log(altText.text);        // "Red leather handbag with gold buckle"
console.log(altText.confidence);  // 0.92
```

### Global Initialization

```typescript
import { initA11yAI, useA11yAudit } from '@philjs/a11y-ai';

// Initialize once
initA11yAI({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_KEY,
  wcagLevel: 'AAA',
  autoFix: true,
  languages: ['en', 'es']
});

// Use anywhere in your app
const report = await useA11yAudit();
```

### Color Contrast Fixes

```typescript
import { getContrastRatio, adjustColorForContrast } from '@philjs/a11y-ai';

// Check contrast ratio
const ratio = getContrastRatio('#666666', '#ffffff');
console.log(ratio); // 5.74

// Auto-fix low contrast
const fixedColor = adjustColorForContrast(
  '#999999',    // foreground
  '#ffffff',    // background
  4.5           // target ratio (WCAG AA)
);
console.log(fixedColor); // "rgb(118, 118, 118)"
```

### Working with Reports

```typescript
const report = await a11y.audit();

// Iterate through issues
for (const issue of report.issues) {
  console.log(`[${issue.severity}] ${issue.description}`);
  console.log(`  WCAG: ${issue.wcagCriteria.join(', ')}`);
  console.log(`  Element: ${issue.selector}`);
  console.log(`  Auto-fixable: ${issue.autoFixable}`);
}

// Check issues by type
console.log('Missing alt texts:', report.summary.byType['missing-alt']);
console.log('Low contrast:', report.summary.byType['low-contrast']);
```

## API Reference

### A11yAI Class

| Method | Description |
|--------|-------------|
| `audit(root?)` | Run full accessibility audit |
| `autoFixAll()` | Auto-fix all fixable issues |
| `fixIssue(issue)` | Fix a specific issue |

### Hooks

| Function | Description |
|----------|-------------|
| `initA11yAI(config)` | Initialize global instance |
| `getA11yAI()` | Get global instance |
| `useA11yAudit(root?)` | Run audit with hook pattern |
| `useAutoAltText(url, context?)` | Generate alt text for image |

### Utility Functions

| Function | Description |
|----------|-------------|
| `getContrastRatio(color1, color2)` | Calculate WCAG contrast ratio |
| `adjustColorForContrast(fg, bg, target)` | Adjust color for target ratio |

### Configuration

```typescript
interface A11yAIConfig {
  provider?: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  visionModel?: string;
  textModel?: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  autoFix?: boolean;
  languages?: string[];
}
```

### Issue Types

| Type | WCAG | Severity |
|------|------|----------|
| `missing-alt` | 1.1.1 | Critical |
| `empty-alt` | 1.1.1 | Moderate |
| `low-contrast` | 1.4.3 | Serious |
| `missing-label` | 1.3.1, 4.1.2 | Critical |
| `empty-button` | 4.1.2 | Critical |
| `empty-link` | 2.4.4 | Critical |
| `missing-lang` | 3.1.1 | Serious |
| `skip-heading-level` | 1.3.1 | Moderate |
| `missing-focus-indicator` | 2.4.7 | Serious |
| `auto-playing-media` | 1.4.2 | Serious |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-a11y-ai/src/index.ts

### Public API
- Direct exports: A11yAI, A11yAIConfig, A11yFix, A11yIssue, A11yIssueType, A11yReport, A11ySummary, AltTextGenerator, AriaLabelGenerator, ColorContrastFix, GeneratedAltText, adjustColorForContrast, getA11yAI, getContrastRatio, initA11yAI, useA11yAudit, useAutoAltText
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
