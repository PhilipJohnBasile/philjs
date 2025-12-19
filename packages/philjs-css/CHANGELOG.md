# Changelog

All notable changes to PhilJS CSS will be documented in this file.

## [2.0.0] - 2024-01-XX

### Added

#### Core CSS System
- **`css()`** - Core function for creating type-safe CSS styles
- **`compose()`** - Compose multiple CSS results together
- **`cx()`** - Conditional class name helper
- **`globalStyle()`** - Define global CSS styles
- **`keyframes()`** - Create CSS animations with keyframes
- **`styleFactory()`** - Create style factories with default props
- **`createStyles()`** - Batch create multiple styles at once

#### Theme System
- **`createTheme()`** - Create type-safe themes with design tokens
- **`createThemeVariant()`** - Create theme variants (e.g., dark mode)
- **`generateThemeCSS()`** - Generate CSS variable declarations
- **`cssVar()`** - Reference CSS variables
- **`themeVar()`** - Type-safe theme variable references
- **`createBreakpoints()`** - Create responsive breakpoint utilities
- **`defaultTheme`** - Sensible default theme with comprehensive tokens

#### Variant System
- **`variants()`** - Create components with variants (Stitches/CVA-style)
- **`slotVariants()`** - Slot-based variants for complex components
- **`responsiveVariants()`** - Create responsive variants
- **`recipe()`** - Create variant recipes with TypeScript inference
- **`booleanVariant()`** - Helper for boolean variants
- **`dataVariants()`** - Create data attribute variants
- **`stateVariants()`** - Create state-based variants (hover, focus, etc.)
- Compound variants support
- Default variants support

#### Atomic Utilities
- **`createAtomicSystem()`** - Complete atomic CSS system
- **`createSpacingUtilities()`** - Generate spacing utilities (margin/padding)
- **`createColorUtilities()`** - Generate color utilities (text/bg/border)
- **`createTypographyUtilities()`** - Generate typography utilities
- **`createLayoutUtilities()`** - Generate layout utilities (flex/grid)
- **`generateAtomicClasses()`** - Custom atomic class generation
- Responsive atomic utilities support

#### Build-time Extraction
- **`extractCSS()`** - Extract all CSS from registry
- **`extractToFile()`** - Extract CSS and write to file
- **`extractCriticalCSS()`** - Extract only CSS used in HTML (SSR)
- **`analyzeCSSBundle()`** - Analyze CSS bundle statistics
- **`createVitePlugin()`** - Vite plugin for automatic extraction
- **`createRollupPlugin()`** - Rollup plugin for automatic extraction
- **`createWebpackPlugin()`** - Webpack plugin for automatic extraction
- CSS minification support
- Source map generation
- Gzip size estimation

#### TypeScript Support
- Full type safety for all CSS properties
- Type-safe theme token access
- Variant type inference
- Type-safe atomic utilities
- CSSType integration for comprehensive CSS property types
- Autocomplete support for all APIs

### Features

- **Zero Runtime Overhead** - All CSS extracted at build time
- **Full Type Safety** - TypeScript types for everything
- **Pseudo Selectors** - Full support for :hover, :focus, :active, etc.
- **Nested Selectors** - Support for combinators and nested rules
- **Media Queries** - Type-safe responsive breakpoints
- **Container Queries** - Support for @container
- **Supports Queries** - Support for @supports
- **CSS Variables** - Type-safe CSS custom properties
- **Animations** - Keyframe animations with type safety
- **Theming** - Complete theme system with variants
- **Atomic CSS** - Tailwind-like atomic utilities
- **SSR Support** - Critical CSS extraction
- **Build Tool Integration** - Vite, Rollup, and Webpack plugins
- **Bundle Analysis** - Analyze CSS output and performance

### Documentation

- Comprehensive README with examples
- API Reference documentation
- Quick Start Guide
- Example files:
  - Basic usage examples
  - Theme system examples
  - Variant system examples
  - Atomic utilities examples
  - Build-time extraction examples
  - PhilJS integration examples
- TypeScript type definitions
- JSDoc comments throughout codebase

### Development Tools

- Jest test configuration
- Rollup build configuration
- TypeScript configuration
- ESLint-ready structure
- .gitignore file

### Performance

- Zero runtime CSS-in-JS overhead
- Compile-time style extraction
- CSS minification
- Source map support
- Bundle size analysis
- Critical CSS for faster first paint
- Atomic class deduplication

### Developer Experience

- Full TypeScript autocomplete
- Comprehensive error messages
- Type-safe APIs throughout
- Familiar API (inspired by Stitches, CVA, Tailwind)
- Easy migration from other CSS-in-JS solutions
- Excellent IDE support

## Roadmap

### Future Enhancements

- [ ] CSS Modules support
- [ ] PostCSS integration
- [ ] Advanced CSS optimization (unused style removal)
- [ ] Runtime development mode with hot reloading
- [ ] Browser DevTools integration
- [ ] VS Code extension for enhanced autocomplete
- [ ] Additional build tool plugins (esbuild, etc.)
- [ ] Performance profiling tools
- [ ] Style composition analyzer
- [ ] Automatic critical CSS injection
- [ ] Progressive enhancement support
- [ ] CSS nesting polyfill
- [ ] Advanced theming (color modes, custom properties)

## License

MIT

## Credits

Inspired by:
- [Stitches](https://stitches.dev/) - Variant system design
- [CVA (Class Variance Authority)](https://cva.style/) - Variant API
- [Vanilla Extract](https://vanilla-extract.style/) - Zero-runtime approach
- [Tailwind CSS](https://tailwindcss.com/) - Atomic utilities
- [Styled Components](https://styled-components.com/) - CSS-in-JS patterns
- [Emotion](https://emotion.sh/) - CSS API design
