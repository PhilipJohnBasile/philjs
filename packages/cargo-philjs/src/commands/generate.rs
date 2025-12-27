//! Code generation commands
//!
//! Provides scaffolding for components, pages, server functions, and more.

use anyhow::Result;
use colored::Colorize;
use std::fs;
use std::path::Path;

/// Generate a component
pub fn component(name: &str, dir: Option<&str>, include_tests: bool) -> Result<()> {
    let dir = dir.unwrap_or("src/components");
    let path = Path::new(dir);
    fs::create_dir_all(path)?;

    let snake_name = to_snake_case(name);
    let file_path = path.join(format!("{}.rs", snake_name));

    let tests_section = if include_tests {
        format!(
            r#"

#[cfg(test)]
mod tests {{
    use super::*;

    #[test]
    fn test_{snake_name}_renders() {{
        let html = render_to_string(|| view! {{
            <{name} />
        }});
        assert!(html.contains("{name}"));
    }}
}}"#,
            name = name,
            snake_name = snake_name
        )
    } else {
        String::new()
    };

    let content = format!(
        r#"//! {name} Component
//!
//! Add component description here

use philjs::prelude::*;

/// Props for the {name} component
#[derive(Clone, Default)]
pub struct {name}Props {{
    // Add props here
}}

/// {name} component
///
/// # Example
/// ```rust
/// view! {{
///     <{name} />
/// }}
/// ```
#[component]
pub fn {name}(props: {name}Props) -> impl IntoView {{
    view! {{
        <div class="{snake_name}">
            <h2>"{name}"</h2>
        </div>
    }}
}}{tests_section}
"#,
        name = name,
        snake_name = snake_name,
        tests_section = tests_section
    );

    fs::write(&file_path, content)?;

    // Update mod.rs if it exists
    update_mod_rs(path, &snake_name)?;

    println!(
        "{}  Created component: {}",
        "[done]".green().bold(),
        file_path.display().to_string().cyan()
    );

    println!("  Don't forget to add to your mod.rs:\n");
    println!("    pub mod {};", snake_name);
    println!();

    Ok(())
}

/// Generate a page/route
pub fn page(name: &str, include_loader: bool) -> Result<()> {
    let path = Path::new("src/pages");
    fs::create_dir_all(path)?;

    let snake_name = to_snake_case(name);
    let file_path = path.join(format!("{}.rs", snake_name));

    let loader_section = if include_loader {
        format!(
            r#"

/// Page data loader
///
/// This function runs on the server and provides data to the page.
pub async fn loader() -> Result<{name}Data, ServerError> {{
    // Fetch data for the page
    Ok({name}Data {{
        // data fields
    }})
}}

/// Data provided by the loader
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct {name}Data {{
    // Add data fields
}}"#,
            name = name
        )
    } else {
        String::new()
    };

    let content = format!(
        r#"//! {name} Page
//!
//! Route: /{route}

use philjs::prelude::*;

/// {name} page component
#[component]
pub fn {name}Page() -> impl IntoView {{
    view! {{
        <main class="page-{snake_name}">
            <h1>"{name}"</h1>
            <p>"Welcome to the {name} page"</p>
        </main>
    }}
}}

/// Page metadata for SEO
pub fn meta() -> Vec<(&'static str, &'static str)> {{
    vec![
        ("title", "{name} | PhilJS App"),
        ("description", "{name} page description"),
    ]
}}{loader_section}
"#,
        name = name,
        snake_name = snake_name,
        route = snake_name.replace('_', "-"),
        loader_section = loader_section
    );

    fs::write(&file_path, content)?;

    println!(
        "{}  Created page: {}",
        "[done]".green().bold(),
        file_path.display().to_string().cyan()
    );

    Ok(())
}

/// Generate a server function
pub fn server_fn(name: &str) -> Result<()> {
    let path = Path::new("src/server");
    fs::create_dir_all(path)?;

    let snake_name = to_snake_case(name);
    let file_path = path.join(format!("{}.rs", snake_name));

    let content = format!(
        r#"//! {name} Server Function
//!
//! Server function that runs on the server but can be called from the client.

use philjs::server::*;
use serde::{{Deserialize, Serialize}};

/// Request payload for {name}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct {name}Request {{
    // Add request fields
}}

/// Response payload for {name}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct {name}Response {{
    pub success: bool,
    pub message: String,
}

