//! Initialize PhilJS in existing project
//!
//! Adds PhilJS to an existing Rust project.

use crate::ProjectTemplate;
use anyhow::{Context, Result};
use colored::Colorize;
use std::fs;
use std::path::Path;

/// Initialize PhilJS in an existing project
pub fn run(template: ProjectTemplate) -> Result<()> {
    println!("\n{}  Initializing PhilJS...\n", "[init]".cyan().bold());

    // Check if Cargo.toml exists
    if !Path::new("Cargo.toml").exists() {
        anyhow::bail!(
            "No Cargo.toml found. Run this in a Rust project directory or use:\n  {}",
            "cargo philjs new my-app".cyan()
        );
    }

    // Add philjs dependency
    add_philjs_dependency(template)?;

    // Create config file
    create_config_file(template)?;

    // Create source structure if needed
    create_source_structure(template)?;

    println!("\n{}  PhilJS initialized successfully!", "[done]".green().bold());
    println!();
    println!("  Next steps:");
    println!("    {}  Update src/lib.rs with PhilJS imports", "1.".cyan());
    println!("    {}  cargo philjs dev", "2.".cyan());
    println!();

    Ok(())
}

/// Add philjs dependency to Cargo.toml
fn add_philjs_dependency(template: ProjectTemplate) -> Result<()> {
    let cargo_path = Path::new("Cargo.toml");
    let content = fs::read_to_string(cargo_path)?;

    if content.contains("philjs") {
        println!("  {}  philjs dependency already present", "[ok]".green());
        return Ok(());
    }

    // Parse and modify TOML
    let mut doc: toml_edit::DocumentMut = content.parse().context("Failed to parse Cargo.toml")?;

    // Ensure [dependencies] section exists
    if !doc.contains_key("dependencies") {
        doc["dependencies"] = toml_edit::Item::Table(toml_edit::Table::new());
    }

    // Add philjs
    doc["dependencies"]["philjs"] = toml_edit::value("2.0");
    doc["dependencies"]["wasm-bindgen"] = toml_edit::value("0.2");

    // Add lib section if needed
    if !doc.contains_key("lib") {
        doc["lib"] = toml_edit::Item::Table(toml_edit::Table::new());
        let lib = doc["lib"].as_table_mut().unwrap();
        let mut array = toml_edit::Array::new();
        array.push("cdylib");
        array.push("rlib");
        lib["crate-type"] = toml_edit::value(array);
    }

    // Add features for SSR/Fullstack templates
    match template {
        ProjectTemplate::Ssr | ProjectTemplate::Fullstack => {
            if !doc.contains_key("features") {
                doc["features"] = toml_edit::Item::Table(toml_edit::Table::new());
            }
            let features = doc["features"].as_table_mut().unwrap();
            let mut default = toml_edit::Array::new();
            default.push("hydration");
            features["default"] = toml_edit::value(default);

            let mut ssr = toml_edit::Array::new();
            ssr.push("philjs/ssr");
            features["ssr"] = toml_edit::value(ssr);

            let mut hydration = toml_edit::Array::new();
            hydration.push("philjs/hydration");
            features["hydration"] = toml_edit::value(hydration);
        }
        _ => {}
    }

    fs::write(cargo_path, doc.to_string())?;
    println!("  {}  Added philjs dependency", "[ok]".green());

    Ok(())
}

/// Create philjs.config.toml
fn create_config_file(template: ProjectTemplate) -> Result<()> {
    let config_path = Path::new("philjs.config.toml");

    if config_path.exists() {
        println!("  {}  philjs.config.toml already exists", "[ok]".green());
        return Ok(());
    }

    let config = match template {
        ProjectTemplate::Fullstack => {
            r#"[project]
name = "my-app"
template = "fullstack"

[build]
target = "browser"
out_dir = "dist"

[dev]
port = 3000
open = true

[ssr]
enabled = true

[optimization]
minify = true
tree_shake = true
"#
        }
        ProjectTemplate::Liveview => {
            r#"[project]
name = "my-app"
template = "liveview"

[server]
port = 3000
host = "127.0.0.1"

[liveview]
websocket_path = "/live"
"#
        }
        _ => {
            r#"[project]
name = "my-app"

[build]
target = "browser"
out_dir = "dist"

[dev]
port = 3000
open = true

[optimization]
minify = true
tree_shake = true
"#
        }
    };

    fs::write(config_path, config)?;
    println!("  {}  Created philjs.config.toml", "[ok]".green());

    Ok(())
}

/// Create source directory structure
fn create_source_structure(template: ProjectTemplate) -> Result<()> {
    // Create components directory
    let components_path = Path::new("src/components");
    if !components_path.exists() {
        fs::create_dir_all(components_path)?;
        fs::write(
            components_path.join("mod.rs"),
            "// Add your components here\n",
        )?;
        println!("  {}  Created src/components/", "[ok]".green());
    }

    // Create static directory
    let static_path = Path::new("static");
    if !static_path.exists() {
        fs::create_dir_all(static_path)?;

        // Create index.html
        let html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PhilJS App</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="app"></div>
    <script type="module">
        import init from '/pkg/app.js';
        init();
    </script>
</body>
</html>
"#;
        fs::write(static_path.join("index.html"), html)?;
        fs::write(static_path.join("styles.css"), "/* Add your styles here */\n")?;
        println!("  {}  Created static/ directory", "[ok]".green());
    }

    // Template-specific directories
    match template {
        ProjectTemplate::Fullstack => {
            let api_path = Path::new("src/api");
            if !api_path.exists() {
                fs::create_dir_all(api_path)?;
                fs::write(api_path.join("mod.rs"), "// Add your API routes here\n")?;
                println!("  {}  Created src/api/", "[ok]".green());
            }
        }
        ProjectTemplate::Ssr => {
            let pages_path = Path::new("src/pages");
            if !pages_path.exists() {
                fs::create_dir_all(pages_path)?;
                fs::write(pages_path.join("mod.rs"), "// Add your pages here\n")?;
                println!("  {}  Created src/pages/", "[ok]".green());
            }
        }
        _ => {}
    }

    Ok(())
}
