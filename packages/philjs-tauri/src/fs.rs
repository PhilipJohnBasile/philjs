//! File system utilities for PhilJS Tauri

use std::path::{Path, PathBuf};
use crate::TauriError;

/// Read a text file
pub async fn read_text(path: impl AsRef<Path>) -> Result<String, TauriError> {
    std::fs::read_to_string(path.as_ref()).map_err(TauriError::from)
}

/// Read a binary file
pub async fn read_binary(path: impl AsRef<Path>) -> Result<Vec<u8>, TauriError> {
    std::fs::read(path.as_ref()).map_err(TauriError::from)
}

/// Write a text file
pub async fn write_text(path: impl AsRef<Path>, content: &str) -> Result<(), TauriError> {
    std::fs::write(path.as_ref(), content).map_err(TauriError::from)
}

/// Write a binary file
pub async fn write_binary(path: impl AsRef<Path>, content: &[u8]) -> Result<(), TauriError> {
    std::fs::write(path.as_ref(), content).map_err(TauriError::from)
}

/// Check if path exists
pub fn exists(path: impl AsRef<Path>) -> bool {
    path.as_ref().exists()
}

/// Create directory
pub async fn create_dir(path: impl AsRef<Path>) -> Result<(), TauriError> {
    std::fs::create_dir_all(path.as_ref()).map_err(TauriError::from)
}

/// Remove file
pub async fn remove_file(path: impl AsRef<Path>) -> Result<(), TauriError> {
    std::fs::remove_file(path.as_ref()).map_err(TauriError::from)
}

/// Remove directory
pub async fn remove_dir(path: impl AsRef<Path>) -> Result<(), TauriError> {
    std::fs::remove_dir_all(path.as_ref()).map_err(TauriError::from)
}

/// Copy file
pub async fn copy(from: impl AsRef<Path>, to: impl AsRef<Path>) -> Result<u64, TauriError> {
    std::fs::copy(from.as_ref(), to.as_ref()).map_err(TauriError::from)
}

/// Rename/move file
pub async fn rename(from: impl AsRef<Path>, to: impl AsRef<Path>) -> Result<(), TauriError> {
    std::fs::rename(from.as_ref(), to.as_ref()).map_err(TauriError::from)
}

/// List directory contents
pub async fn read_dir(path: impl AsRef<Path>) -> Result<Vec<PathBuf>, TauriError> {
    let entries = std::fs::read_dir(path.as_ref())?;
    let mut paths = Vec::new();
    for entry in entries {
        paths.push(entry?.path());
    }
    Ok(paths)
}

/// Well-known directories
pub mod dirs {
    use std::path::PathBuf;

    pub fn home() -> Option<PathBuf> {
        dirs::home_dir()
    }

    pub fn documents() -> Option<PathBuf> {
        dirs::document_dir()
    }

    pub fn downloads() -> Option<PathBuf> {
        dirs::download_dir()
    }

    pub fn desktop() -> Option<PathBuf> {
        dirs::desktop_dir()
    }

    pub fn config() -> Option<PathBuf> {
        dirs::config_dir()
    }

    pub fn data() -> Option<PathBuf> {
        dirs::data_dir()
    }

    pub fn cache() -> Option<PathBuf> {
        dirs::cache_dir()
    }
}
