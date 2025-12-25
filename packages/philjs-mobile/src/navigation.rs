//! PhilJS Mobile Navigation
//!
//! Navigation stack and routing for mobile applications.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Navigation route
#[derive(Debug, Clone)]
pub struct Route {
    /// Route path (e.g., "/users/:id")
    pub path: String,
    /// Route parameters
    pub params: HashMap<String, String>,
    /// Query parameters
    pub query: HashMap<String, String>,
    /// Custom data
    pub data: Option<Arc<dyn std::any::Any + Send + Sync>>,
}

impl Route {
    pub fn new(path: impl Into<String>) -> Self {
        Route {
            path: path.into(),
            params: HashMap::new(),
            query: HashMap::new(),
            data: None,
        }
    }

    pub fn param(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.params.insert(key.into(), value.into());
        self
    }

    pub fn query(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.query.insert(key.into(), value.into());
        self
    }

    pub fn data<T: Send + Sync + 'static>(mut self, data: T) -> Self {
        self.data = Some(Arc::new(data));
        self
    }

    pub fn get_param(&self, key: &str) -> Option<&String> {
        self.params.get(key)
    }

    pub fn get_query(&self, key: &str) -> Option<&String> {
        self.query.get(key)
    }

    pub fn get_data<T: 'static>(&self) -> Option<&T> {
        self.data.as_ref()?.downcast_ref()
    }
}

/// Navigation stack
pub struct NavigationStack {
    routes: Vec<Route>,
    listeners: Vec<Box<dyn Fn(&[Route]) + Send + Sync>>,
}

impl NavigationStack {
    pub fn new(initial: Route) -> Self {
        NavigationStack {
            routes: vec![initial],
            listeners: Vec::new(),
        }
    }

    /// Push a new route onto the stack
    pub fn push(&mut self, route: Route) {
        self.routes.push(route);
        self.notify();
    }

    /// Pop the top route from the stack
    pub fn pop(&mut self) -> Option<Route> {
        if self.routes.len() > 1 {
            let route = self.routes.pop();
            self.notify();
            route
        } else {
            None
        }
    }

    /// Pop to the root route
    pub fn pop_to_root(&mut self) {
        if self.routes.len() > 1 {
            self.routes.truncate(1);
            self.notify();
        }
    }

    /// Replace the current route
    pub fn replace(&mut self, route: Route) {
        if let Some(last) = self.routes.last_mut() {
            *last = route;
            self.notify();
        }
    }

    /// Get the current route
    pub fn current(&self) -> Option<&Route> {
        self.routes.last()
    }

    /// Get the entire route stack
    pub fn stack(&self) -> &[Route] {
        &self.routes
    }

    /// Check if can go back
    pub fn can_go_back(&self) -> bool {
        self.routes.len() > 1
    }

    /// Get stack depth
    pub fn depth(&self) -> usize {
        self.routes.len()
    }

    fn notify(&self) {
        for listener in &self.listeners {
            listener(&self.routes);
        }
    }

    /// Add a navigation change listener
    pub fn on_change<F: Fn(&[Route]) + Send + Sync + 'static>(&mut self, f: F) {
        self.listeners.push(Box::new(f));
    }
}

/// Navigator - the main navigation interface
pub struct Navigator {
    stack: Arc<Mutex<NavigationStack>>,
    transition: NavigationTransition,
}

impl Navigator {
    pub fn new(initial: Route) -> Self {
        Navigator {
            stack: Arc::new(Mutex::new(NavigationStack::new(initial))),
            transition: NavigationTransition::Push,
        }
    }

    /// Navigate to a new route
    pub fn navigate(&self, route: Route) {
        if let Ok(mut stack) = self.stack.lock() {
            stack.push(route);
        }
    }

    /// Navigate to a path with optional params
    pub fn navigate_to(&self, path: &str) {
        self.navigate(Route::new(path));
    }

    /// Go back
    pub fn back(&self) -> bool {
        if let Ok(mut stack) = self.stack.lock() {
            stack.pop().is_some()
        } else {
            false
        }
    }

    /// Go back to root
    pub fn back_to_root(&self) {
        if let Ok(mut stack) = self.stack.lock() {
            stack.pop_to_root();
        }
    }

    /// Replace current route
    pub fn replace(&self, route: Route) {
        if let Ok(mut stack) = self.stack.lock() {
            stack.replace(route);
        }
    }

    /// Get current route
    pub fn current(&self) -> Option<Route> {
        self.stack.lock().ok()?.current().cloned()
    }

    /// Check if can go back
    pub fn can_go_back(&self) -> bool {
        self.stack.lock().map(|s| s.can_go_back()).unwrap_or(false)
    }

    /// Set transition style
    pub fn with_transition(mut self, transition: NavigationTransition) -> Self {
        self.transition = transition;
        self
    }

    /// Add navigation listener
    pub fn on_change<F: Fn(&[Route]) + Send + Sync + 'static>(&self, f: F) {
        if let Ok(mut stack) = self.stack.lock() {
            stack.on_change(f);
        }
    }
}

