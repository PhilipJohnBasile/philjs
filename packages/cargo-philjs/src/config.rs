//! Configuration handling

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct Config {
    pub project: ProjectConfig,
    pub build: BuildConfig,
    pub dev: DevConfig,
    pub ssr: SsrConfig,
    pub optimization: OptimizationConfig,
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct ProjectConfig {
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BuildConfig {
    pub target: String,
    pub out_dir: String,
}

impl Default for BuildConfig {
    fn default() -> Self {
        BuildConfig {
            target: "browser".to_string(),
            out_dir: "dist".to_string(),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DevConfig {
    pub port: u16,
    pub open: bool,
}

impl Default for DevConfig {
    fn default() -> Self {
        DevConfig {
            port: 3000,
            open: true,
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct SsrConfig {
    pub enabled: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct OptimizationConfig {
    pub minify: bool,
    pub tree_shake: bool,
}

impl Default for OptimizationConfig {
    fn default() -> Self {
        OptimizationConfig {
            minify: true,
            tree_shake: true,
        }
    }
}

impl Config {
    pub fn load() -> Option<Self> {
        let path = Path::new("philjs.config.toml");
        if path.exists() {
            let content = fs::read_to_string(path).ok()?;
            toml::from_str(&content).ok()
        } else {
            None
        }
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let content = toml::to_string_pretty(self)?;
        fs::write("philjs.config.toml", content)?;
        Ok(())
    }
}
