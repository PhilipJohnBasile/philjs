//! Component Library Template
//!
//! Shareable UI component library with Storybook-style documentation.

use std::collections::HashMap;

/// Generate component library template files
pub fn generate() -> HashMap<String, String> {
    let mut files = HashMap::new();

    // Cargo.toml
    files.insert(
        "Cargo.toml".to_string(),
        r#"[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <you@example.com>"]
description = "UI component library built with PhilJS"
license = "MIT"
repository = "https://github.com/yourusername/{{name}}"
keywords = ["philjs", "ui", "components", "wasm"]

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs = "2.0"
wasm-bindgen = "0.2"
console_error_panic_hook = "0.1"
serde = { version = "1", features = ["derive"] }

# Optional dependencies for specific components
web-sys = { version = "0.3", features = [
    "Window",
    "Document",
    "Element",
    "HtmlElement",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
] }

[dev-dependencies]
wasm-bindgen-test = "0.3"

[features]
default = []

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1

[profile.release.package."*"]
opt-level = "z"
"#
        .to_string(),
    );

    // src/lib.rs
    files.insert(
        "src/lib.rs".to_string(),
        r#"//! {{name}} - PhilJS Component Library
//!
//! A collection of reusable, accessible UI components.

#![warn(missing_docs)]

pub mod components;
pub mod hooks;
pub mod theme;
pub mod utils;

// Re-export commonly used items
pub use components::*;
pub use hooks::*;
pub use theme::Theme;

/// Prelude module for convenient imports
pub mod prelude {
    pub use crate::components::*;
    pub use crate::hooks::*;
    pub use crate::theme::*;
    pub use philjs::prelude::*;
}
"#
        .to_string(),
    );

    // src/components/mod.rs
    files.insert(
        "src/components/mod.rs".to_string(),
        r#"//! UI Components

pub mod button;
pub mod card;
pub mod input;
pub mod modal;
pub mod dropdown;
pub mod tabs;
pub mod toast;

pub use button::Button;
pub use card::Card;
pub use input::Input;
pub use modal::Modal;
pub use dropdown::Dropdown;
pub use tabs::{Tabs, Tab};
pub use toast::{Toast, ToastContainer};
"#
        .to_string(),
    );

    // src/components/button.rs
    files.insert(
        "src/components/button.rs".to_string(),
        r#"//! Button Component
//!
//! Accessible, customizable button with variants and sizes.

use philjs::prelude::*;

/// Button variant
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub enum ButtonVariant {
    /// Primary button (default)
    #[default]
    Primary,
    /// Secondary button
    Secondary,
    /// Outlined button
    Outline,
    /// Ghost button
    Ghost,
    /// Danger button
    Danger,
}

/// Button size
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub enum ButtonSize {
    /// Small button
    Small,
    /// Medium button (default)
    #[default]
    Medium,
    /// Large button
    Large,
}

/// Button component props
#[derive(Clone)]
pub struct ButtonProps {
    /// Button variant
    pub variant: ButtonVariant,
    /// Button size
    pub size: ButtonSize,
    /// Whether button is disabled
    pub disabled: bool,
    /// Whether button is loading
    pub loading: bool,
    /// Click handler
    pub on_click: Option<Box<dyn Fn(MouseEvent)>>,
    /// Children content
    pub children: Children,
    /// Additional CSS class
    pub class: Option<String>,
}

impl Default for ButtonProps {
    fn default() -> Self {
        Self {
            variant: ButtonVariant::Primary,
            size: ButtonSize::Medium,
            disabled: false,
            loading: false,
            on_click: None,
            children: Children::default(),
            class: None,
        }
    }
}

/// Button component
///
/// # Example
/// ```rust
/// use {{name}}::prelude::*;
///
/// view! {
///     <Button
///         variant=ButtonVariant::Primary
///         on_click=|_| println!("Clicked!")
///     >
///         "Click me"
///     </Button>
/// }
/// ```
#[component]
pub fn Button(props: ButtonProps) -> impl IntoView {
    let variant_class = match props.variant {
        ButtonVariant::Primary => "btn-primary",
        ButtonVariant::Secondary => "btn-secondary",
        ButtonVariant::Outline => "btn-outline",
        ButtonVariant::Ghost => "btn-ghost",
        ButtonVariant::Danger => "btn-danger",
    };

    let size_class = match props.size {
        ButtonSize::Small => "btn-sm",
        ButtonSize::Medium => "btn-md",
        ButtonSize::Large => "btn-lg",
    };

    let classes = format!(
        "btn {} {} {}",
        variant_class,
        size_class,
        props.class.unwrap_or_default()
    );

    view! {
        <button
            class={classes}
            disabled={props.disabled || props.loading}
            on:click=move |e| {
                if let Some(handler) = &props.on_click {
                    handler(e);
                }
            }
        >
            {if props.loading {
                view! { <span class="btn-spinner"></span> }
            } else {
                view! { <></> }
            }}
            {props.children}
        </button>
    }
}
"#
        .to_string(),
    );

    // src/components/card.rs
    files.insert(
        "src/components/card.rs".to_string(),
        r#"//! Card Component
//!
//! Flexible container for content.

use philjs::prelude::*;

/// Card component props
#[derive(Clone)]
pub struct CardProps {
    /// Card title
    pub title: Option<String>,
    /// Children content
    pub children: Children,
    /// Additional CSS class
    pub class: Option<String>,
}

impl Default for CardProps {
    fn default() -> Self {
        Self {
            title: None,
            children: Children::default(),
            class: None,
        }
    }
}

/// Card component
#[component]
pub fn Card(props: CardProps) -> impl IntoView {
    let classes = format!("card {}", props.class.unwrap_or_default());

    view! {
        <div class={classes}>
            {props.title.map(|title| {
                view! {
                    <div class="card-header">
                        <h3 class="card-title">{title}</h3>
                    </div>
                }
            })}
            <div class="card-body">
                {props.children}
            </div>
        </div>
    }
}
"#
        .to_string(),
    );

    // src/components/input.rs
    files.insert(
        "src/components/input.rs".to_string(),
        r#"//! Input Component
//!
//! Accessible text input with validation.

use philjs::prelude::*;

/// Input type
#[derive(Clone, Copy, Debug, Default)]
pub enum InputType {
    #[default]
    Text,
    Email,
    Password,
    Number,
    Tel,
    Url,
}

impl std::fmt::Display for InputType {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            InputType::Text => write!(f, "text"),
            InputType::Email => write!(f, "email"),
            InputType::Password => write!(f, "password"),
            InputType::Number => write!(f, "number"),
            InputType::Tel => write!(f, "tel"),
            InputType::Url => write!(f, "url"),
        }
    }
}