/// {name} server function
///
/// This function runs on the server and can be called from WASM client code.
/// All arguments must implement Serialize/Deserialize.
///
/// # Example
/// ```rust
/// // On the client (WASM)
/// let result = {snake_name}({name}Request {{ /* ... */ }}).await?;
/// ```
#[server({name})]
pub async fn {snake_name}(request: {name}Request) -> ServerResult<{name}Response> {{
    // Server-side logic here
    // This code ONLY runs on the server

    // Example: access database, call external APIs, etc.
    // let db_result = db.query(...).await?;

    Ok({name}Response {{
        success: true,
        message: "Success".into(),
    }})
}}

#[cfg(test)]
mod tests {{
    use super::*;

    #[tokio::test]
    async fn test_{snake_name}() {{
        let request = {name}Request {{}};
        let result = {snake_name}(request).await;
        assert!(result.is_ok());
    }}
}}
"#,
        name = name,
        snake_name = snake_name
    );

    fs::write(&file_path, content)?;

    println!(
        "{}  Created server function: {}",
        "[done]".green().bold(),
        file_path.display().to_string().cyan()
    );

    println!("\n  Usage in your component:\n");
    println!("    use crate::server::{}::*;", snake_name);
    println!();
    println!("    let result = {}({}Request {{ /* ... */ }}).await?;", snake_name, name);
    println!();

    Ok(())
}

/// Generate an API route
pub fn api(name: &str) -> Result<()> {
    let path = Path::new("src/api");
    fs::create_dir_all(path)?;

    let snake_name = to_snake_case(name);
    let file_path = path.join(format!("{}.rs", snake_name));

    let content = format!(
        r#"//! {name} API Route
//!
//! RESTful API endpoint for {name}.

use philjs::server::*;
use serde::{{Deserialize, Serialize}};

/// GET /{route} request query parameters
#[derive(Debug, Deserialize)]
pub struct Get{name}Query {{
    // Query parameters
}}

/// POST /{route} request body
#[derive(Debug, Deserialize)]
pub struct Create{name}Request {{
    // Request body fields
}}

/// {name} response
#[derive(Debug, Serialize)]
pub struct {name}Response {{
    pub success: bool,
    pub data: Option<{name}Data>,
    pub message: String,
}}

/// {name} data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct {name}Data {{
    pub id: String,
    // Add fields
}}

/// GET /{route}
///
/// Retrieves {name} data.
pub async fn get(query: Get{name}Query) -> ServerResult<{name}Response> {{
    Ok({name}Response {{
        success: true,
        data: None,
        message: "GET {name}".into(),
    }})
}}

/// POST /{route}
///
/// Creates a new {name}.
pub async fn post(body: Create{name}Request) -> ServerResult<{name}Response> {{
    Ok({name}Response {{
        success: true,
        data: None,
        message: "POST {name}".into(),
    }})
}}

/// PUT /{route}/{{id}}
///
/// Updates an existing {name}.
pub async fn put(id: String, body: Create{name}Request) -> ServerResult<{name}Response> {{
    Ok({name}Response {{
        success: true,
        data: None,
        message: format!("PUT {name} {{}}", id),
    }})
}}

/// DELETE /{route}/{{id}}
///
/// Deletes a {name}.
pub async fn delete(id: String) -> ServerResult<{name}Response> {{
    Ok({name}Response {{
        success: true,
        data: None,
        message: format!("DELETE {name} {{}}", id),
    }})
}}
"#,
        name = name,
        route = snake_name.replace('_', "-"),
    );

    fs::write(&file_path, content)?;

    println!(
        "{}  Created API route: {}",
        "[done]".green().bold(),
        file_path.display().to_string().cyan()
    );

    Ok(())
}

