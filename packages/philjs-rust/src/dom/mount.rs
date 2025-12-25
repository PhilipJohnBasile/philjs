//! Mounting views to the DOM

use crate::view::{View, IntoView};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use web_sys::{Document, Element, Node, Text};

/// Mount a view to the DOM.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// fn main() {
///     mount(|| view! {
///         <div>
///             <h1>"Hello, PhilJS!"</h1>
///         </div>
///     });
/// }
/// ```
#[cfg(feature = "wasm")]
pub fn mount<F, V>(f: F)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    mount_to_body(f);
}

#[cfg(not(feature = "wasm"))]
pub fn mount<F, V>(_f: F)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    // No-op for SSR
}

/// Mount a view to the document body.
#[cfg(feature = "wasm")]
pub fn mount_to_body<F, V>(f: F)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    let body = document.body().expect("no body");
    mount_to(f, &body);
}

/// Mount a view to a specific element.
#[cfg(feature = "wasm")]
pub fn mount_to<F, V>(f: F, parent: &Element)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    let view = f().into_view();
    render_view(&view, parent);
}

/// Mount a view by element ID.
#[cfg(feature = "wasm")]
pub fn mount_to_id<F, V>(f: F, id: &str)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    let element = document
        .get_element_by_id(id)
        .unwrap_or_else(|| panic!("element with id '{}' not found", id));

    mount_to(f, &element);
}

/// Hydrate a server-rendered view.
#[cfg(feature = "hydration")]
pub fn hydrate<F, V>(f: F)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    hydrate_body(f);
}

#[cfg(feature = "hydration")]
pub fn hydrate_body<F, V>(f: F)
where
    F: FnOnce() -> V + 'static,
    V: IntoView,
{
    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    let body = document.body().expect("no body");

    // TODO: Implement hydration logic
    // For now, clear and render
    body.set_inner_html("");
    mount_to(f, &body);
}

/// Render a view to a parent element.
#[cfg(feature = "wasm")]
fn render_view(view: &View, parent: &Element) {
    let document = web_sys::window()
        .expect("no window")
        .document()
        .expect("no document");

    match view {
        View::Element(el) => {
            let element = document
                .create_element(el.tag())
                .expect("failed to create element");

            // Set attributes
            for (key, value) in el.get_attrs() {
                element
                    .set_attribute(key, value)
                    .expect("failed to set attribute");
            }

            // Render children
            for child in el.get_children() {
                render_view(child, &element);
            }

            parent.append_child(&element).expect("failed to append");
        }
        View::Text(text) => {
            let node = document.create_text_node(text.content());
            parent.append_child(&node).expect("failed to append text");
        }
        View::Fragment(frag) => {
            for child in frag.children() {
                render_view(child, parent);
            }
        }
        View::Dynamic(dyn_) => {
            let current = dyn_.render();
            render_view(&current, parent);
        }
        View::Empty => {}
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen(start)]
pub fn wasm_main() {
    // Entry point for WASM module
    // Users should call mount() in their own main
}