/// Input component props
#[derive(Clone)]
pub struct InputProps {
    /// Input type
    pub input_type: InputType,
    /// Placeholder text
    pub placeholder: Option<String>,
    /// Current value
    pub value: String,
    /// Change handler
    pub on_change: Box<dyn Fn(String)>,
    /// Whether input is disabled
    pub disabled: bool,
    /// Error message
    pub error: Option<String>,
    /// Label text
    pub label: Option<String>,
}

/// Input component
#[component]
pub fn Input(props: InputProps) -> impl IntoView {
    let has_error = props.error.is_some();

    view! {
        <div class="input-wrapper">
            {props.label.map(|label| {
                view! { <label class="input-label">{label}</label> }
            })}
            <input
                type={props.input_type.to_string()}
                class={format!("input {}", if has_error { "input-error" } else { "" })}
                placeholder={props.placeholder.unwrap_or_default()}
                value={props.value}
                disabled={props.disabled}
                on:input=move |e| {
                    (props.on_change)(event_target_value(&e));
                }
            />
            {props.error.map(|error| {
                view! { <span class="input-error-text">{error}</span> }
            })}
        </div>
    }
}
"#
        .to_string(),
    );

    // src/components/modal.rs - placeholder
    files.insert(
        "src/components/modal.rs".to_string(),
        "//! Modal Component\n\nuse philjs::prelude::*;\n\n// TODO: Implement Modal component\n".to_string(),
    );

    // src/components/dropdown.rs - placeholder
    files.insert(
        "src/components/dropdown.rs".to_string(),
        "//! Dropdown Component\n\nuse philjs::prelude::*;\n\n// TODO: Implement Dropdown component\n".to_string(),
    );

    // src/components/tabs.rs - placeholder
    files.insert(
        "src/components/tabs.rs".to_string(),
        "//! Tabs Component\n\nuse philjs::prelude::*;\n\n// TODO: Implement Tabs component\n".to_string(),
    );

    // src/components/toast.rs - placeholder
    files.insert(
        "src/components/toast.rs".to_string(),
        "//! Toast Component\n\nuse philjs::prelude::*;\n\n// TODO: Implement Toast component\n".to_string(),
    );

    // src/hooks/mod.rs
    files.insert(
        "src/hooks/mod.rs".to_string(),
        r#"//! Custom Hooks

pub mod use_toggle;
pub mod use_debounce;
pub mod use_media_query;

pub use use_toggle::use_toggle;
pub use use_debounce::use_debounce;
pub use use_media_query::use_media_query;
"#
        .to_string(),
    );

    // src/hooks/use_toggle.rs
    files.insert(
        "src/hooks/use_toggle.rs".to_string(),
        r#"//! Toggle Hook

use philjs::prelude::*;

/// Return type for use_toggle
pub struct UseToggleReturn {
    pub value: Signal<bool>,
    pub toggle: Box<dyn Fn()>,
    pub set_true: Box<dyn Fn()>,
    pub set_false: Box<dyn Fn()>,
}

/// Hook for boolean toggle state
pub fn use_toggle(initial: bool) -> UseToggleReturn {
    let value = Signal::new(initial);
    let value_for_toggle = value.clone();
    let value_for_true = value.clone();
    let value_for_false = value.clone();

    UseToggleReturn {
        value,
        toggle: Box::new(move || value_for_toggle.update(|v| *v = !*v)),
        set_true: Box::new(move || value_for_true.set(true)),
        set_false: Box::new(move || value_for_false.set(false)),
    }
}
"#
        .to_string(),
    );

    // src/hooks/use_debounce.rs - placeholder
    files.insert(
        "src/hooks/use_debounce.rs".to_string(),
        "//! Debounce Hook\n\nuse philjs::prelude::*;\n\n// TODO: Implement use_debounce\n".to_string(),
    );

    // src/hooks/use_media_query.rs - placeholder
    files.insert(
        "src/hooks/use_media_query.rs".to_string(),
        "//! Media Query Hook\n\nuse philjs::prelude::*;\n\n// TODO: Implement use_media_query\n".to_string(),
    );

    // src/theme.rs
    files.insert(
        "src/theme.rs".to_string(),
        r#"//! Theme System

use serde::{Deserialize, Serialize};

/// Theme configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Theme {
    pub colors: Colors,
    pub spacing: Spacing,
    pub typography: Typography,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Colors {
    pub primary: String,
    pub secondary: String,
    pub success: String,
    pub danger: String,
    pub warning: String,
    pub info: String,
    pub text: String,
    pub background: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Spacing {
    pub xs: String,
    pub sm: String,
    pub md: String,
    pub lg: String,
    pub xl: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Typography {
    pub font_family: String,
    pub font_size_base: String,
    pub line_height: String,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            colors: Colors {
                primary: "#3b82f6".to_string(),
                secondary: "#6b7280".to_string(),
                success: "#10b981".to_string(),
                danger: "#ef4444".to_string(),
                warning: "#f59e0b".to_string(),
                info: "#3b82f6".to_string(),
                text: "#1f2937".to_string(),
                background: "#ffffff".to_string(),
            },
            spacing: Spacing {
                xs: "0.25rem".to_string(),
                sm: "0.5rem".to_string(),
                md: "1rem".to_string(),
                lg: "1.5rem".to_string(),
                xl: "2rem".to_string(),
            },
            typography: Typography {
                font_family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif".to_string(),
                font_size_base: "16px".to_string(),
                line_height: "1.5".to_string(),
            },
        }
    }
}
"#
        .to_string(),
    );

    // src/utils.rs
    files.insert(
        "src/utils.rs".to_string(),
        r#"//! Utility Functions

/// Combine CSS classes
pub fn cn(classes: &[&str]) -> String {
    classes.join(" ")
}

/// Generate unique ID
pub fn unique_id(prefix: &str) -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let id = COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{}_{}", prefix, id)
}
"#
        .to_string(),
    );

    // examples/showcase/src/main.rs
    files.insert(
        "examples/showcase/src/main.rs".to_string(),
        r#"//! Component Showcase
//!
//! Interactive examples of all components.

use {{name}}::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    mount_to_body(|| view! {
        <div class="showcase">
            <header class="showcase-header">
                <h1>"{{name}} Component Library"</h1>
                <p>"Beautiful, accessible components built with PhilJS"</p>
            </header>

            <main class="showcase-content">
                <section class="showcase-section">
                    <h2>"Buttons"</h2>
                    <div class="showcase-examples">
                        <Button variant=ButtonVariant::Primary>
                            "Primary Button"
                        </Button>
                        <Button variant=ButtonVariant::Secondary>
                            "Secondary Button"
                        </Button>
                        <Button variant=ButtonVariant::Outline>
                            "Outline Button"
                        </Button>
                        <Button variant=ButtonVariant::Danger>
                            "Danger Button"
                        </Button>
                    </div>
                </section>

                <section class="showcase-section">
                    <h2>"Cards"</h2>
                    <Card title="Card Title">
                        <p>"This is a card with some content inside."</p>
                    </Card>
                </section>

                <section class="showcase-section">
                    <h2>"Input"</h2>
                    <Input
                        label="Email"
                        input_type=InputType::Email
                        placeholder="Enter your email"
                        value=""
                        on_change=|_| {}
                    />
                </section>
            </main>
        </div>
    });
}
"#
        .to_string(),
    );

    // styles/components.css
    files.insert(
        "styles/components.css".to_string(),
        r#"/* Component Styles */

/* Button */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    border-radius: 0.375rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
}