/// Generate a store/state module
pub fn store(name: &str) -> Result<()> {
    let path = Path::new("src/stores");
    fs::create_dir_all(path)?;

    let snake_name = to_snake_case(name);
    let file_path = path.join(format!("{}.rs", snake_name));

    let content = format!(
        r#"//! {name} Store
//!
//! Reactive state management for {name}.

use philjs::prelude::*;

/// {name} state structure
///
/// Uses the Store derive macro to automatically generate
/// a reactive store with signals for each field.
#[derive(Clone, Debug, Default, Store)]
pub struct {name}State {{
    /// Loading state
    pub loading: bool,

    /// Error message if any
    pub error: Option<String>,

    // Add your state fields here
}}

impl {name}State {{
    /// Create a new store instance
    pub fn new() -> {name}StateStore {{
        {name}StateStore::from(Self::default())
    }}

    /// Create with initial values
    pub fn with_values() -> {name}StateStore {{
        {name}StateStore::from(Self {{
            loading: false,
            error: None,
        }})
    }}
}}

// ============================================================================
// Actions
// ============================================================================

/// Reset the store to default state
pub fn reset(store: &{name}StateStore) {{
    store.loading.set(false);
    store.error.set(None);
}}

/// Set loading state
pub fn set_loading(store: &{name}StateStore, loading: bool) {{
    store.loading.set(loading);
}}

/// Set error
pub fn set_error(store: &{name}StateStore, error: impl Into<String>) {{
    store.error.set(Some(error.into()));
    store.loading.set(false);
}}

/// Clear error
pub fn clear_error(store: &{name}StateStore) {{
    store.error.set(None);
}}

// ============================================================================
// Selectors (Computed Values)
// ============================================================================

/// Check if there's an error
pub fn has_error(store: &{name}StateStore) -> bool {{
    store.error.get().is_some()
}}

#[cfg(test)]
mod tests {{
    use super::*;

    #[test]
    fn test_store_creation() {{
        let store = {name}State::new();
        assert!(!store.loading.get());
        assert!(store.error.get().is_none());
    }}

    #[test]
    fn test_actions() {{
        let store = {name}State::new();

        set_loading(&store, true);
        assert!(store.loading.get());

        set_error(&store, "test error");
        assert!(has_error(&store));

        reset(&store);
        assert!(!store.loading.get());
        assert!(!has_error(&store));
    }}
}}
"#,
        name = name
    );

    fs::write(&file_path, content)?;

    println!(
        "{}  Created store: {}",
        "[done]".green().bold(),
        file_path.display().to_string().cyan()
    );

    println!("\n  Usage:\n");
    println!("    use crate::stores::{}::*;", snake_name);
    println!();
    println!("    let store = {}State::new();", name);
    println!("    set_loading(&store, true);");
    println!();

    Ok(())
}

/// Generate a custom hook
pub fn hook(name: &str) -> Result<()> {
    let path = Path::new("src/hooks");
    fs::create_dir_all(path)?;

    let snake_name = to_snake_case(name);
    let file_path = path.join(format!("{}.rs", snake_name));

    let content = format!(
        r#"//! use_{snake_name} Hook
//!
//! Custom hook for {name} functionality.

use philjs::prelude::*;

/// Return type for the {name} hook
pub struct Use{name}Return<T> {{
    /// Current value
    pub value: Signal<T>,

    /// Set the value
    pub set_value: Box<dyn Fn(T)>,

    /// Reset to initial value
    pub reset: Box<dyn Fn()>,
}}

/// Custom hook for {name}
///
/// # Example
/// ```rust
/// let {{ value, set_value, reset }} = use_{snake_name}(initial_value);
///
/// // Read the value
/// let current = value.get();
///
/// // Update the value
/// set_value(new_value);
///
/// // Reset to initial
/// reset();
/// ```
pub fn use_{snake_name}<T>(initial: T) -> Use{name}Return<T>
where
    T: Clone + Default + 'static,
{{
    let value = Signal::new(initial.clone());
    let value_for_set = value.clone();
    let value_for_reset = value.clone();
    let initial_for_reset = initial.clone();

    let set_value = Box::new(move |v: T| {{
        value_for_set.set(v);
    }});

    let reset = Box::new(move || {{
        value_for_reset.set(initial_for_reset.clone());
    }});

    Use{name}Return {{
        value,
        set_value,
        reset,
    }}
}}

/// Variant with callback on change
pub fn use_{snake_name}_with_callback<T, F>(initial: T, on_change: F) -> Use{name}Return<T>
where
    T: Clone + Default + 'static,
    F: Fn(&T) + 'static,
{{
    let result = use_{snake_name}(initial);
    let value_for_effect = result.value.clone();

    // Create effect to call callback on change
    Effect::new(move || {{
        let current = value_for_effect.get();
        on_change(&current);
    }});

    result
}}

#[cfg(test)]
mod tests {{
    use super::*;

    #[test]
    fn test_use_{snake_name}() {{
        let result = use_{snake_name}(0i32);

        assert_eq!(result.value.get(), 0);

        (result.set_value)(42);
        assert_eq!(result.value.get(), 42);

        (result.reset)();
        assert_eq!(result.value.get(), 0);
    }}
}}
"#,
        name = name,
        snake_name = snake_name
    );

    fs::write(&file_path, content)?;

    println!(
        "{}  Created hook: {}",
        "[done]".green().bold(),
        file_path.display().to_string().cyan()
    );

    println!("\n  Usage:\n");
    println!("    use crate::hooks::{}::use_{};", snake_name, snake_name);
    println!();
    println!("    let {{ value, set_value, reset }} = use_{}(initial);", snake_name);
    println!();

    Ok(())
}