impl Clone for Navigator {
    fn clone(&self) -> Self {
        Navigator {
            stack: Arc::clone(&self.stack),
            transition: self.transition,
        }
    }
}

/// Navigation transition style
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum NavigationTransition {
    /// Standard push transition (slide from right on iOS)
    #[default]
    Push,
    /// Modal presentation (slide from bottom)
    Modal,
    /// Fade transition
    Fade,
    /// No transition
    None,
    /// Custom transition
    Custom,
}

/// Tab bar item configuration
#[derive(Debug, Clone)]
pub struct TabItem {
    pub title: String,
    pub icon: String,
    pub selected_icon: Option<String>,
    pub badge: Option<String>,
}

impl TabItem {
    pub fn new(title: impl Into<String>, icon: impl Into<String>) -> Self {
        TabItem {
            title: title.into(),
            icon: icon.into(),
            selected_icon: None,
            badge: None,
        }
    }

    pub fn selected_icon(mut self, icon: impl Into<String>) -> Self {
        self.selected_icon = Some(icon.into());
        self
    }

    pub fn badge(mut self, badge: impl Into<String>) -> Self {
        self.badge = Some(badge.into());
        self
    }
}

/// Tab bar navigation
pub struct TabNavigator {
    tabs: Vec<TabItem>,
    selected_index: usize,
    navigators: Vec<Navigator>,
    on_change: Option<Box<dyn Fn(usize) + Send + Sync>>,
}

impl TabNavigator {
    pub fn new(tabs: Vec<(TabItem, Route)>) -> Self {
        let (items, routes): (Vec<_>, Vec<_>) = tabs.into_iter().unzip();
        let navigators = routes.into_iter().map(Navigator::new).collect();

        TabNavigator {
            tabs: items,
            selected_index: 0,
            navigators,
            on_change: None,
        }
    }

    pub fn select(&mut self, index: usize) {
        if index < self.tabs.len() {
            self.selected_index = index;
            if let Some(ref on_change) = self.on_change {
                on_change(index);
            }
        }
    }

    pub fn selected_index(&self) -> usize {
        self.selected_index
    }

    pub fn current_navigator(&self) -> Option<&Navigator> {
        self.navigators.get(self.selected_index)
    }

    pub fn on_tab_change<F: Fn(usize) + Send + Sync + 'static>(&mut self, f: F) {
        self.on_change = Some(Box::new(f));
    }
}

/// Navigation bar configuration
#[derive(Debug, Clone)]
pub struct NavigationBar {
    pub title: Option<String>,
    pub large_title: bool,
    pub back_button_title: Option<String>,
    pub hide_back_button: bool,
    pub right_items: Vec<NavBarItem>,
    pub left_items: Vec<NavBarItem>,
    pub background_color: Option<crate::Color>,
    pub tint_color: Option<crate::Color>,
    pub translucent: bool,
}

impl Default for NavigationBar {
    fn default() -> Self {
        NavigationBar {
            title: None,
            large_title: false,
            back_button_title: None,
            hide_back_button: false,
            right_items: Vec::new(),
            left_items: Vec::new(),
            background_color: None,
            tint_color: None,
            translucent: true,
        }
    }
}

impl NavigationBar {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn large_title(mut self) -> Self {
        self.large_title = true;
        self
    }

    pub fn hide_back_button(mut self) -> Self {
        self.hide_back_button = true;
        self
    }

    pub fn right_item(mut self, item: NavBarItem) -> Self {
        self.right_items.push(item);
        self
    }

    pub fn left_item(mut self, item: NavBarItem) -> Self {
        self.left_items.push(item);
        self
    }
}

/// Navigation bar item
#[derive(Debug, Clone)]
pub struct NavBarItem {
    pub kind: NavBarItemKind,
    pub on_tap: Option<Arc<dyn Fn() + Send + Sync>>,
}

#[derive(Debug, Clone)]
pub enum NavBarItemKind {
    Text(String),
    Icon(String),
    SystemItem(SystemNavItem),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SystemNavItem {
    Done,
    Cancel,
    Edit,
    Save,
    Add,
    Compose,
    Reply,
    Action,
    Organize,
    Bookmarks,
    Search,
    Refresh,
    Stop,
    Camera,
    Trash,
    Play,
    Pause,
    Rewind,
    FastForward,
    Undo,
    Redo,
}

impl NavBarItem {
    pub fn text(text: impl Into<String>) -> Self {
        NavBarItem {
            kind: NavBarItemKind::Text(text.into()),
            on_tap: None,
        }
    }

    pub fn icon(icon: impl Into<String>) -> Self {
        NavBarItem {
            kind: NavBarItemKind::Icon(icon.into()),
            on_tap: None,
        }
    }

    pub fn system(item: SystemNavItem) -> Self {
        NavBarItem {
            kind: NavBarItemKind::SystemItem(item),
            on_tap: None,
        }
    }

    pub fn on_tap<F: Fn() + Send + Sync + 'static>(mut self, f: F) -> Self {
        self.on_tap = Some(Arc::new(f));
        self
    }
}
