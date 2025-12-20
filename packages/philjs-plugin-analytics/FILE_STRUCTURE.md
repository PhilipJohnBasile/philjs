# PhilJS Analytics Plugin - File Structure

## Overview

This document describes the complete file structure of the philjs-plugin-analytics package.

## Directory Structure

```
philjs-plugin-analytics/
├── src/                          # Source code
│   ├── index.ts                  # Main plugin entry point
│   ├── client.ts                 # Client-side runtime
│   ├── types.ts                  # TypeScript type definitions
│   ├── utils.ts                  # Utility functions
│   ├── test-setup.ts             # Test configuration
│   ├── analytics.test.ts         # Plugin tests
│   ├── client.test.ts            # Client runtime tests
│   └── providers/                # Analytics provider implementations
│       ├── index.ts              # Provider factory
│       ├── ga4.ts                # Google Analytics 4
│       ├── ga4.test.ts           # GA4 tests
│       ├── plausible.ts          # Plausible Analytics
│       └── mixpanel.ts           # Mixpanel Analytics
├── examples/                     # Usage examples
│   ├── README.md                 # Examples documentation
│   ├── basic-ga4.ts              # GA4 basic setup
│   ├── basic-plausible.ts        # Plausible basic setup
│   ├── basic-mixpanel.ts         # Mixpanel basic setup
│   ├── custom-events.ts          # Custom event tracking
│   ├── ecommerce-tracking.ts    # E-commerce tracking
│   └── auto-tracking.ts          # Auto-tracking examples
├── README.md                     # Main documentation
├── QUICK_START.md                # Quick start guide
├── IMPLEMENTATION.md             # Implementation details
├── package.json                  # Package configuration
├── tsconfig.json                 # TypeScript configuration
└── vitest.config.ts              # Test configuration
```

## File Descriptions

### Core Files

#### `src/index.ts` (423 lines)
Main plugin implementation:
- Plugin factory function
- Plugin lifecycle hooks
- Configuration schema
- Script generation
- HTML injection
- Analytics utilities

#### `src/client.ts` (358 lines)
Browser runtime:
- Analytics client singleton
- Event tracking
- Auto-tracking setup
- Session management
- Event queue handling
- Privacy controls

#### `src/types.ts` (157 lines)
Type definitions:
- `AnalyticsProvider` - Provider types
- `AnalyticsPluginConfig` - Plugin configuration
- `AnalyticsEvent` - Event structure
- `EcommerceTransaction` - E-commerce types
- `IAnalyticsProvider` - Provider interface
- `PrivacyOptions` - Privacy settings
- `CustomEventOptions` - Auto-tracking options

#### `src/utils.ts` (298 lines)
Utility functions:
- Browser detection
- DNT checking
- Session ID generation
- Cookie management
- LocalStorage helpers
- URL parsing
- UTM parameter extraction
- Debounce/throttle helpers

### Provider Implementations

#### `src/providers/ga4.ts` (169 lines)
Google Analytics 4 implementation:
- Script loading
- Event tracking
- Page view tracking
- User identification
- E-commerce tracking
- IP anonymization

#### `src/providers/plausible.ts` (114 lines)
Plausible Analytics implementation:
- Privacy-focused tracking
- Lightweight script loading
- Custom event tracking
- Hash mode support

#### `src/providers/mixpanel.ts` (246 lines)
Mixpanel implementation:
- User identification
- People properties
- Event tracking
- Revenue tracking
- Cohort analysis support

#### `src/providers/index.ts` (33 lines)
Provider factory:
- Provider instantiation
- Provider registry
- Available providers list

### Test Files

#### `src/analytics.test.ts` (134 lines)
Plugin tests:
- Plugin creation
- Configuration merging
- Privacy settings
- Auto-tracking setup

#### `src/client.test.ts` (154 lines)
Client runtime tests:
- Initialization
- Event tracking
- Event queue
- Context creation

#### `src/providers/ga4.test.ts` (161 lines)
GA4 provider tests:
- Initialization
- Event tracking
- User identification
- Transaction tracking

#### `src/test-setup.ts` (58 lines)
Test environment setup:
- Mock window object
- Mock document object
- Mock navigator
- Mock performance API

### Examples

#### `examples/basic-ga4.ts` (23 lines)
Basic Google Analytics 4 setup example

#### `examples/basic-plausible.ts` (24 lines)
Basic Plausible Analytics setup example

#### `examples/basic-mixpanel.ts` (28 lines)
Basic Mixpanel setup example

