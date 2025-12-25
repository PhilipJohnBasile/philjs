//! Create a new PhilJS project
//!
//! Scaffolds a new project with the selected template.

use crate::templates;
use crate::ProjectTemplate;
use anyhow::{Context, Result};
use colored::Colorize;
use dialoguer::{theme::ColorfulTheme, Confirm};
use indicatif::{ProgressBar, ProgressStyle};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Duration;

/// Run the new project command
pub async fn run(
    name: &str,
    template: ProjectTemplate,
    no_git: bool,
    no_install: bool,
    philjs_version: Option<&str>,
) -> Result<()> {
    print_banner(name, template);

    let project_path = Path::new(name);

    // Check if directory exists
    if project_path.exists() {
        let overwrite = Confirm::with_theme(&ColorfulTheme::default())
            .with_prompt(format!(
                "Directory '{}' already exists. Overwrite?",
                name.cyan()
            ))
            .default(false)
            .interact()?;

        if !overwrite {
            println!("\n{}  Cancelled.\n", "[info]".yellow().bold());
            return Ok(());
        }

        fs::remove_dir_all(project_path)?;
    }

    // Create project directory
    fs::create_dir_all(project_path)?;

    let pb = ProgressBar::new(6);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.cyan} [{bar:40.cyan/blue}] {pos}/{len} {msg}")
            .unwrap()
            .progress_chars("=>-"),
    );
    pb.enable_steady_tick(Duration::from_millis(100));

    // Step 1: Create Cargo.toml
    pb.set_message("Creating Cargo.toml...");
    create_cargo_toml(project_path, name, template, philjs_version)?;
    pb.inc(1);

    // Step 2: Create source files
    pb.set_message("Creating source files...");
    create_source_files(project_path, name, template)?;
    pb.inc(1);

    // Step 3: Create config files
    pb.set_message("Creating configuration...");
    create_config_files(project_path, template)?;
    pb.inc(1);

    // Step 4: Create static files
    pb.set_message("Creating static assets...");
    create_static_files(project_path, template)?;
    pb.inc(1);

    // Step 5: Initialize git
    if !no_git {
        pb.set_message("Initializing git repository...");
        init_git(project_path)?;
    }
    pb.inc(1);

    // Step 6: Verify project structure
    pb.set_message("Verifying project...");
    std::thread::sleep(Duration::from_millis(200));
    pb.inc(1);

    pb.finish_with_message("Project created!");

    // Print success message
    print_success(name, template);

    Ok(())
}

fn print_banner(name: &str, template: ProjectTemplate) {
    println!("\n{}  Creating new PhilJS project", "[new]".cyan().bold());
    println!("{}", "  ==========================".cyan());
    println!();
    println!("  {}  {}", "Name:".white().bold(), name.cyan());
    println!("  {}  {:?}", "Template:".white().bold(), template);
    println!();
}

fn print_success(name: &str, template: ProjectTemplate) {
    println!();
    println!(
        "{}  Project '{}' created successfully!",
        "[done]".green().bold(),
        name.cyan()
    );
    println!();
    println!("  {}", "Next steps:".white().bold());
    println!();
    println!("    {}  cd {}", "1.".cyan(), name);
    println!("    {}  cargo philjs dev", "2.".cyan());
    println!();

    // Template-specific instructions
    match template {
        ProjectTemplate::Fullstack => {
            println!("  {}", "Fullstack features:".white().bold());
            println!("    - Server-side rendering with hydration");
            println!("    - Server functions with #[server] macro");
            println!("    - API routes in src/api/");
            println!();
        }
        ProjectTemplate::Liveview => {
            println!("  {}", "LiveView features:".white().bold());
            println!("    - Real-time server-driven UI");
            println!("    - WebSocket connections handled automatically");
            println!("    - State lives on the server");
            println!();
        }
        ProjectTemplate::Ssr => {
            println!("  {}", "SSR features:".white().bold());
            println!("    - Server-side rendering");
            println!("    - Hydration for interactivity");
            println!();
        }
        _ => {}
    }

    println!(
        "  {}  {}",
        "Docs:".white().bold(),
        "https://philjs.dev/docs".cyan().underline()
    );
    println!();
}

fn create_cargo_toml(
    path: &Path,
    name: &str,
    template: ProjectTemplate,
    philjs_version: Option<&str>,
) -> Result<()> {
    let version = philjs_version.unwrap_or("2.0");
    let crate_name = name.replace('-', "_");

    let (features, extra_deps) = match template {
        ProjectTemplate::Spa => ("", ""),
        ProjectTemplate::Ssr => (
            r#"
[features]
default = ["hydration"]
ssr = ["philjs/ssr"]
hydration = ["philjs/hydration"]"#,
            "",
        ),
        ProjectTemplate::Fullstack => (
            r#"
[features]
default = ["hydration"]
ssr = ["philjs/ssr", "axum", "tokio"]
hydration = ["philjs/hydration"]"#,
            r#"
# Server (only for SSR)
axum = { version = "0.7", optional = true }
tokio = { version = "1.35", features = ["full"], optional = true }
tower = { version = "0.4", optional = true }
tower-http = { version = "0.5", features = ["fs"], optional = true }"#,
        ),
        ProjectTemplate::Liveview => (
            r#"
[features]
default = []
server = ["axum", "tokio"]"#,
            r#"
# LiveView Server
axum = { version = "0.7", optional = true }
tokio = { version = "1.35", features = ["full"], optional = true }
tokio-tungstenite = "0.21""#,
        ),
        ProjectTemplate::Minimal => ("", ""),
    };

    let content = format!(
        r#"[package]
name = "{crate_name}"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <you@example.com>"]

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
# PhilJS - The #1 UI framework for Rust
philjs = "{version}"

# WASM bindings
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"
web-sys = {{ version = "0.3", features = ["console"] }}
js-sys = "0.3"

# Serialization
serde = {{ version = "1.0", features = ["derive"] }}
serde_json = "1.0"

# Error handling
console_error_panic_hook = "0.1"
{extra_deps}
[dev-dependencies]
wasm-bindgen-test = "0.3"
{features}
[profile.release]
lto = true
opt-level = "z"
codegen-units = 1
"#
    );

    fs::write(path.join("Cargo.toml"), content)?;
    Ok(())
}

