//! View macro tests

use philjs_macros::view;

// Mock PhilJS view types for testing
mod philjs {
    #[derive(Debug, Clone, PartialEq)]
    pub enum View {
        Element {
            tag: String,
            attrs: Vec<(String, String)>,
            children: Vec<View>,
        },
        Text(String),
        Fragment(Vec<View>),
    }

    pub fn element(tag: &str) -> ElementBuilder {
        ElementBuilder {
            tag: tag.to_string(),
            attrs: Vec::new(),
            children: Vec::new(),
        }
    }

    pub fn text(content: &str) -> View {
        View::Text(content.to_string())
    }

    pub fn fragment(children: Vec<View>) -> View {
        View::Fragment(children)
    }

    pub struct ElementBuilder {
        tag: String,
        attrs: Vec<(String, String)>,
        children: Vec<View>,
    }

    impl ElementBuilder {
        pub fn attr(mut self, (key, value): (&str, impl ToString)) -> Self {
            self.attrs.push((key.to_string(), value.to_string()));
            self
        }

        pub fn child(mut self, child: View) -> Self {
            self.children.push(child);
            self
        }
    }

    impl From<ElementBuilder> for View {
        fn from(builder: ElementBuilder) -> Self {
            View::Element {
                tag: builder.tag,
                attrs: builder.attrs,
                children: builder.children,
            }
        }
    }

    pub trait IntoView {
        fn into_view(self) -> View;
    }

    impl IntoView for View {
        fn into_view(self) -> View {
            self
        }
    }

    impl IntoView for String {
        fn into_view(self) -> View {
            View::Text(self)
        }
    }

    impl IntoView for &str {
        fn into_view(self) -> View {
            View::Text(self.to_string())
        }
    }

    impl IntoView for i32 {
        fn into_view(self) -> View {
            View::Text(self.to_string())
        }
    }
}

#[test]
fn test_simple_element() {
    let result = view! {
        <div />
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "div".to_string(),
            attrs: vec![],
            children: vec![],
        }
    );
}

#[test]
fn test_element_with_text() {
    let result = view! {
        <p>"Hello, World!"</p>
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "p".to_string(),
            attrs: vec![],
            children: vec![philjs::View::Text("Hello, World!".to_string())],
        }
    );
}

#[test]
fn test_element_with_attributes() {
    let result = view! {
        <div class="container" id="main" />
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "div".to_string(),
            attrs: vec![
                ("class".to_string(), "container".to_string()),
                ("id".to_string(), "main".to_string()),
            ],
            children: vec![],
        }
    );
}

#[test]
fn test_nested_elements() {
    let result = view! {
        <div>
            <h1>"Title"</h1>
            <p>"Description"</p>
        </div>
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "div".to_string(),
            attrs: vec![],
            children: vec![
                philjs::View::Element {
                    tag: "h1".to_string(),
                    attrs: vec![],
                    children: vec![philjs::View::Text("Title".to_string())],
                },
                philjs::View::Element {
                    tag: "p".to_string(),
                    attrs: vec![],
                    children: vec![philjs::View::Text("Description".to_string())],
                }
            ],
        }
    );
}

#[test]
fn test_expression_in_view() {
    let name = "Alice";
    let result = view! {
        <p>{name}</p>
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "p".to_string(),
            attrs: vec![],
            children: vec![philjs::View::Text("Alice".to_string())],
        }
    );
}

#[test]
fn test_expression_in_attribute() {
    let class_name = "container";
    let result = view! {
        <div class={class_name} />
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "div".to_string(),
            attrs: vec![("class".to_string(), "container".to_string())],
            children: vec![],
        }
    );
}

#[test]
fn test_namespaced_attributes() {
    let result = view! {
        <button on:click="handleClick" />
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "button".to_string(),
            attrs: vec![("on:click".to_string(), "handleClick".to_string())],
            children: vec![],
        }
    );
}

#[test]
fn test_fragment() {
    let result = view! {
        <div>"First"</div>
        <div>"Second"</div>
    };

    assert_eq!(
        result,
        philjs::View::Fragment(vec![
            philjs::View::Element {
                tag: "div".to_string(),
                attrs: vec![],
                children: vec![philjs::View::Text("First".to_string())],
            },
            philjs::View::Element {
                tag: "div".to_string(),
                attrs: vec![],
                children: vec![philjs::View::Text("Second".to_string())],
            },
        ])
    );
}

#[test]
fn test_complex_nested_structure() {
    let title = "My App";
    let items = vec!["Item 1", "Item 2", "Item 3"];

    let result = view! {
        <div class="app">
            <header>
                <h1>{title}</h1>
            </header>
            <main>
                <ul>
                    {items.iter().map(|item| view! {
                        <li>{item}</li>
                    }).collect::<Vec<_>>()}
                </ul>
            </main>
        </div>
    };

    // Just verify it compiles and has the right structure
    match result {
        philjs::View::Element { tag, .. } => assert_eq!(tag, "div"),
        _ => panic!("Expected element"),
    }
}

#[test]
fn test_boolean_attribute() {
    let result = view! {
        <input disabled />
    };

    assert_eq!(
        result,
        philjs::View::Element {
            tag: "input".to_string(),
            attrs: vec![("disabled".to_string(), "true".to_string())],
            children: vec![],
        }
    );
}
