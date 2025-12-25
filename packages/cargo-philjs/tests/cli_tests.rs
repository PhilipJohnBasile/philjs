//! CLI Integration Tests
//!
//! Tests for command-line argument parsing and CLI behavior.

use assert_cmd::Command;
use predicates::prelude::*;
use std::fs;
use tempfile::TempDir;

/// Helper to create cargo-philjs command
fn cargo_philjs() -> Command {
    Command::cargo_bin("cargo-philjs").unwrap()
}

#[test]
fn test_version_flag() {
    cargo_philjs()
        .arg("--version")
        .assert()
        .success()
        .stdout(predicate::str::contains(env!("CARGO_PKG_VERSION")));
}

#[test]
fn test_help_flag() {
    cargo_philjs()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("PhilJS CLI"));
}

#[test]
fn test_new_command_help() {
    cargo_philjs()
        .arg("new")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Create a new PhilJS project"));
}

#[test]
fn test_dev_command_help() {
    cargo_philjs()
        .arg("dev")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("development server"));
}

#[test]
fn test_build_command_help() {
    cargo_philjs()
        .arg("build")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Build for production"));
}

#[test]
fn test_build_with_minify_flag() {
    cargo_philjs()
        .arg("build")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("--minify"));
}

#[test]
fn test_generate_command_help() {
    cargo_philjs()
        .arg("generate")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Generate code"));
}

#[test]
fn test_generate_component_help() {
    cargo_philjs()
        .arg("generate")
        .arg("component")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Generate a component"))
        .stdout(predicate::str::contains("--props"))
        .stdout(predicate::str::contains("--styled"));
}

#[test]
fn test_invalid_command() {
    cargo_philjs()
        .arg("invalid-command")
        .assert()
        .failure();
}

#[test]
fn test_new_without_name() {
    cargo_philjs()
        .arg("new")
        .assert()
        .failure()
        .stderr(predicate::str::contains("required"));
}

#[test]
fn test_check_command_exists() {
    cargo_philjs()
        .arg("check")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Type check and lint"));
}

#[test]
fn test_test_command_exists() {
    cargo_philjs()
        .arg("test")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Run tests"));
}

#[test]
fn test_deploy_command_exists() {
    cargo_philjs()
        .arg("deploy")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Deploy to"));
}

#[test]
fn test_clean_command_exists() {
    cargo_philjs()
        .arg("clean")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Clean build artifacts"));
}

#[test]
fn test_info_command_exists() {
    cargo_philjs()
        .arg("info")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("project info"));
}

#[test]
fn test_update_command_exists() {
    cargo_philjs()
        .arg("update")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Update"));
}

#[test]
fn test_add_command_exists() {
    cargo_philjs()
        .arg("add")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Add a component or page"));
}

// Alias tests
#[test]
fn test_new_alias() {
    cargo_philjs()
        .arg("n")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("new PhilJS project"));
}

#[test]
fn test_dev_alias() {
    cargo_philjs()
        .arg("d")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("development server"));
}

#[test]
fn test_build_alias() {
    cargo_philjs()
        .arg("b")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("production"));
}

#[test]
fn test_generate_alias() {
    cargo_philjs()
        .arg("g")
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Generate"));
}

// Verbose and quiet flags
#[test]
fn test_verbose_flag() {
    cargo_philjs()
        .arg("--verbose")
        .arg("--help")
        .assert()
        .success();
}

#[test]
fn test_quiet_flag() {
    cargo_philjs()
        .arg("--quiet")
        .arg("--help")
        .assert()
        .success();
}

// Template validation
#[test]
fn test_valid_templates() {
    let templates = vec!["spa", "ssr", "fullstack", "liveview", "minimal"];

    for template in templates {
        cargo_philjs()
            .arg("new")
            .arg("test-app")
            .arg("--template")
            .arg(template)
            .arg("--help")  // Just validate the template is accepted
            .assert()
            .success();
    }
}

// Port validation
#[test]
fn test_dev_port_numeric() {
    cargo_philjs()
        .arg("dev")
        .arg("--port")
        .arg("8080")
        .arg("--help")
        .assert()
        .success();
}