fn create_source_files(path: &Path, name: &str, template: ProjectTemplate) -> Result<()> {
    let src_path = path.join("src");
    fs::create_dir_all(&src_path)?;

    // lib.rs based on template
    let lib_content = match template {
        ProjectTemplate::Spa => templates::spa_lib(),
        ProjectTemplate::Ssr => templates::ssr_lib(),
        ProjectTemplate::Fullstack => templates::fullstack_lib(),
        ProjectTemplate::Liveview => templates::liveview_lib(),
        ProjectTemplate::Minimal => templates::minimal_lib(),
    };
    fs::write(src_path.join("lib.rs"), lib_content)?;

    // Create components directory
    let components_path = src_path.join("components");
    fs::create_dir_all(&components_path)?;

    fs::write(
        components_path.join("mod.rs"),
        "pub mod app;\npub mod counter;\n",
    )?;
    fs::write(
        components_path.join("counter.rs"),
        templates::counter_component(),
    )?;
    fs::write(components_path.join("app.rs"), templates::app_component())?;

    // Template-specific files
    match template {
        ProjectTemplate::Fullstack => {
            // Create API directory
            let api_path = src_path.join("api");
            fs::create_dir_all(&api_path)?;
            fs::write(api_path.join("mod.rs"), templates::api_mod())?;

            // Create server directory
            let server_path = src_path.join("server");
            fs::create_dir_all(&server_path)?;
            fs::write(server_path.join("mod.rs"), templates::server_mod())?;
        }
        ProjectTemplate::Liveview => {
            // Create liveview directory
            let liveview_path = src_path.join("liveview");
            fs::create_dir_all(&liveview_path)?;
            fs::write(liveview_path.join("mod.rs"), templates::liveview_mod())?;
        }
        ProjectTemplate::Ssr => {
            // Create pages directory
            let pages_path = src_path.join("pages");
            fs::create_dir_all(&pages_path)?;
            fs::write(pages_path.join("mod.rs"), "pub mod home;\n")?;
            fs::write(pages_path.join("home.rs"), templates::home_page())?;
        }
        _ => {}
    }

    Ok(())
}

fn create_config_files(path: &Path, template: ProjectTemplate) -> Result<()> {
    // philjs.config.toml
    let config = match template {
        ProjectTemplate::Liveview => {
            r#"[project]
name = "my-app"
template = "liveview"

[server]
port = 3000
host = "127.0.0.1"

[liveview]
websocket_path = "/live"
reconnect_interval = 1000
"#
        }
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

[server]
port = 8080
api_prefix = "/api"

[optimization]
minify = true
tree_shake = true
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
    fs::write(path.join("philjs.config.toml"), config)?;

    // .gitignore
    let gitignore = r#"# Build outputs
/target
/dist
/pkg
/.philjs

# Dependencies
/node_modules

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Environment
.env
.env.local
*.pem
"#;
    fs::write(path.join(".gitignore"), gitignore)?;

    // rust-toolchain.toml
    let toolchain = r#"[toolchain]
channel = "stable"
targets = ["wasm32-unknown-unknown"]
profile = "minimal"
"#;
    fs::write(path.join("rust-toolchain.toml"), toolchain)?;

    Ok(())
}

fn create_static_files(path: &Path, template: ProjectTemplate) -> Result<()> {
    let static_path = path.join("static");
    fs::create_dir_all(&static_path)?;

    // index.html
    let html = match template {
        ProjectTemplate::Liveview => templates::liveview_html(),
        ProjectTemplate::Ssr => templates::ssr_html(),
        _ => templates::spa_html(),
    };
    fs::write(static_path.join("index.html"), html)?;

    // styles.css
    let css = templates::default_css();
    fs::write(static_path.join("styles.css"), css)?;

    Ok(())
}

fn init_git(path: &Path) -> Result<()> {
    Command::new("git")
        .args(["init", "-q"])
        .current_dir(path)
        .output()
        .context("Failed to initialize git repository")?;

    // Create initial commit message template
    let commit_msg = r#"# PhilJS Project

Initial project setup with PhilJS.

# Please enter the commit message for your changes.
"#;
    fs::write(path.join(".git").join("COMMIT_EDITMSG"), commit_msg)?;

    Ok(())
}