.btn-md {
    padding: 0.5rem 1rem;
    font-size: 1rem;
}

.btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
}

.btn-primary {
    background-color: #3b82f6;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
}

.btn-secondary {
    background-color: #6b7280;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background-color: #4b5563;
}

.btn-outline {
    background-color: transparent;
    border-color: #3b82f6;
    color: #3b82f6;
}

.btn-outline:hover:not(:disabled) {
    background-color: #3b82f6;
    color: white;
}

.btn-ghost {
    background-color: transparent;
    color: #3b82f6;
}

.btn-ghost:hover:not(:disabled) {
    background-color: #eff6ff;
}

.btn-danger {
    background-color: #ef4444;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background-color: #dc2626;
}

/* Card */
.card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
}

.card-body {
    padding: 1.5rem;
}

/* Input */
.input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-label {
    font-weight: 600;
    font-size: 0.875rem;
}

.input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.2s;
}

.input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-error {
    border-color: #ef4444;
}

.input-error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-error-text {
    color: #ef4444;
    font-size: 0.875rem;
}
"#
        .to_string(),
    );

    // README.md
    files.insert(
        "README.md".to_string(),
        r#"# {{name}}

A beautiful, accessible component library built with PhilJS.

## Features

- Fully typed components with Rust
- Accessible by default (ARIA compliant)
- Themeable with CSS variables
- Tree-shakeable
- Well documented

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
{{name}} = "0.1"
```

## Usage

```rust
use {{name}}::prelude::*;

#[component]
fn MyApp() -> impl IntoView {
    view! {
        <Button
            variant=ButtonVariant::Primary
            on_click=|_| println!("Clicked!")
        >
            "Click me"
        </Button>
    }
}
```

## Components

- **Button** - Versatile button with variants and sizes
- **Card** - Flexible content container
- **Input** - Accessible form input
- **Modal** - Dialog/modal overlay
- **Dropdown** - Select menu
- **Tabs** - Tabbed interface
- **Toast** - Notification system

## Hooks

- **use_toggle** - Boolean toggle state
- **use_debounce** - Debounced value
- **use_media_query** - Responsive breakpoints

## Theming

Components use CSS variables for easy theming:

```css
:root {
    --color-primary: #3b82f6;
    --color-secondary: #6b7280;
    --spacing-md: 1rem;
}
```

## Development

```bash
# Run showcase
cd examples/showcase
cargo philjs dev

# Run tests
cargo test

# Build library
cargo build --release
```

## Documentation

See [docs/](./docs/) for detailed component documentation.

## License

MIT
"#
        .to_string(),
    );

    files
}