#### `examples/custom-events.ts` (66 lines)
Custom event tracking examples:
- Button clicks
- User signup
- Feature usage
- Error tracking

#### `examples/ecommerce-tracking.ts` (112 lines)
E-commerce tracking examples:
- Product views
- Add to cart
- Checkout
- Purchases
- Refunds

#### `examples/auto-tracking.ts` (76 lines)
Auto-tracking examples:
- Click tracking
- Form tracking
- Data attributes
- React components

### Documentation

#### `README.md` (378 lines)
Main documentation:
- Installation
- Basic usage
- Configuration
- Provider setup
- API reference
- Privacy controls
- Examples
- Troubleshooting

#### `QUICK_START.md` (226 lines)
Quick start guide:
- 5-minute setup
- Common use cases
- Provider-specific setup
- Auto-tracking
- Privacy controls
- Troubleshooting

#### `IMPLEMENTATION.md` (442 lines)
Implementation guide:
- Architecture overview
- Provider architecture
- Client runtime
- Privacy features
- Usage patterns
- Testing
- Extension points
- Best practices

#### `examples/README.md` (148 lines)
Examples documentation:
- Example overview
- Quick start
- Provider examples
- Feature examples

### Configuration Files

#### `package.json`
Package configuration:
- Dependencies: philjs-core
- Dev dependencies: TypeScript, Vitest, jsdom
- Scripts: build, test, typecheck
- Exports: main plugin and client runtime

#### `tsconfig.json`
TypeScript configuration:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Source maps
- Declarations

#### `vitest.config.ts`
Test configuration:
- jsdom environment
- Coverage reporting
- Test setup file

## Statistics

### Code Metrics

- **Total Files**: 25
- **Source Files**: 12 TypeScript files
- **Test Files**: 4 test files
- **Examples**: 6 example files
- **Documentation**: 4 Markdown files
- **Production Code**: ~1,800 lines
- **Test Code**: ~500 lines
- **Examples**: ~330 lines
- **Documentation**: ~1,200 lines

### Features Implemented

- ✅ Google Analytics 4 provider
- ✅ Plausible Analytics provider
- ✅ Mixpanel provider
- ✅ Client runtime
- ✅ Auto page view tracking
- ✅ Auto error tracking
- ✅ Auto click tracking
- ✅ Auto form tracking
- ✅ Performance tracking
- ✅ User identification
- ✅ E-commerce tracking
- ✅ Privacy controls (DNT, IP anonymization)
- ✅ Cookie management
- ✅ Session management
- ✅ Event queue
- ✅ Debug mode
- ✅ Development mode detection
- ✅ TypeScript types
- ✅ Comprehensive tests
- ✅ Usage examples
- ✅ Full documentation

## Package Exports

```json
{
  ".": "./dist/index.js",           // Main plugin
  "./client": "./dist/client.js"    // Client runtime
}
```

## Import Paths

```typescript
// Plugin configuration
import { createAnalyticsPlugin } from "philjs-plugin-analytics";

// Client runtime
import { trackEvent, identifyUser } from "philjs-plugin-analytics/client";

// Types
import type { AnalyticsPluginConfig } from "philjs-plugin-analytics";
```

## Build Output

After running `npm run build`, the following files are generated:

```
dist/
├── index.js
├── index.d.ts
├── client.js
├── client.d.ts
├── types.d.ts
├── utils.js
├── utils.d.ts
├── providers/
│   ├── index.js
│   ├── index.d.ts
│   ├── ga4.js
│   ├── ga4.d.ts
│   ├── plausible.js
│   ├── plausible.d.ts
│   ├── mixpanel.js
│   └── mixpanel.d.ts
└── .tsbuildinfo
```

## Dependencies

### Production Dependencies
- `philjs-core` - Core PhilJS framework (workspace dependency)

### Development Dependencies
- `typescript` - TypeScript compiler
- `vitest` - Test runner
- `jsdom` - DOM implementation for testing
- `rollup` - Module bundler
- `@types/node` - Node.js type definitions
- `@vitest/ui` - Vitest UI

## Related Files in PhilJS Monorepo

- `packages/philjs-core/src/plugin-system.ts` - Plugin system API
- `packages/philjs-core/src/index.ts` - Core exports
- Root `package.json` - Workspace configuration
- Root `tsconfig.json` - Base TypeScript config

## Version History

- **v2.0.0** - Complete implementation
  - GA4, Plausible, Mixpanel providers
  - Auto-tracking features
  - Privacy controls
  - Comprehensive tests
  - Full documentation
