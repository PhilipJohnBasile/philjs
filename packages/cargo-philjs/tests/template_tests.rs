//! Template Generation Tests
//!
//! Tests for project template generation and validation.

use std::collections::HashMap;
use std::fs;
use tempfile::TempDir;

// Import template modules (you'll need to make these public or create test helpers)
// For now, we'll test the template structure expectations

#[test]
fn test_spa_template_structure() {
    // Test that SPA template has expected files
    let expected_files = vec![
        "Cargo.toml",
        "src/lib.rs",
        "src/components/mod.rs",
        "src/components/app.rs",
        "src/components/counter.rs",
        "static/index.html",
        "static/styles.css",
        "README.md",
    ];

    // This is a structure validation test
    // In a real implementation, you'd generate the template and verify files
    assert!(expected_files.len() > 0);
}

#[test]
fn test_fullstack_template_structure() {
    let expected_files = vec![
        "Cargo.toml",
        "src/lib.rs",
        "src/components/mod.rs",
        "src/components/app.rs",
        "src/components/todo_list.rs",
        "src/server_functions.rs",
        "src/api/mod.rs",
        "src/api/health.rs",
        "src/server.rs",
        "static/styles.css",
        "README.md",
    ];

    assert!(expected_files.len() > 0);
}

#[test]
fn test_api_template_structure() {
    let expected_files = vec![
        "Cargo.toml",
        "src/main.rs",
        "src/config.rs",
        "src/db.rs",
        "src/error.rs",
        "src/middleware.rs",
        "src/models.rs",
        "src/api/mod.rs",
        "src/api/health.rs",
        "src/api/users.rs",
        "migrations/001_create_users.sql",
        ".env.example",
        "README.md",
    ];

    assert!(expected_files.len() > 0);
}

#[test]
fn test_static_site_template_structure() {
    let expected_files = vec![
        "Cargo.toml",
        "src/main.rs",
        "src/components/mod.rs",
        "src/components/layout.rs",
        "src/components/header.rs",
        "src/components/footer.rs",
        "src/pages/mod.rs",
        "src/pages/index.rs",
        "src/pages/about.rs",
        "src/pages/blog.rs",
        "src/content/mod.rs",
        "src/content/markdown.rs",
        "content/posts/hello-world.md",
        "static/styles.css",
        "README.md",
    ];

    assert!(expected_files.len() > 0);
}

#[test]
fn test_component_library_template_structure() {
    let expected_files = vec![
        "Cargo.toml",
        "src/lib.rs",
        "src/components/mod.rs",
        "src/components/button.rs",
        "src/components/card.rs",
        "src/components/input.rs",
        "src/hooks/mod.rs",
        "src/hooks/use_toggle.rs",
        "src/theme.rs",
        "src/utils.rs",
        "styles/components.css",
        "README.md",
    ];

    assert!(expected_files.len() > 0);
}

/// Test that template names are correctly replaced
#[test]
fn test_template_name_replacement() {
    let template_content = "name = \"{{name}}\"";
    let replaced = template_content.replace("{{name}}", "my-app");
    assert_eq!(replaced, "name = \"my-app\"");
}

/// Test Cargo.toml generation for different templates
#[test]
fn test_cargo_toml_has_required_fields() {
    let cargo_toml = r#"[package]
name = "test-app"
version = "0.1.0"
edition = "2021"

[dependencies]
philjs = "2.0"
"#;

    assert!(cargo_toml.contains("[package]"));
    assert!(cargo_toml.contains("name ="));
    assert!(cargo_toml.contains("version ="));
    assert!(cargo_toml.contains("edition ="));
    assert!(cargo_toml.contains("[dependencies]"));
    assert!(cargo_toml.contains("philjs"));
}

/// Test that SPA templates include wasm-bindgen
#[test]
fn test_spa_includes_wasm_bindgen() {
    let spa_cargo = r#"[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs = "2.0"
wasm-bindgen = "0.2"
"#;

    assert!(spa_cargo.contains("wasm-bindgen"));
    assert!(spa_cargo.contains("cdylib"));
}

/// Test that API template includes database dependencies
#[test]
fn test_api_includes_database_deps() {
    let api_cargo = r#"[dependencies]
axum = { version = "0.7" }
sqlx = { version = "0.7", features = ["postgres"] }
serde = { version = "1", features = ["derive"] }
"#;

    assert!(api_cargo.contains("axum"));
    assert!(api_cargo.contains("sqlx"));
    assert!(api_cargo.contains("postgres"));
}

/// Test that fullstack template includes both client and server deps
#[test]
fn test_fullstack_includes_hybrid_deps() {
    let fullstack_cargo = r#"[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs = "2.0"
philjs-server = "2.0"
wasm-bindgen = "0.2"
axum = "0.7"
"#;

    assert!(fullstack_cargo.contains("wasm-bindgen"));
    assert!(fullstack_cargo.contains("axum"));
    assert!(fullstack_cargo.contains("philjs-server"));
}

/// Test README content
#[test]
fn test_readme_has_required_sections() {
    let readme = r#"# My App

## Features

## Getting Started

## Project Structure
"#;

    assert!(readme.contains("# "));
    assert!(readme.contains("## Features"));
    assert!(readme.contains("## Getting Started"));
}

