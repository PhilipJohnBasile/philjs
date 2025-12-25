# Contributing to philjs-macros

Thank you for your interest in contributing to philjs-macros! This guide will help you get started.

## Development Setup

1. Install Rust (1.70 or later):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/philjs/philjs.git
   cd philjs/packages/philjs-macros
   ```

3. Build the project:
   ```bash
   cargo build
   ```

4. Run tests:
   ```bash
   cargo test
   ```

## Project Structure

```
philjs-macros/
├── src/
│   ├── lib.rs           # Main exports and documentation
│   ├── component.rs     # #[component] macro implementation
│   ├── signal.rs        # #[signal] macro implementation
│   ├── props.rs         # #[derive(Props)] macro implementation
│   ├── view.rs          # view! macro implementation
│   ├── server.rs        # #[server] macro implementation
│   └── utils.rs         # Shared utilities
├── tests/               # Integration tests
├── examples/            # Usage examples
└── Cargo.toml           # Package manifest
```

## Adding a New Macro

1. Create a new file in `src/` (e.g., `src/my_macro.rs`)

2. Implement the macro using `syn`, `quote`, and `proc-macro2`:
   ```rust
   use proc_macro::TokenStream;
   use quote::quote;
   use syn::parse_macro_input;

   pub fn my_macro_impl(input: TokenStream) -> TokenStream {
       let input = parse_macro_input!(input as syn::ItemStruct);
       // ... implementation
       TokenStream::from(output)
   }
   ```

3. Export the macro in `src/lib.rs`:
   ```rust
   mod my_macro;

   #[proc_macro_attribute]
   pub fn my_macro(args: TokenStream, input: TokenStream) -> TokenStream {
       my_macro::my_macro_impl(args, input)
   }
   ```

4. Add tests in `tests/my_macro_tests.rs`

5. Add examples in `examples/`

6. Update documentation in `README.md`

## Testing Guidelines

### Unit Tests

Place unit tests in the same file as the implementation:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_something() {
        // ...
    }
}
```

### Integration Tests

Create files in `tests/` directory:

```rust
use philjs_macros::my_macro;

#[test]
fn test_my_macro() {
    #[my_macro]
    struct MyStruct {
        field: i32,
    }

    // Test the generated code
}
```

### Compile Tests

For testing error messages, use `trybuild`:

```rust
#[test]
fn test_compile_errors() {
    let t = trybuild::TestCases::new();
    t.compile_fail("tests/ui/invalid_*.rs");
}
```

## Code Style

- Follow standard Rust formatting (use `cargo fmt`)
- Run `cargo clippy` and fix all warnings
- Add documentation comments for all public items
- Keep functions focused and under 50 lines when possible

## Documentation

- Add doc comments to all public items
- Include examples in doc comments
- Update README.md for user-facing changes
- Add inline comments for complex logic

Example:

```rust
/// Creates a reactive signal from struct fields.
///
/// This macro generates getter, setter, and update methods for each field.
///
/// # Example
///
/// ```rust
/// #[signal]
/// struct Counter {
///     count: i32,
/// }
///
/// let counter = Counter::new(0);
/// counter.set_count(5);
/// ```
#[proc_macro_attribute]
pub fn signal(args: TokenStream, input: TokenStream) -> TokenStream {
    // ...
}
```

## Error Handling

Provide helpful error messages:

```rust
if some_condition {
    return TokenStream::from(
        quote! {
            compile_error!("Helpful error message explaining what went wrong");
        }
    );
}
```

Use `syn::Error` for precise error locations:

```rust
return Err(syn::Error::new(
    ident.span(),
    "Expected a struct with named fields",
));
```

## Performance Considerations

- Minimize allocations in hot paths
- Reuse AST nodes when possible
- Generate efficient code (avoid unnecessary clones)
- Benchmark macro expansion time for complex inputs

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Run tests: `cargo test`
5. Run formatting: `cargo fmt`
6. Run linter: `cargo clippy`
7. Commit with clear message: `git commit -m "Add my feature"`
8. Push to your fork: `git push origin my-feature`
9. Create a Pull Request

## Pull Request Guidelines

- Reference any related issues
- Include tests for new functionality
- Update documentation
- Ensure all tests pass
- Keep PRs focused on a single change

## Code Review Process

1. Automated checks must pass (tests, formatting, clippy)
2. At least one maintainer review required
3. Address all review comments
4. Squash commits if requested
5. Maintainer will merge when approved

## Release Process

1. Update version in `Cargo.toml`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v0.2.0`
4. Push tag: `git push origin v0.2.0`
5. Publish to crates.io: `cargo publish`

## Getting Help

- Open an issue for bugs or feature requests
- Join our Discord server for discussions
- Check existing issues before creating new ones
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
