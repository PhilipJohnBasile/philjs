
# Automated Accessibility (`@philjs/a11y`)

WCAG compliance on autopilot.

## AutoFix
The `fixAccessibility` function scans your DOM for violations (missing alt text, bad contrast) and automatically generates/injects the necessary attributes.

```typescript
import { fixAccessibility } from '@philjs/a11y';
await fixAccessibility();
```
