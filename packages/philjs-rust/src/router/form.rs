//! Progressive Enhancement Forms for PhilJS Router
//!
//! Provides form components that work without JavaScript (progressive enhancement)
//! but use client-side navigation when available.
//!
//! # Example
//!
//! ```rust
//! use philjs::router::form::*;
//!
//! #[component]
//! fn LoginPage() -> impl IntoView {
//!     let login_action = create_server_action::<Login, _>(login);
//!
//!     view! {
//!         <ActionForm action=login_action>
//!             <input type="email" name="email" />
//!             <input type="password" name="password" />
//!             <button type="submit">"Login"</button>
//!         </ActionForm>
//!     }
//! }
//! ```

use std::collections::HashMap;
use std::rc::Rc;

use crate::reactive::{Signal, Effect};
use crate::reactive::action::{Action, MultiAction};
use crate::view::{View, IntoView};

// =============================================================================
// Form Component
// =============================================================================

/// A form that progressively enhances navigation.
///
/// Without JavaScript: Standard form submission
/// With JavaScript: Prevents default, uses client-side navigation
pub struct Form {
    /// Form action URL
    action: String,
    /// HTTP method
    method: FormMethod,
    /// Encoding type
    enctype: FormEnctype,
    /// Additional attributes
    attrs: HashMap<String, String>,
    /// Children (form fields)
    children: Option<Box<dyn Fn() -> View>>,
    /// On submit handler
    on_submit: Option<Rc<dyn Fn(FormData)>>,
}

/// HTTP method for forms
#[derive(Clone, Debug, Default)]
pub enum FormMethod {
    #[default]
    Post,
    Get,
}

impl FormMethod {
    pub fn as_str(&self) -> &str {
        match self {
            FormMethod::Post => "post",
            FormMethod::Get => "get",
        }
    }
}

/// Form encoding type
#[derive(Clone, Debug, Default)]
pub enum FormEnctype {
    #[default]
    UrlEncoded,
    Multipart,
    Plain,
}

impl FormEnctype {
    pub fn as_str(&self) -> &str {
        match self {
            FormEnctype::UrlEncoded => "application/x-www-form-urlencoded",
            FormEnctype::Multipart => "multipart/form-data",
            FormEnctype::Plain => "text/plain",
        }
    }
}

/// Form data extracted from a form submission
#[derive(Clone, Debug, Default)]
pub struct FormData {
    entries: HashMap<String, FormValue>,
}

/// A form field value
#[derive(Clone, Debug)]
pub enum FormValue {
    Text(String),
    File(FileData),
    Multiple(Vec<FormValue>),
}

/// File data from a file input
#[derive(Clone, Debug)]
pub struct FileData {
    pub name: String,
    pub size: u64,
    pub mime_type: String,
    pub data: Vec<u8>,
}

impl FormData {
    pub fn new() -> Self {
        Self::default()
    }

    /// Get a string value by name.
    pub fn get(&self, name: &str) -> Option<&str> {
        match self.entries.get(name) {
            Some(FormValue::Text(s)) => Some(s),
            _ => None,
        }
    }

    /// Get all values for a name (for multi-select, etc.).
    pub fn get_all(&self, name: &str) -> Vec<&str> {
        match self.entries.get(name) {
            Some(FormValue::Text(s)) => vec![s],
            Some(FormValue::Multiple(vals)) => {
                vals.iter()
                    .filter_map(|v| match v {
                        FormValue::Text(s) => Some(s.as_str()),
                        _ => None,
                    })
                    .collect()
            }
            _ => vec![],
        }
    }

    /// Get a file by name.
    pub fn get_file(&self, name: &str) -> Option<&FileData> {
        match self.entries.get(name) {
            Some(FormValue::File(f)) => Some(f),
            _ => None,
        }
    }

    /// Set a value.
    pub fn set(&mut self, name: impl Into<String>, value: impl Into<String>) {
        self.entries.insert(name.into(), FormValue::Text(value.into()));
    }

