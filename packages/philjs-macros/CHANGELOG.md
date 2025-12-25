# Changelog

All notable changes to philjs-macros will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-12-23

### Added

#### Component Macro
- `#[component]` attribute macro for transforming functions into components
- Automatic props struct generation
- Display name generation with PascalCase conversion
- Support for transparent components with `#[component(transparent)]`
- Generic component support
- Async component support

#### Signal Macro
- `#[signal]` attribute macro for reactive state management
- Automatic getter/setter/updater method generation
- Support for complex types (Vec, Option, custom structs)
- Generic signal support
- Clone-based signal sharing

#### Props Macro
- `#[derive(Props)]` macro for component props
- Builder pattern generation
- Support for optional props with `#[prop(optional)]`
- Default values with `#[prop(default = "...")]`
- Type conversion with `#[prop(into)]`
- Compile-time validation for required props

#### View Macro
- `view!` macro for JSX-like syntax in Rust
- Support for elements, text nodes, and expressions
- Self-closing tags
- Namespaced attributes (e.g., `on:click`)
- Fragment support for multiple root elements
- Expression interpolation with `{}`
- Conditional rendering
- List rendering with iterators

#### Server Macro
- `#[server]` attribute macro for server functions
- Automatic RPC generation for client-side calls
- Custom endpoint configuration with `#[server(endpoint = "...")]`
- Custom prefix configuration with `#[server(prefix = "...")]`
- Automatic serialization/deserialization
- Feature flag support (`ssr` feature)

### Infrastructure
- Complete test suite with 100+ tests
- Integration tests for all macros
- Example code demonstrating common patterns
- Comprehensive documentation
- CI/CD ready configuration

### Dependencies
- syn 2.0 for parsing
- quote 1.0 for code generation
- proc-macro2 1.0 for procedural macro utilities
- darling 0.20 for attribute parsing

## [0.0.0] - Initial Development

### Notes
- Initial architecture and design
- Prototype implementations
- API design based on Leptos and Dioxus patterns
