//! Shell utilities for PhilJS Tauri

use crate::TauriError;

/// Open a path with the default application
pub async fn open(path: &str) -> Result<(), TauriError> {
    // Would use tauri_plugin_shell
    let _ = path;
    Ok(())
}

/// Open a URL in the default browser
pub async fn open_url(url: &str) -> Result<(), TauriError> {
    // Would use tauri_plugin_shell
    let _ = url;
    Ok(())
}

/// Execute a command
pub struct Command {
    program: String,
    args: Vec<String>,
    cwd: Option<String>,
    env: std::collections::HashMap<String, String>,
}

impl Command {
    pub fn new(program: impl Into<String>) -> Self {
        Command {
            program: program.into(),
            args: Vec::new(),
            cwd: None,
            env: std::collections::HashMap::new(),
        }
    }

    pub fn arg(mut self, arg: impl Into<String>) -> Self {
        self.args.push(arg.into());
        self
    }

    pub fn args(mut self, args: impl IntoIterator<Item = impl Into<String>>) -> Self {
        self.args.extend(args.into_iter().map(|a| a.into()));
        self
    }

    pub fn cwd(mut self, cwd: impl Into<String>) -> Self {
        self.cwd = Some(cwd.into());
        self
    }

    pub fn env(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.env.insert(key.into(), value.into());
        self
    }

    pub async fn output(self) -> Result<CommandOutput, TauriError> {
        // Would use tauri_plugin_shell
        Ok(CommandOutput {
            stdout: String::new(),
            stderr: String::new(),
            code: 0,
        })
    }

    pub async fn spawn(self) -> Result<Child, TauriError> {
        // Would use tauri_plugin_shell
        Ok(Child { pid: 0 })
    }
}

/// Command output
pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub code: i32,
}

/// Spawned child process
pub struct Child {
    pub pid: u32,
}

impl Child {
    pub fn kill(&self) -> Result<(), TauriError> {
        Ok(())
    }
}