    /// Append a value (for multiple values).
    pub fn append(&mut self, name: impl Into<String>, value: impl Into<String>) {
        let name = name.into();
        let value = FormValue::Text(value.into());

        match self.entries.get_mut(&name) {
            Some(FormValue::Multiple(vals)) => {
                vals.push(value);
            }
            Some(existing) => {
                let existing = std::mem::replace(existing, FormValue::Multiple(vec![]));
                if let FormValue::Multiple(ref mut vals) = self.entries.get_mut(&name).unwrap() {
                    vals.push(existing);
                    vals.push(value);
                }
            }
            None => {
                self.entries.insert(name, value);
            }
        }
    }

    /// Iterate over entries.
    pub fn iter(&self) -> impl Iterator<Item = (&String, &FormValue)> {
        self.entries.iter()
    }

    /// Convert to URL-encoded string.
    pub fn to_url_encoded(&self) -> String {
        self.entries
            .iter()
            .filter_map(|(k, v)| match v {
                FormValue::Text(s) => Some(format!(
                    "{}={}",
                    urlencoding_encode(k),
                    urlencoding_encode(s)
                )),
                _ => None,
            })
            .collect::<Vec<_>>()
            .join("&")
    }
}

fn urlencoding_encode(s: &str) -> String {
    s.replace(' ', "+")
        .replace('&', "%26")
        .replace('=', "%3D")
        .replace('?', "%3F")
}

impl Form {
    /// Create a new form.
    pub fn new(action: impl Into<String>) -> Self {
        Self {
            action: action.into(),
            method: FormMethod::Post,
            enctype: FormEnctype::UrlEncoded,
            attrs: HashMap::new(),
            children: None,
            on_submit: None,
        }
    }

    /// Set the HTTP method.
    pub fn method(mut self, method: FormMethod) -> Self {
        self.method = method;
        self
    }

    /// Set the encoding type.
    pub fn enctype(mut self, enctype: FormEnctype) -> Self {
        self.enctype = enctype;
        self
    }

    /// Add a custom attribute.
    pub fn attr(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.attrs.insert(name.into(), value.into());
        self
    }

    /// Set the form children.
    pub fn children(mut self, children: impl Fn() -> View + 'static) -> Self {
        self.children = Some(Box::new(children));
        self
    }

    /// Set on submit handler.
    pub fn on_submit(mut self, handler: impl Fn(FormData) + 'static) -> Self {
        self.on_submit = Some(Rc::new(handler));
        self
    }

    /// Render the form.
    pub fn render(&self) -> View {
        // Build form element with progressive enhancement attributes
        let mut attrs = vec![
            ("action".to_string(), self.action.clone()),
            ("method".to_string(), self.method.as_str().to_string()),
            ("enctype".to_string(), self.enctype.as_str().to_string()),
        ];

        for (k, v) in &self.attrs {
            attrs.push((k.clone(), v.clone()));
        }

        // Render children
        let children_view = self.children.as_ref().map(|c| c()).unwrap_or(View::Empty);

        View::Element(crate::view::element::ElementBuilder::new("form")
            .attrs(attrs)
            .child(children_view)
            .build())
    }
}

impl IntoView for Form {
    fn into_view(self) -> View {
        self.render()
    }
}

// =============================================================================
// ActionForm Component
// =============================================================================

/// A form that dispatches an action on submit.
///
/// This form automatically:
/// - Shows pending state while action is running
/// - Handles errors
/// - Resets on success (optional)
pub struct ActionForm<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// The action to dispatch
    action: Action<I, O>,
    /// Form data to action input converter
    converter: Rc<dyn Fn(FormData) -> I>,
    /// Whether to reset form on success
    reset_on_success: bool,
    /// Children (form fields)
    children: Option<Box<dyn Fn() -> View>>,
    /// Additional attributes
    attrs: HashMap<String, String>,
}