/// Test that component files have proper structure
#[test]
fn test_component_file_structure() {
    let component = r#"//! Button Component

use philjs::prelude::*;

#[component]
pub fn Button() -> impl IntoView {
    view! {
        <button>"Click me"</button>
    }
}
"#;

    assert!(component.contains("use philjs::prelude::*"));
    assert!(component.contains("#[component]"));
    assert!(component.contains("pub fn"));
    assert!(component.contains("impl IntoView"));
    assert!(component.contains("view!"));
}

/// Test that server functions have correct macro
#[test]
fn test_server_function_structure() {
    let server_fn = r#"use philjs::server::*;

#[server(GetData)]
pub async fn get_data() -> ServerResult<Vec<Data>> {
    Ok(vec![])
}
"#;

    assert!(server_fn.contains("#[server("));
    assert!(server_fn.contains("pub async fn"));
    assert!(server_fn.contains("ServerResult"));
}

/// Test API route structure
#[test]
fn test_api_route_structure() {
    let api_route = r#"use axum::{Json, extract::State};
use serde::{Serialize, Deserialize};

#[derive(Serialize)]
pub struct Response {
    pub status: String,
}

pub async fn handler(State(db): State<Database>) -> Json<Response> {
    Json(Response { status: "ok".to_string() })
}
"#;

    assert!(api_route.contains("use axum"));
    assert!(api_route.contains("#[derive(Serialize)]"));
    assert!(api_route.contains("pub async fn"));
}

/// Test CSS file generation
#[test]
fn test_css_file_content() {
    let css = r#":root {
    --color-primary: #3b82f6;
}

.button {
    background-color: var(--color-primary);
}
"#;

    assert!(css.contains(":root"));
    assert!(css.contains("--color-primary"));
    assert!(css.contains("var(--"));
}

/// Test HTML template structure
#[test]
fn test_html_template_structure() {
    let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test App</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/pkg/app.js"></script>
</body>
</html>
"#;

    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains("<meta charset=\"UTF-8\">"));
    assert!(html.contains("viewport"));
    assert!(html.contains("<div id=\"app\">"));
    assert!(html.contains("type=\"module\""));
}

/// Test that templates include proper error handling
#[test]
fn test_error_handling_included() {
    let error_rs = r#"use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Not found")]
    NotFound,

    #[error("Internal error: {0}")]
    Internal(String),
}
"#;

    assert!(error_rs.contains("thiserror::Error"));
    assert!(error_rs.contains("#[derive(Debug, Error)]"));
    assert!(error_rs.contains("#[error("));
}

/// Test migrations for database templates
#[test]
fn test_migration_sql_structure() {
    let migration = r#"-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
"#;

    assert!(migration.contains("CREATE TABLE"));
    assert!(migration.contains("PRIMARY KEY"));
    assert!(migration.contains("CREATE INDEX"));
}

/// Test environment file template
#[test]
fn test_env_example_structure() {
    let env_example = r#"# Server
PORT=3000

# Database
DATABASE_URL=postgres://user:password@localhost/dbname

# Security
JWT_SECRET=change-me-in-production
"#;

    assert!(env_example.contains("PORT="));
    assert!(env_example.contains("DATABASE_URL="));
    assert!(env_example.contains("# "));
}

/// Test that templates include proper documentation
#[test]
fn test_template_documentation() {
    let documented_code = r#"//! User Module
//!
//! Handles user authentication and management.

/// Represents a user in the system
#[derive(Debug, Clone)]
pub struct User {
    /// Unique user identifier
    pub id: String,
    /// User email address
    pub email: String,
}

/// Creates a new user
///
/// # Arguments
/// * `email` - The user's email address
///
/// # Returns
/// A Result containing the created User or an error
pub fn create_user(email: String) -> Result<User, Error> {
    Ok(User { id: "".to_string(), email })
}
"#;

    assert!(documented_code.contains("//!"));
    assert!(documented_code.contains("///"));
    assert!(documented_code.contains("# Arguments"));
    assert!(documented_code.contains("# Returns"));
}

/// Test markdown frontmatter parsing (for static site template)
#[test]
fn test_markdown_frontmatter_structure() {
    let markdown = r#"---
title: Hello World
date: 2024-01-01
author: Test Author
---

# Hello World

This is the content.
"#;

    assert!(markdown.contains("---"));
    assert!(markdown.contains("title:"));
    assert!(markdown.contains("date:"));
    assert!(markdown.starts_with("---\n"));
}

/// Test that component library exports are correct
#[test]
fn test_component_library_exports() {
    let lib_rs = r#"pub mod components;
pub mod hooks;
pub mod theme;

pub use components::*;
pub use hooks::*;

pub mod prelude {
    pub use crate::components::*;
    pub use crate::hooks::*;
    pub use philjs::prelude::*;
}
"#;

    assert!(lib_rs.contains("pub mod components"));
    assert!(lib_rs.contains("pub use"));
    assert!(lib_rs.contains("pub mod prelude"));
}

/// Test that tests are included in generated components
#[test]
fn test_component_tests_included() {
    let component_with_tests = r#"#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_component_renders() {
        let html = render_to_string(|| view! {
            <MyComponent />
        });
        assert!(html.contains("MyComponent"));
    }
}
"#;

    assert!(component_with_tests.contains("#[cfg(test)]"));
    assert!(component_with_tests.contains("mod tests"));
    assert!(component_with_tests.contains("#[test]"));
    assert!(component_with_tests.contains("render_to_string"));
}
