//! PhilJS TUI - Terminal User Interface
//!
//! Build terminal applications using the same PhilJS component model.
//! Powered by Ratatui for cross-platform terminal rendering.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                     PhilJS Components                        │
//! │           (Same view!, rsx!, signals model)                  │
//! └─────────────────────────────────────────────────────────────┘
//!                              │
//!                              ▼
//! ┌─────────────────────────────────────────────────────────────┐
//! │                   PhilJS TUI Runtime                         │
//! │         (Terminal abstraction, event loop)                   │
//! └─────────────────────────────────────────────────────────────┘
//!                              │
//!                              ▼
//! ┌─────────────────────────────────────────────────────────────┐
//! │                      Ratatui / Crossterm                     │
//! │              (Cross-platform terminal rendering)             │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Example
//!
//! ```rust,ignore
//! use philjs_tui::prelude::*;
//!
//! #[component]
//! fn App() -> impl View {
//!     let count = create_signal(0);
//!
//!     view! {
//!         <Frame title="Counter">
//!             <VStack>
//!                 <Text>"Count: " {count}</Text>
//!                 <Button on_press={|| count.update(|n| *n + 1)}>
//!                     "Increment"
//!                 </Button>
//!             </VStack>
//!         </Frame>
//!     }
//! }
//!
//! fn main() -> Result<()> {
//!     philjs_tui::run(App)
//! }
//! ```

#![allow(unused)]

pub mod app;
pub mod components;
pub mod layout;
pub mod style;
pub mod event;
pub mod render;
pub mod widgets;

pub mod prelude {
    pub use crate::{
        run, run_with_config, TuiApp, TuiConfig, TuiError,
        components::*,
        layout::*,
        style::*,
        event::*,
        widgets::*,
    };
    pub use ratatui::style::{Color, Modifier, Style};
}

use std::io::{self, Stdout};
use std::time::Duration;
use ratatui::{backend::CrosstermBackend, Terminal};
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};

/// TUI application configuration
#[derive(Debug, Clone)]
pub struct TuiConfig {
    /// Tick rate for the event loop
    pub tick_rate: Duration,
    /// Enable mouse support
    pub mouse: bool,
    /// Enable paste support
    pub paste: bool,
    /// Frame rate limit
    pub frame_rate: u32,
}

impl Default for TuiConfig {
    fn default() -> Self {
        TuiConfig {
            tick_rate: Duration::from_millis(16), // ~60fps
            mouse: true,
            paste: false,
            frame_rate: 60,
        }
    }
}

/// TUI application handle
pub struct TuiApp {
    terminal: Terminal<CrosstermBackend<Stdout>>,
    config: TuiConfig,
    should_quit: bool,
}

impl TuiApp {
    /// Create a new TUI application
    pub fn new(config: TuiConfig) -> Result<Self, TuiError> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen)?;
        if config.mouse {
            execute!(stdout, EnableMouseCapture)?;
        }

        let backend = CrosstermBackend::new(stdout);
        let terminal = Terminal::new(backend)?;

        Ok(TuiApp {
            terminal,
            config,
            should_quit: false,
        })
    }

    /// Get terminal size
    pub fn size(&self) -> (u16, u16) {
        let size = self.terminal.size().unwrap_or_default();
        (size.width, size.height)
    }

    /// Request quit
    pub fn quit(&mut self) {
        self.should_quit = true;
    }

    /// Check if should quit
    pub fn should_quit(&self) -> bool {
        self.should_quit
    }

    /// Draw a frame
    pub fn draw<F>(&mut self, f: F) -> Result<(), TuiError>
    where
        F: FnOnce(&mut ratatui::Frame),
    {
        self.terminal.draw(f)?;
        Ok(())
    }
}

impl Drop for TuiApp {
    fn drop(&mut self) {
        let _ = disable_raw_mode();
        let _ = execute!(
            self.terminal.backend_mut(),
            LeaveAlternateScreen,
            DisableMouseCapture
        );
        let _ = self.terminal.show_cursor();
    }
}

/// Run a TUI application
pub fn run<F, V>(app: F) -> Result<(), TuiError>
where
    F: Fn() -> V + 'static,
    V: render::View,
{
    run_with_config(app, TuiConfig::default())
}

/// Run a TUI application with custom config
pub fn run_with_config<F, V>(app: F, config: TuiConfig) -> Result<(), TuiError>
where
    F: Fn() -> V + 'static,
    V: render::View,
{
    let mut tui = TuiApp::new(config.clone())?;
    let tick_rate = config.tick_rate;

    loop {
        // Render
        let view = app();
        tui.draw(|frame| {
            view.render(frame, frame.area());
        })?;

        // Handle events
        if event::poll(tick_rate)? {
            match event::read()? {
                Event::Key(key) if key.kind == KeyEventKind::Press => {
                    match key.code {
                        KeyCode::Char('q') => break,
                        KeyCode::Esc => break,
                        _ => {}
                    }
                }
                Event::Resize(_, _) => {
                    // Terminal resized, will redraw on next iteration
                }
                _ => {}
            }
        }

        if tui.should_quit() {
            break;
        }
    }

    Ok(())
}

/// TUI error types
#[derive(Debug, thiserror::Error)]
pub enum TuiError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    #[error("Render error: {0}")]
    Render(String),
}