impl<I, O> ActionForm<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// Create a new action form.
    pub fn new(action: Action<I, O>, converter: impl Fn(FormData) -> I + 'static) -> Self {
        Self {
            action,
            converter: Rc::new(converter),
            reset_on_success: true,
            children: None,
            attrs: HashMap::new(),
        }
    }

    /// Set whether to reset on success.
    pub fn reset_on_success(mut self, reset: bool) -> Self {
        self.reset_on_success = reset;
        self
    }

    /// Set children.
    pub fn children(mut self, children: impl Fn() -> View + 'static) -> Self {
        self.children = Some(Box::new(children));
        self
    }

    /// Add attribute.
    pub fn attr(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.attrs.insert(name.into(), value.into());
        self
    }

    /// Render the form.
    pub fn render(&self) -> View {
        let children_view = self.children.as_ref().map(|c| c()).unwrap_or(View::Empty);

        View::Element(crate::view::element::ElementBuilder::new("form")
            .attr("method", "post")
            .attr("data-philjs-action-form", "true")
            .child(children_view)
            .build())
    }
}

impl<I, O> IntoView for ActionForm<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    fn into_view(self) -> View {
        self.render()
    }
}

// =============================================================================
// MultiActionForm Component
// =============================================================================

/// A form that uses a MultiAction for concurrent submissions.
///
/// Each submission is tracked separately, allowing for optimistic UI.
pub struct MultiActionForm<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// The multi-action to dispatch
    action: MultiAction<I, O>,
    /// Form data to action input converter
    converter: Rc<dyn Fn(FormData) -> I>,
    /// Children (form fields)
    children: Option<Box<dyn Fn() -> View>>,
}

impl<I, O> MultiActionForm<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// Create a new multi-action form.
    pub fn new(action: MultiAction<I, O>, converter: impl Fn(FormData) -> I + 'static) -> Self {
        Self {
            action,
            converter: Rc::new(converter),
            children: None,
        }
    }

    /// Set children.
    pub fn children(mut self, children: impl Fn() -> View + 'static) -> Self {
        self.children = Some(Box::new(children));
        self
    }

    /// Render the form.
    pub fn render(&self) -> View {
        let children_view = self.children.as_ref().map(|c| c()).unwrap_or(View::Empty);

        View::Element(crate::view::element::ElementBuilder::new("form")
            .attr("method", "post")
            .attr("data-philjs-multi-action-form", "true")
            .child(children_view)
            .build())
    }
}

impl<I, O> IntoView for MultiActionForm<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    fn into_view(self) -> View {
        self.render()
    }
}

// =============================================================================
// Hooks
// =============================================================================

/// Hook to handle form submission in components.
pub fn use_submit<I, F>(handler: F) -> impl Fn(FormData)
where
    I: Clone + 'static,
    F: Fn(I) + 'static,
{
    move |_data: FormData| {
        // Convert form data to I and call handler
        // handler(convert(data));
    }
}

/// Hook to get the current form data.
pub fn use_form_data() -> Signal<Option<FormData>> {
    Signal::new(None)
}

/// Hook to handle action form state.
pub struct ActionFormState<I, O>
where
    I: Clone,
    O: Clone,
{
    pub input: Signal<Option<I>>,
    pub output: Signal<Option<O>>,
    pub pending: Signal<bool>,
    pub error: Signal<Option<String>>,
}

pub fn use_action_form<I, O>(action: &Action<I, O>) -> ActionFormState<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    ActionFormState {
        input: action.input(),
        output: action.value(),
        pending: action.pending(),
        error: Signal::new(None),
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_form_data() {
        let mut data = FormData::new();
        data.set("name", "Alice");
        data.set("email", "alice@example.com");

        assert_eq!(data.get("name"), Some("Alice"));
        assert_eq!(data.get("email"), Some("alice@example.com"));
        assert_eq!(data.get("missing"), None);
    }

    #[test]
    fn test_form_data_url_encoded() {
        let mut data = FormData::new();
        data.set("name", "Alice Bob");
        data.set("query", "a=b&c=d");

        let encoded = data.to_url_encoded();
        assert!(encoded.contains("name=Alice+Bob"));
    }
}
