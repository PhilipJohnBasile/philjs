//! Project info
//!
//! Display project information and diagnostics.

use anyhow::Result;
use colored::Colorize;
use serde::Serialize;
use std::fs;
use std::process::Command;

#[derive(Serialize)]
struct ProjectInfo {
    name: Option<String>,
    version: Option<String>,
    philjs_version: String,
    template: Option<String>,
    tools: ToolsInfo,
    files: FilesInfo,
}

#[derive(Serialize)]
struct ToolsInfo {
    rustc: Option<String>,
    cargo: Option<String>,
    wasm_pack: Option<String>,
    wasm_opt: Option<String>,
}

#[derive(Serialize)]
struct FilesInfo {
    rust_files: usize,
    has_config: bool,
    has_static: bool,
}

/// Run info command
pub fn run(json: bool) -> Result<()> {
    let info = gather_info()?;

    if json {
        println!("{}", serde_json::to_string_pretty(&info)?);
    } else {
        print_info(&info);
    }

    Ok(())
}

fn gather_info() -> Result<ProjectInfo> {
    // Read Cargo.toml
    let (name, version) = if let Ok(content) = fs::read_to_string("Cargo.toml") {
        (
            extract_field(&content, "name"),
            extract_field(&content, "version"),
        )
    } else {
        (None, None)
    };

    // Read template from config
    let template = if let Ok(content) = fs::read_to_string("philjs.config.toml") {
        extract_field(&content, "template")
    } else {
        None
    };

    // Get tool versions
    let tools = ToolsInfo {
        rustc: get_version("rustc", &["--version"]),
        cargo: get_version("cargo", &["--version"]),
        wasm_pack: get_version("wasm-pack", &["--version"]),
        wasm_opt: get_version("wasm-opt", &["--version"]),
    };

    // Count files
    let rust_files = if std::path::Path::new("src").exists() {
        walkdir::WalkDir::new("src")
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().map_or(false, |ext| ext == "rs"))
            .count()
    } else {
        0
    };

    let files = FilesInfo {
        rust_files,
        has_config: std::path::Path::new("philjs.config.toml").exists(),
        has_static: std::path::Path::new("static").exists(),
    };

    Ok(ProjectInfo {
        name,
        version,
        philjs_version: "2.0.0".to_string(),
        template,
        tools,
        files,
    })
}

fn print_info(info: &ProjectInfo) {
    println!(
        "\n{}  PhilJS Project Info\n",
        "[info]".cyan().bold()
    );

    // Project
    println!("  {}", "Project".white().bold());
    if let Some(name) = &info.name {
        println!("    {}  {}", "Name:".dimmed(), name.cyan());
    }
    if let Some(version) = &info.version {
        println!("    {}  {}", "Version:".dimmed(), version.cyan());
    }
    if let Some(template) = &info.template {
        println!("    {}  {}", "Template:".dimmed(), template.cyan());
    }
    println!(
        "    {}  {}",
        "PhilJS:".dimmed(),
        info.philjs_version.green()
    );

    // Tools
    println!("\n  {}", "Tools".white().bold());
    print_tool_status("rustc", &info.tools.rustc);
    print_tool_status("cargo", &info.tools.cargo);
    print_tool_status("wasm-pack", &info.tools.wasm_pack);
    print_tool_status("wasm-opt", &info.tools.wasm_opt);

    // Files
    println!("\n  {}", "Project Structure".white().bold());
    println!(
        "    {}  {} Rust files",
        "Source:".dimmed(),
        info.files.rust_files
    );
    println!(
        "    {}  {}",
        "Config:".dimmed(),
        if info.files.has_config {
            "philjs.config.toml".green()
        } else {
            "not found".red()
        }
    );
    println!(
        "    {}  {}",
        "Static:".dimmed(),
        if info.files.has_static {
            "static/".green()
        } else {
            "not found".yellow()
        }
    );

    // Quick tips
    println!("\n  {}", "Quick Tips".white().bold());
    if !info.files.has_config {
        println!(
            "    {}  Run {} to create config",
            "[tip]".yellow(),
            "cargo philjs init".cyan()
        );
    }
    if info.tools.wasm_pack.is_none() {
        println!(
            "    {}  Install wasm-pack: {}",
            "[tip]".yellow(),
            "cargo install wasm-pack".cyan()
        );
    }
    if info.tools.wasm_opt.is_none() {
        println!(
            "    {}  Install wasm-opt for better optimization: {}",
            "[tip]".yellow(),
            "cargo install wasm-opt".cyan()
        );
    }

    println!();
}

fn print_tool_status(name: &str, version: &Option<String>) {
    match version {
        Some(v) => {
            println!(
                "    {} {} {}",
                "[ok]".green(),
                name,
                v.dimmed()
            );
        }
        None => {
            println!(
                "    {} {} {}",
                "[!]".red(),
                name,
                "not installed".dimmed()
            );
        }
    }
}

fn extract_field(content: &str, field: &str) -> Option<String> {
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with(field) {
            return trimmed
                .split('=')
                .nth(1)
                .map(|s| s.trim().trim_matches('"').to_string());
        }
    }
    None
}

fn get_version(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd)
        .args(args)
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| {
            String::from_utf8_lossy(&o.stdout)
                .lines()
                .next()
                .unwrap_or("")
                .trim()
                .to_string()
        })
}
