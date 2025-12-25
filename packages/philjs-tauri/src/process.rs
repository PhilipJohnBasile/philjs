//! Process utilities for PhilJS Tauri

/// Exit the application
pub fn exit(code: i32) {
    std::process::exit(code);
}

/// Restart the application (Tauri-specific)
pub fn restart() {
    // Would use tauri_plugin_process
}

/// Get current process ID
pub fn pid() -> u32 {
    std::process::id()
}
