//! Project Template Modules
//!
//! Organized templates for different project types.

pub mod fullstack;
pub mod api;
pub mod static_site;
pub mod component_library;
pub mod ssr;
pub mod minimal;
pub mod liveview;

use std::collections::HashMap;

/// Template type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TemplateType {
    /// Full-stack app with frontend and backend
    Fullstack,
    /// REST API server
    Api,
    /// Static site generator
    StaticSite,
    /// Reusable component library
    ComponentLibrary,
    /// Server-side rendering with hydration
    Ssr,
    /// Minimal starter template
    Minimal,
    /// Phoenix-style LiveView with WebSocket
    LiveView,
}

impl TemplateType {
    /// Get all available template types
    pub fn all() -> &'static [TemplateType] {
        &[
            TemplateType::Fullstack,
            TemplateType::Api,
            TemplateType::StaticSite,
            TemplateType::ComponentLibrary,
            TemplateType::Ssr,
            TemplateType::Minimal,
            TemplateType::LiveView,
        ]
    }

    /// Get template name for CLI
    pub fn name(&self) -> &'static str {
        match self {
            TemplateType::Fullstack => "fullstack",
            TemplateType::Api => "api",
            TemplateType::StaticSite => "static-site",
            TemplateType::ComponentLibrary => "component-library",
            TemplateType::Ssr => "ssr",
            TemplateType::Minimal => "minimal",
            TemplateType::LiveView => "liveview",
        }
    }

    /// Get human-readable description
    pub fn description(&self) -> &'static str {
        match self {
            TemplateType::Fullstack => "Full-stack app with Axum backend and WASM frontend",
            TemplateType::Api => "REST API server with Axum and OpenAPI",
            TemplateType::StaticSite => "Static site with pre-rendered pages",
            TemplateType::ComponentLibrary => "Reusable component library package",
            TemplateType::Ssr => "Server-side rendering with progressive hydration",
            TemplateType::Minimal => "Minimal starter for learning or custom setups",
            TemplateType::LiveView => "Phoenix-style server-driven UI with WebSocket",
        }
    }

    /// Parse template from string
    pub fn from_str(s: &str) -> Option<TemplateType> {
        match s.to_lowercase().as_str() {
            "fullstack" => Some(TemplateType::Fullstack),
            "api" => Some(TemplateType::Api),
            "static-site" | "static_site" | "staticsite" => Some(TemplateType::StaticSite),
            "component-library" | "component_library" | "componentlibrary" => {
                Some(TemplateType::ComponentLibrary)
            }
            "ssr" => Some(TemplateType::Ssr),
            "minimal" => Some(TemplateType::Minimal),
            "liveview" | "live-view" | "live_view" => Some(TemplateType::LiveView),
            _ => None,
        }
    }
}

/// Generate files for a specific template
pub fn generate_template(template: TemplateType, name: &str) -> HashMap<String, String> {
    let mut files = match template {
        TemplateType::Fullstack => fullstack::generate(),
        TemplateType::Api => api::generate(),
        TemplateType::StaticSite => static_site::generate(),
        TemplateType::ComponentLibrary => component_library::generate(),
        TemplateType::Ssr => ssr::generate(),
        TemplateType::Minimal => minimal::generate(),
        TemplateType::LiveView => liveview::generate(),
    };

    // Replace {{name}} placeholder in all files
    for content in files.values_mut() {
        *content = content.replace("{{name}}", name);
    }

    files
}

/// List all available templates with descriptions
pub fn list_templates() -> Vec<(&'static str, &'static str)> {
    TemplateType::all()
        .iter()
        .map(|t| (t.name(), t.description()))
        .collect()
}
