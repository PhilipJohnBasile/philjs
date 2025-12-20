# Changelog

All notable changes to PhilJS Storybook will be documented in this file.

## [2.0.0] - 2025-12-19

### Added

#### Core Features
- PhilJS renderer for Storybook integration
- Custom preset configuration for seamless PhilJS setup
- Story helper utilities (`createStory`, `createArgs`, `createArgTypes`)
- Full TypeScript support with comprehensive type definitions

#### Decorators
- `withRouter` - Mock router context for route components
- `withSignals` - Signal state management for stories
- `withTheme` - Theme switching support (light/dark/custom)
- `withLayout` - Layout control (centered/fullscreen/padded/none)
- `withMockData` - Mock data injection with MSW support

#### Addons
- **Signal Inspector** - Real-time signal debugging and manipulation
  - View all registered signals and their values
  - Edit signal values on the fly
  - Track signal dependencies
- **Route Tester** - Route component testing
  - Configure path, params, and search params
  - Mock loader and action data
  - View navigation history
- **Theme Switcher** - Theme management
  - Built-in light/dark themes
  - Custom theme creation
  - CSS variable editing
  - Toolbar integration
- **Viewport Helper** - Responsive design testing
  - Preset device viewports (iPhone, iPad, Desktop, etc.)
  - Custom viewport creation
  - Rotation support
  - Toolbar integration

#### Mocking Utilities
- `createMockSignal` - Mock signals with call tracking
- `createMockComputed` - Mock computed signals
- `spyOnSignal` - Signal access spy
- `createMockRouter` - Mock router with navigation tracking
- `createMockParams` - Mock route parameters
- `createMockSearchParams` - Mock search parameters
- `createMockAPI` - MSW API mocking
- `createMockError` - Mock error responses
- `createMockDelayedAPI` - Mock delayed responses
- `createMockPaginatedAPI` - Mock paginated endpoints
- `createMockLoader` - Mock route loaders
- `createMockAction` - Mock route actions
- `createMockLoaderWithData` - Quick loader with data
- `createMockLoaderWithError` - Quick loader with error

#### CLI Integration
- `philjs storybook init` - Initialize Storybook configuration
- `philjs storybook dev` - Start development server
- `philjs storybook build` - Build for production
- `philjs storybook generate` - Generate stories from components
  - Component stories
  - Route stories
  - Form stories
  - Island stories

#### Examples
- Button component story (basic components)
- UserProfile route story (route components with loaders)
- ContactForm story (forms with validation and interactions)
- Counter island story (interactive islands with signals)

#### Documentation
- Comprehensive README with installation and usage
- Detailed USAGE guide with examples
- Example stories demonstrating all features
- API documentation for all utilities
- Best practices and patterns
- Troubleshooting guide

### Technical Details

#### Dependencies
- Storybook 8.4.7 integration
- MSW 2.6.8 for API mocking
- Full Vite support
- TypeScript 5.9+ support

#### Testing
- Vitest test suite
- Component interaction testing with @storybook/test
- Signal mocking tests
- Router mocking tests
- 100% TypeScript coverage

#### Performance
- Tree-shakeable exports
- Minimal bundle size
- Lazy-loaded addons
- Optimized for development

### Breaking Changes
- None (initial release)

### Migration Guide
- None (initial release)

## Future Roadmap

### Planned for 2.1.0
- Accessibility testing addon
- Visual regression testing integration
- Component composition helpers
- Performance monitoring addon
- Story generation from TypeScript types

### Planned for 2.2.0
- Figma design integration
- Component documentation generator
- Interactive playground mode
- Collaboration features
- Story templates marketplace

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to contribute to PhilJS Storybook.

## License

MIT © PhilJS Team