// Build target validation
#[test]
fn test_build_targets() {
    let targets = vec!["browser", "node", "deno", "cloudflare"];

    for target in targets {
        cargo_philjs()
            .arg("build")
            .arg("--target")
            .arg(target)
            .arg("--help")
            .assert()
            .success();
    }
}

// Deploy platform validation
#[test]
fn test_deploy_platforms() {
    let platforms = vec!["vercel", "netlify", "cloudflare", "railway", "fly", "aws", "docker"];

    for platform in platforms {
        cargo_philjs()
            .arg("deploy")
            .arg("--platform")
            .arg(platform)
            .arg("--help")
            .assert()
            .success();
    }
}

// Integration test: Generate component in temp directory
#[test]
fn test_generate_component_basic() {
    let temp_dir = TempDir::new().unwrap();
    let components_dir = temp_dir.path().join("src/components");
    fs::create_dir_all(&components_dir).unwrap();

    cargo_philjs()
        .arg("generate")
        .arg("component")
        .arg("TestButton")
        .arg("--dir")
        .arg(components_dir.to_str().unwrap())
        .arg("--tests=false")  // Skip tests for simplicity
        .assert()
        .success();

    // Verify file was created
    let component_file = components_dir.join("test_button.rs");
    assert!(component_file.exists());

    // Verify content
    let content = fs::read_to_string(component_file).unwrap();
    assert!(content.contains("TestButton Component"));
    assert!(content.contains("#[component]"));
    assert!(content.contains("pub fn TestButton"));
}

// Integration test: Generate component with props
#[test]
fn test_generate_component_with_props() {
    let temp_dir = TempDir::new().unwrap();
    let components_dir = temp_dir.path().join("src/components");
    fs::create_dir_all(&components_dir).unwrap();

    cargo_philjs()
        .arg("generate")
        .arg("component")
        .arg("Card")
        .arg("--dir")
        .arg(components_dir.to_str().unwrap())
        .arg("--props")
        .arg("--tests=false")
        .assert()
        .success();

    let component_file = components_dir.join("card.rs");
    assert!(component_file.exists());

    let content = fs::read_to_string(component_file).unwrap();
    assert!(content.contains("CardProps"));
    assert!(content.contains("pub fn Card(props: CardProps)"));
}

// Integration test: Generate component with styles
#[test]
fn test_generate_component_with_styles() {
    let temp_dir = TempDir::new().unwrap();
    let components_dir = temp_dir.path().join("src/components");
    fs::create_dir_all(&components_dir).unwrap();

    cargo_philjs()
        .arg("generate")
        .arg("component")
        .arg("StyledButton")
        .arg("--dir")
        .arg(components_dir.to_str().unwrap())
        .arg("--styled")
        .arg("--tests=false")
        .assert()
        .success();

    // Verify both .rs and .css files were created
    let component_file = components_dir.join("styled_button.rs");
    let css_file = components_dir.join("styled_button.css");

    assert!(component_file.exists());
    assert!(css_file.exists());

    let rs_content = fs::read_to_string(component_file).unwrap();
    assert!(rs_content.contains("include_str!"));

    let css_content = fs::read_to_string(css_file).unwrap();
    assert!(css_content.contains(".styled_button"));
}

// Integration test: Generate component with all options
#[test]
fn test_generate_component_all_options() {
    let temp_dir = TempDir::new().unwrap();
    let components_dir = temp_dir.path().join("src/components");
    fs::create_dir_all(&components_dir).unwrap();

    cargo_philjs()
        .arg("generate")
        .arg("component")
        .arg("FullFeature")
        .arg("--dir")
        .arg(components_dir.to_str().unwrap())
        .arg("--props")
        .arg("--styled")
        .arg("--tests")
        .assert()
        .success();

    let component_file = components_dir.join("full_feature.rs");
    let css_file = components_dir.join("full_feature.css");

    assert!(component_file.exists());
    assert!(css_file.exists());

    let content = fs::read_to_string(component_file).unwrap();
    assert!(content.contains("FullFeatureProps"));
    assert!(content.contains("include_str!"));
    assert!(content.contains("#[cfg(test)]"));
    assert!(content.contains("test_full_feature_renders"));
}