/// Update mod.rs to include new module
fn update_mod_rs(dir: &Path, module_name: &str) -> Result<()> {
    let mod_path = dir.join("mod.rs");

    if mod_path.exists() {
        let content = fs::read_to_string(&mod_path)?;
        let module_line = format!("pub mod {};", module_name);

        if !content.contains(&module_line) {
            let new_content = format!("{}\n{}", content.trim(), module_line);
            fs::write(mod_path, new_content)?;
        }
    }

    Ok(())
}

/// Generate a component with enhanced options
pub fn component_enhanced(
    name: &str,
    dir: Option<&str>,
    include_tests: bool,
    with_props: bool,
    with_styles: bool,
) -> Result<()> {
    let dir = dir.unwrap_or("src/components");
    let path = Path::new(dir);
    fs::create_dir_all(path)?;

    let snake_name = to_snake_case(name);
    let file_path = path.join(format!("{}.rs", snake_name));

    // Generate props section if requested
    let props_section = if with_props {
        format!(
            r#"
/// Props for the {name} component
#[derive(Clone, Default)]
pub struct {name}Props {{
    /// Add your props here
    pub children: Option<Children>,
}}
"#,
            name = name
        )
    } else {
        String::new()
    };

    // Generate component signature
    let component_sig = if with_props {
        format!("pub fn {name}(props: {name}Props) -> impl IntoView", name = name)
    } else {
        format!("pub fn {name}() -> impl IntoView", name = name)
    };

    // Generate CSS module import if requested
    let style_import = if with_styles {
        format!(
            r#"
// CSS module (create {snake_name}.css alongside this file)
const STYLES: &str = include_str!("{snake_name}.css");
"#,
            snake_name = snake_name
        )
    } else {
        String::new()
    };

    let tests_section = if include_tests {
        format!(
            r#"

#[cfg(test)]
mod tests {{
    use super::*;

    #[test]
    fn test_{snake_name}_renders() {{
        let html = render_to_string(|| view! {{
            <{name} {}/>
        }});
        assert!(html.contains("{name}"));
    }}
}}"#,
            name = name,
            snake_name = snake_name,
            if with_props { "..Default::default()" } else { "" }
        )
    } else {
        String::new()
    };

    let content = format!(
        r#"//! {name} Component
//!
//! Add component description here

use philjs::prelude::*;{style_import}{props_section}
/// {name} component
///
/// # Example
/// ```rust
/// view! {{
///     <{name} {}/>
/// }}
/// ```
#[component]
{component_sig} {{
    view! {{
        <div class="{snake_name}">
            <h2>"{name}"</h2>
            {{{children_render}}}
        </div>
    }}
}}{tests_section}
"#,
        name = name,
        snake_name = snake_name,
        style_import = style_import,
        props_section = props_section,
        component_sig = component_sig,
        children_render = if with_props { "{props.children}" } else { "" },
        if with_props { "..Default::default()" } else { "" },
        tests_section = tests_section
    );

    fs::write(&file_path, content)?;

    // Create CSS file if styled
    if with_styles {
        let css_path = path.join(format!("{}.css", snake_name));
        let css_content = format!(
            r#"/* {name} Component Styles */

.{snake_name} {{
    /* Add your styles here */
}}

.{snake_name} h2 {{
    font-size: 1.5rem;
    margin-bottom: 1rem;
}}
"#,
            name = name,
            snake_name = snake_name
        );
        fs::write(&css_path, css_content)?;
        println!(
            "{}  Created CSS module: {}",
            "[done]".green().bold(),
            css_path.display().to_string().cyan()
        );
    }

    // Update mod.rs if it exists
    update_mod_rs(path, &snake_name)?;

    println!(
        "{}  Created component: {}",
        "[done]".green().bold(),
        file_path.display().to_string().cyan()
    );

    println!("  Don't forget to add to your mod.rs:\n");
    println!("    pub mod {};", snake_name);
    println!();

    if with_props {
        println!("  Usage with props:\n");
        println!("    <{} />", name);
        println!();
    }

    if with_styles {
        println!("  CSS module created - import in your HTML or parent component");
        println!();
    }

    Ok(())
}

/// Convert PascalCase to snake_case
fn to_snake_case(s: &str) -> String {
    let mut result = String::new();
    for (i, c) in s.chars().enumerate() {
        if c.is_uppercase() && i > 0 {
            result.push('_');
        }
        result.push(c.to_lowercase().next().unwrap());
    }
    result
}
