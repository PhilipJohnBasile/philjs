# Change Log

All notable changes to the PhilJS VS Code extension will be documented in this file.

## [1.0.0] - 2024-12-17

### Added
- Initial release of PhilJS VS Code extension
- IntelliSense support
  - Auto-completion for PhilJS APIs (signal, computed, effect, memo, etc.)
  - JSX component completions
  - Import suggestions
  - Parameter hints and signature help
- Hover documentation
  - Inline documentation for PhilJS functions
  - Type information
  - Links to official documentation
- Code diagnostics
  - Warning for signal access without .get()
  - Detection of signal.set() in render
  - Empty effect body warnings
  - Async effect cleanup suggestions
  - Unnecessary memo() detection
  - useContext usage validation
- Code actions and refactoring
  - Quick fix: Add .get() to signal access
  - Quick fix: Add effect cleanup
  - Quick fix: Add missing imports
  - Refactor: Extract to signal
  - Refactor: Wrap in memo()
  - Refactor: Convert to island component
- Code generators
  - Create Component command
  - Create Route command
  - Create Page command
  - Create Hook command
  - Create Store command
- Comprehensive snippets
  - Core primitives (signal, computed, effect)
  - Component templates
  - Route and loader templates
  - Island components
  - Form components
  - Error boundaries and suspense
  - API routes
  - SSR templates
  - WebSocket hooks
  - Test templates
- Go to Definition support
  - Navigate to component definitions
  - Navigate to signal declarations
  - Resolve imports
- Formatting provider
  - Format signal declarations
  - Format JSX expressions
- Status bar integration
  - Shows signal count in current file
  - Quick access to commands
- Keyboard shortcuts
  - Ctrl+Shift+C (Cmd+Shift+C): Create Component
  - Ctrl+Shift+R (Cmd+Shift+R): Create Route
- Context menu integration
  - PhilJS Refactor submenu
  - Quick refactoring actions

### Features
- Full TypeScript and JavaScript support
- Works with .tsx, .ts, .jsx, and .js files
- Configurable settings
- Language configuration for bracket matching and auto-closing
- VS Code debugging configuration
- Marketplace-ready package

## [Unreleased]

### Planned
- Signal dependency graph visualization
- Performance profiling integration
- Advanced code refactorings
- Template generation from existing code
- Migration helpers for other frameworks
- Integration with PhilJS DevTools
- Code snippets library browser
- Component preview in hover
