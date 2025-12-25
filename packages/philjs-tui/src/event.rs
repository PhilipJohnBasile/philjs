//! Event handling for PhilJS TUI

use crossterm::event::{Event as CrosstermEvent, KeyCode, KeyEvent, KeyModifiers, MouseEvent};
use std::time::Duration;

/// TUI events
#[derive(Debug, Clone)]
pub enum Event {
    /// Key press
    Key(KeyEvent),
    /// Mouse event
    Mouse(MouseEvent),
    /// Terminal resize
    Resize(u16, u16),
    /// Tick (for animations/updates)
    Tick,
}

/// Event handler
pub struct EventHandler {
    tick_rate: Duration,
}

impl EventHandler {
    pub fn new(tick_rate: Duration) -> Self {
        EventHandler { tick_rate }
    }

    /// Poll for the next event
    pub fn next(&self) -> Result<Event, std::io::Error> {
        if crossterm::event::poll(self.tick_rate)? {
            match crossterm::event::read()? {
                CrosstermEvent::Key(key) => Ok(Event::Key(key)),
                CrosstermEvent::Mouse(mouse) => Ok(Event::Mouse(mouse)),
                CrosstermEvent::Resize(w, h) => Ok(Event::Resize(w, h)),
                _ => Ok(Event::Tick),
            }
        } else {
            Ok(Event::Tick)
        }
    }
}

/// Key event helpers
pub mod keys {
    use super::*;

    pub fn is_quit(key: &KeyEvent) -> bool {
        matches!(
            key,
            KeyEvent {
                code: KeyCode::Char('q'),
                modifiers: KeyModifiers::NONE,
                ..
            } | KeyEvent {
                code: KeyCode::Char('c'),
                modifiers: KeyModifiers::CONTROL,
                ..
            } | KeyEvent {
                code: KeyCode::Esc,
                ..
            }
        )
    }

    pub fn is_enter(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::Enter)
    }

    pub fn is_space(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::Char(' '))
    }

    pub fn is_up(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::Up | KeyCode::Char('k'))
    }

    pub fn is_down(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::Down | KeyCode::Char('j'))
    }

    pub fn is_left(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::Left | KeyCode::Char('h'))
    }

    pub fn is_right(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::Right | KeyCode::Char('l'))
    }

    pub fn is_tab(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::Tab)
    }

    pub fn is_backtab(key: &KeyEvent) -> bool {
        matches!(key.code, KeyCode::BackTab)
    }
}
