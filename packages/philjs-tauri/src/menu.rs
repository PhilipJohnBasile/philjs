//! Menu utilities for PhilJS Tauri

use crate::TauriError;
use std::sync::Arc;

/// Menu structure
pub struct Menu {
    items: Vec<MenuItem>,
}

impl Menu {
    pub fn new() -> Self {
        Menu { items: Vec::new() }
    }

    pub fn item(mut self, item: MenuItem) -> Self {
        self.items.push(item);
        self
    }

    pub fn separator(mut self) -> Self {
        self.items.push(MenuItem::Separator);
        self
    }

    pub fn submenu(mut self, label: impl Into<String>, menu: Menu) -> Self {
        self.items.push(MenuItem::Submenu {
            label: label.into(),
            menu,
        });
        self
    }
}

impl Default for Menu {
    fn default() -> Self {
        Self::new()
    }
}

/// Menu item
pub enum MenuItem {
    Text {
        id: String,
        label: String,
        enabled: bool,
        accelerator: Option<String>,
        handler: Option<Arc<dyn Fn() + Send + Sync>>,
    },
    Check {
        id: String,
        label: String,
        checked: bool,
        enabled: bool,
    },
    Separator,
    Submenu {
        label: String,
        menu: Menu,
    },
}

impl MenuItem {
    pub fn text(id: impl Into<String>, label: impl Into<String>) -> Self {
        MenuItem::Text {
            id: id.into(),
            label: label.into(),
            enabled: true,
            accelerator: None,
            handler: None,
        }
    }

    pub fn check(id: impl Into<String>, label: impl Into<String>, checked: bool) -> Self {
        MenuItem::Check {
            id: id.into(),
            label: label.into(),
            checked,
            enabled: true,
        }
    }

    pub fn separator() -> Self {
        MenuItem::Separator
    }
}

/// Menu builder
pub struct MenuBuilder {
    menu: Menu,
}

impl MenuBuilder {
    pub fn new() -> Self {
        MenuBuilder { menu: Menu::new() }
    }

    pub fn item(mut self, item: MenuItem) -> Self {
        self.menu.items.push(item);
        self
    }

    pub fn separator(mut self) -> Self {
        self.menu.items.push(MenuItem::Separator);
        self
    }

    pub fn submenu(mut self, label: impl Into<String>, menu: Menu) -> Self {
        self.menu.items.push(MenuItem::Submenu {
            label: label.into(),
            menu,
        });
        self
    }

    pub fn build(self) -> Menu {
        self.menu
    }
}

impl Default for MenuBuilder {
    fn default() -> Self {
        Self::new()
    }
}
