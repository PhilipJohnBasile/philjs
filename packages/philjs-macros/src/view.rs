//! Enhanced View macro implementation
//!
//! Provides JSX-like syntax that compiles to efficient PhilJS render calls.
//! Supports advanced features like event handlers, control flow, spread attributes,
//! and conditional rendering - inspired by Leptos and SolidJS.

use proc_macro::TokenStream;
use proc_macro2::{TokenStream as TokenStream2, Span, Ident as Ident2};
use quote::{quote, format_ident};
use syn::{
    parse::{Parse, ParseStream},
    punctuated::Punctuated,
    token::{Brace, Colon, Gt, Lt, Slash},
    Expr, Ident, LitStr, Result, Token, ExprClosure, Pat, Type,
};

// ============================================================================
// AST Nodes
// ============================================================================

/// Root parse tree for the view! macro
pub struct ViewMacroInput {
    pub nodes: Vec<ViewNode>,
}

/// A node in the view tree
pub enum ViewNode {
    /// HTML/Component element: `<div>...</div>`
    Element(Element),
    /// Text literal: `"Hello"`
    Text(LitStr),
    /// Expression block: `{count()}`
    Block(Expr),
    /// Fragment: `<>...</>`
    Fragment(Vec<ViewNode>),
    /// Control flow: `<Show when={condition}>...</Show>`
    Show(ShowNode),
    /// Iteration: `<For each={items} key={|item| item.id}>...</For>`
    For(ForNode),
    /// Match expression: `<Match value={state}>...</Match>`
    Match(MatchNode),
    /// Suspense boundary: `<Suspense fallback={...}>...</Suspense>`
    Suspense(SuspenseNode),
    /// Error boundary: `<ErrorBoundary fallback={...}>...</ErrorBoundary>`
    ErrorBoundary(ErrorBoundaryNode),
    /// Portal: `<Portal mount={...}>...</Portal>`
    Portal(PortalNode),
    /// Slot: `<Slot name="header" />`
    Slot(SlotNode),
    /// Dynamic component: `<Dynamic component={comp}>...</Dynamic>`
    Dynamic(DynamicNode),
}

/// An HTML element or component
pub struct Element {
    pub name: ElementName,
    pub attributes: Vec<Attribute>,
    pub children: Vec<ViewNode>,
    pub self_closing: bool,
}

/// Element name - can be lowercase (HTML) or PascalCase (component)
pub enum ElementName {
    /// HTML element: `div`, `span`, etc.
    Html(Ident),
    /// Component: `MyComponent`, etc.
    Component(Ident),
    /// Namespaced: `svg:circle`, etc.
    Namespaced { namespace: Ident, name: Ident },
}

/// An attribute on an element
pub struct Attribute {
    pub kind: AttributeKind,
}

/// Different kinds of attributes
pub enum AttributeKind {
    /// Simple attribute: `class="foo"`
    Simple { name: Ident, value: Option<Expr> },
    /// Namespaced attribute: `on:click={handler}`
    Event { event: Ident, handler: Expr, options: EventOptions },
    /// Two-way binding: `bind:value={signal}`
    Bind { property: Ident, signal: Expr },
    /// Class directive: `class:active={is_active}`
    ClassDirective { class_name: Ident, condition: Expr },
    /// Style directive: `style:color={color}`
    StyleDirective { property: Ident, value: Expr },
    /// Property (not attribute): `prop:value={val}`
    Property { name: Ident, value: Expr },
    /// Reference: `ref={node_ref}`
    Ref(Expr),
    /// Spread: `{..props}`
    Spread(Expr),
    /// Use directive: `use:directive={param}`
    Use { directive: Ident, param: Option<Expr> },
    /// Transition: `transition:fade`
    Transition { name: Ident, params: Option<Expr> },
    /// Animation: `animate:flip`
    Animate { name: Ident, params: Option<Expr> },
}

/// Event handler options
#[derive(Default)]
pub struct EventOptions {
    pub prevent_default: bool,
    pub stop_propagation: bool,
    pub capture: bool,
    pub passive: bool,
    pub once: bool,
}

/// Show control flow node
pub struct ShowNode {
    pub condition: Expr,
    pub children: Vec<ViewNode>,
    pub fallback: Option<Vec<ViewNode>>,
}

/// For loop node
pub struct ForNode {
    pub each: Expr,
    pub key: Option<Expr>,
    pub item_pat: Pat,
    pub children: Vec<ViewNode>,
}

/// Match expression node
pub struct MatchNode {
    pub value: Expr,
    pub arms: Vec<MatchArm>,
}

pub struct MatchArm {
    pub pattern: Pat,
    pub guard: Option<Expr>,
    pub body: Vec<ViewNode>,
}

/// Suspense boundary node
pub struct SuspenseNode {
    pub fallback: Option<Expr>,
    pub children: Vec<ViewNode>,
}

/// Error boundary node
pub struct ErrorBoundaryNode {
    pub fallback: Expr,
    pub children: Vec<ViewNode>,
}

/// Portal node
pub struct PortalNode {
    pub mount: Expr,
    pub children: Vec<ViewNode>,
}

/// Slot node
pub struct SlotNode {
    pub name: Option<String>,
    pub fallback: Option<Vec<ViewNode>>,
}

/// Dynamic component node
pub struct DynamicNode {
    pub component: Expr,
    pub props: Vec<Attribute>,
    pub children: Vec<ViewNode>,
}

// ============================================================================
// Parsing
// ============================================================================

impl Parse for ViewMacroInput {
    fn parse(input: ParseStream) -> Result<Self> {
        let mut nodes = Vec::new();
        while !input.is_empty() {
            nodes.push(input.parse()?);
        }
        Ok(ViewMacroInput { nodes })
    }
}

impl Parse for ViewNode {
    fn parse(input: ParseStream) -> Result<Self> {
        if input.peek(Lt) {
            // Check for fragment <>
            if input.peek2(Gt) {
                return parse_fragment(input);
            }

            // Look ahead to determine element type
            let fork = input.fork();
            fork.parse::<Lt>()?;
            let name: Ident = fork.parse()?;
            let name_str = name.to_string();

            // Check for special control flow elements
            match name_str.as_str() {
                "Show" => return Ok(ViewNode::Show(input.parse()?)),
                "For" => return Ok(ViewNode::For(input.parse()?)),
                "Match" => return Ok(ViewNode::Match(input.parse()?)),
                "Suspense" => return Ok(ViewNode::Suspense(input.parse()?)),
                "ErrorBoundary" => return Ok(ViewNode::ErrorBoundary(input.parse()?)),
                "Portal" => return Ok(ViewNode::Portal(input.parse()?)),
                "Slot" => return Ok(ViewNode::Slot(input.parse()?)),
                "Dynamic" => return Ok(ViewNode::Dynamic(input.parse()?)),
                _ => {}
            }

            // Regular element
            Ok(ViewNode::Element(input.parse()?))
        } else if input.peek(syn::LitStr) {
            Ok(ViewNode::Text(input.parse()?))
        } else if input.peek(Brace) {
            let content;
            syn::braced!(content in input);
            Ok(ViewNode::Block(content.parse()?))
        } else {
            Err(input.error("Expected element, text, or expression block"))
        }
    }
}

fn parse_fragment(input: ParseStream) -> Result<ViewNode> {
    input.parse::<Lt>()?;
    input.parse::<Gt>()?;

    let mut children = Vec::new();
    while !input.peek(Lt) || !input.peek2(Slash) {
        if input.is_empty() {
            return Err(input.error("Unclosed fragment"));
        }
        children.push(input.parse()?);
    }

    // Parse closing </>
    input.parse::<Lt>()?;
    input.parse::<Slash>()?;
    input.parse::<Gt>()?;

    Ok(ViewNode::Fragment(children))
}

impl Parse for Element {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let name = input.parse()?;

        let mut attributes = Vec::new();
        while !input.peek(Gt) && !input.peek(Slash) {
            attributes.push(input.parse()?);
        }

        let self_closing = if input.peek(Slash) {
            input.parse::<Slash>()?;
            input.parse::<Gt>()?;
            true
        } else {
            input.parse::<Gt>()?;
            false
        };

        let mut children = Vec::new();
        if !self_closing {
            while !input.peek(Lt) || !input.peek2(Slash) {
                if input.is_empty() {
                    return Err(input.error("Unclosed element"));
                }
                children.push(input.parse()?);
            }

            // Parse closing tag
            input.parse::<Lt>()?;
            input.parse::<Slash>()?;
            let closing_name: ElementName = input.parse()?;

            // Verify matching tags
            if !names_match(&name, &closing_name) {
                return Err(syn::Error::new(
                    Span::call_site(),
                    "Mismatched closing tag",
                ));
            }
            input.parse::<Gt>()?;
        }

        Ok(Element {
            name,
            attributes,
            children,
            self_closing,
        })
    }
}

impl Parse for ElementName {
    fn parse(input: ParseStream) -> Result<Self> {
        let first: Ident = input.parse()?;

        if input.peek(Colon) && !input.peek2(Colon) {
            input.parse::<Colon>()?;
            let second: Ident = input.parse()?;
            Ok(ElementName::Namespaced {
                namespace: first,
                name: second,
            })
        } else {
            let first_char = first.to_string().chars().next().unwrap_or('a');
            if first_char.is_uppercase() {
                Ok(ElementName::Component(first))
            } else {
                Ok(ElementName::Html(first))
            }
        }
    }
}

impl Parse for Attribute {
    fn parse(input: ParseStream) -> Result<Self> {
        // Check for spread: {..props}
        if input.peek(Brace) {
            let content;
            syn::braced!(content in input);
            if content.peek(Token![..]) {
                content.parse::<Token![..]>()?;
                return Ok(Attribute {
                    kind: AttributeKind::Spread(content.parse()?),
                });
            }
            return Err(input.error("Expected spread attribute {..props}"));
        }

        let first: Ident = input.parse()?;

        // Check for namespaced attributes
        if input.peek(Colon) {
            input.parse::<Colon>()?;
            let second: Ident = input.parse()?;
            let namespace = first.to_string();

            match namespace.as_str() {
                "on" => {
                    // Event handler: on:click={handler}
                    let mut options = EventOptions::default();

                    // Check for modifiers: on:click|preventDefault|stopPropagation
                    while input.peek(Token![|]) {
                        input.parse::<Token![|]>()?;
                        let modifier: Ident = input.parse()?;
                        match modifier.to_string().as_str() {
                            "preventDefault" => options.prevent_default = true,
                            "stopPropagation" => options.stop_propagation = true,
                            "capture" => options.capture = true,
                            "passive" => options.passive = true,
                            "once" => options.once = true,
                            _ => return Err(syn::Error::new(modifier.span(), "Unknown event modifier")),
                        }
                    }

                    input.parse::<Token![=]>()?;
                    let handler = parse_attr_value(input)?;

                    return Ok(Attribute {
                        kind: AttributeKind::Event { event: second, handler, options },
                    });
                }
                "bind" => {
                    // Two-way binding: bind:value={signal}
                    input.parse::<Token![=]>()?;
                    let signal = parse_attr_value(input)?;
                    return Ok(Attribute {
                        kind: AttributeKind::Bind { property: second, signal },
                    });
                }
                "class" => {
                    // Class directive: class:active={condition}
                    input.parse::<Token![=]>()?;
                    let condition = parse_attr_value(input)?;
                    return Ok(Attribute {
                        kind: AttributeKind::ClassDirective { class_name: second, condition },
                    });
                }
                "style" => {
                    // Style directive: style:color={value}
                    input.parse::<Token![=]>()?;
                    let value = parse_attr_value(input)?;
                    return Ok(Attribute {
                        kind: AttributeKind::StyleDirective { property: second, value },
                    });
                }
                "prop" => {
                    // Property: prop:value={val}
                    input.parse::<Token![=]>()?;
                    let value = parse_attr_value(input)?;
                    return Ok(Attribute {
                        kind: AttributeKind::Property { name: second, value },
                    });
                }
                "use" => {
                    // Use directive: use:tooltip={options}
                    let param = if input.peek(Token![=]) {
                        input.parse::<Token![=]>()?;
                        Some(parse_attr_value(input)?)
                    } else {
                        None
                    };
                    return Ok(Attribute {
                        kind: AttributeKind::Use { directive: second, param },
                    });
                }
                "ref" => {
                    input.parse::<Token![=]>()?;
                    let value = parse_attr_value(input)?;
                    return Ok(Attribute {
                        kind: AttributeKind::Ref(value),
                    });
                }
                "transition" => {
                    let params = if input.peek(Token![=]) {
                        input.parse::<Token![=]>()?;
                        Some(parse_attr_value(input)?)
                    } else {
                        None
                    };
                    return Ok(Attribute {
                        kind: AttributeKind::Transition { name: second, params },
                    });
                }
                "animate" => {
                    let params = if input.peek(Token![=]) {
                        input.parse::<Token![=]>()?;
                        Some(parse_attr_value(input)?)
                    } else {
                        None
                    };
                    return Ok(Attribute {
                        kind: AttributeKind::Animate { name: second, params },
                    });
                }
                _ => {
                    return Err(syn::Error::new(first.span(), format!("Unknown attribute namespace: {}", namespace)));
                }
            }
        }

        // Handle ref shorthand
        if first.to_string() == "ref" {
            input.parse::<Token![=]>()?;
            let value = parse_attr_value(input)?;
            return Ok(Attribute {
                kind: AttributeKind::Ref(value),
            });
        }

        // Simple attribute
        let value = if input.peek(Token![=]) {
            input.parse::<Token![=]>()?;
            Some(parse_attr_value(input)?)
        } else {
            None
        };

        Ok(Attribute {
            kind: AttributeKind::Simple { name: first, value },
        })
    }
}

fn parse_attr_value(input: ParseStream) -> Result<Expr> {
    if input.peek(LitStr) {
        let lit: LitStr = input.parse()?;
        syn::parse_str(&format!("\"{}\"", lit.value()))
    } else if input.peek(Brace) {
        let content;
        syn::braced!(content in input);
        content.parse()
    } else {
        Err(input.error("Expected string literal or expression block"))
    }
}

fn names_match(a: &ElementName, b: &ElementName) -> bool {
    match (a, b) {
        (ElementName::Html(a), ElementName::Html(b)) => a == b,
        (ElementName::Component(a), ElementName::Component(b)) => a == b,
        (ElementName::Namespaced { namespace: ns1, name: n1 }, ElementName::Namespaced { namespace: ns2, name: n2 }) => {
            ns1 == ns2 && n1 == n2
        }
        _ => false,
    }
}

// Parse Show control flow
impl Parse for ShowNode {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?; // "Show"

        // Parse when attribute
        let mut condition = None;
        let mut fallback = None;

        while !input.peek(Gt) && !input.peek(Slash) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let value = parse_attr_value(input)?;

            match attr_name.to_string().as_str() {
                "when" => condition = Some(value),
                "fallback" => {
                    // For fallback, we'd need to parse a closure that returns view
                    // For now, store the expression
                }
                _ => {}
            }
        }

        let condition = condition.ok_or_else(|| input.error("Show requires 'when' attribute"))?;

        input.parse::<Gt>()?;

        // Parse children
        let mut children = Vec::new();
        while !input.peek(Lt) || !input.peek2(Slash) {
            if input.is_empty() {
                return Err(input.error("Unclosed Show element"));
            }
            children.push(input.parse()?);
        }

        // Parse closing tag
        input.parse::<Lt>()?;
        input.parse::<Slash>()?;
        let _closing: Ident = input.parse()?;
        input.parse::<Gt>()?;

        Ok(ShowNode {
            condition,
            children,
            fallback: None,
        })
    }
}

// Parse For loop
impl Parse for ForNode {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?; // "For"

        let mut each = None;
        let mut key = None;

        while !input.peek(Gt) && !input.peek(Slash) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let value = parse_attr_value(input)?;

            match attr_name.to_string().as_str() {
                "each" => each = Some(value),
                "key" => key = Some(value),
                _ => {}
            }
        }

        let each = each.ok_or_else(|| input.error("For requires 'each' attribute"))?;

        input.parse::<Gt>()?;

        // Parse children (expecting a closure pattern)
        let mut children = Vec::new();
        while !input.peek(Lt) || !input.peek2(Slash) {
            if input.is_empty() {
                return Err(input.error("Unclosed For element"));
            }
            children.push(input.parse()?);
        }

        // Parse closing tag
        input.parse::<Lt>()?;
        input.parse::<Slash>()?;
        let _closing: Ident = input.parse()?;
        input.parse::<Gt>()?;

        Ok(ForNode {
            each,
            key,
            item_pat: syn::parse_quote!(item),
            children,
        })
    }
}

// Match node implementation with proper arm parsing
impl Parse for MatchNode {
    fn parse(input: ParseStream) -> Result<Self> {
        // Parse <Match value={...}>
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?;

        let mut value = None;
        while !input.peek(Gt) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let attr_value = parse_attr_value(input)?;
            if attr_name == "value" {
                value = Some(attr_value);
            }
        }
        input.parse::<Gt>()?;

        // Parse match arms as <Arm pattern={...}>...</Arm> elements
        let mut arms = Vec::new();
        while !input.peek(Lt) || !input.peek2(Slash) {
            if input.is_empty() {
                return Err(input.error("Unclosed Match"));
            }

            // Try to parse as Arm element
            if input.peek(Lt) {
                let fork = input.fork();
                fork.parse::<Lt>()?;
                if let Ok(name) = fork.parse::<Ident>() {
                    if name == "Arm" {
                        // Parse the Arm element
                        input.parse::<Lt>()?;
                        let _arm_name: Ident = input.parse()?;

                        let mut pattern: Option<Pat> = None;
                        let mut guard: Option<Expr> = None;

                        while !input.peek(Gt) && !input.peek(Slash) {
                            let attr_name: Ident = input.parse()?;
                            input.parse::<Token![=]>()?;

                            if attr_name == "pattern" {
                                // Parse pattern as expression, then convert
                                let content;
                                syn::braced!(content in input);
                                pattern = Some(content.parse()?);
                            } else if attr_name == "when" || attr_name == "guard" {
                                guard = Some(parse_attr_value(input)?);
                            } else {
                                // Skip unknown attributes
                                let _: Expr = parse_attr_value(input)?;
                            }
                        }

                        let self_closing = input.peek(Slash);
                        if self_closing {
                            input.parse::<Slash>()?;
                        }
                        input.parse::<Gt>()?;

                        let mut body = Vec::new();
                        if !self_closing {
                            while !input.peek(Lt) || !input.peek2(Slash) {
                                if input.is_empty() {
                                    return Err(input.error("Unclosed Arm"));
                                }
                                body.push(input.parse()?);
                            }
                            input.parse::<Lt>()?;
                            input.parse::<Slash>()?;
                            let _: Ident = input.parse()?;
                            input.parse::<Gt>()?;
                        }

                        arms.push(MatchArm {
                            pattern: pattern.unwrap_or_else(|| syn::parse_quote!(_)),
                            guard,
                            body,
                        });
                        continue;
                    }
                }
            }

            // Not an Arm, skip this child
            let _: ViewNode = input.parse()?;
        }

        input.parse::<Lt>()?;
        input.parse::<Slash>()?;
        let _: Ident = input.parse()?;
        input.parse::<Gt>()?;

        Ok(MatchNode {
            value: value.unwrap_or_else(|| syn::parse_quote!(())),
            arms,
        })
    }
}

impl Parse for SuspenseNode {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?;

        let mut fallback = None;
        while !input.peek(Gt) && !input.peek(Slash) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let value = parse_attr_value(input)?;
            if attr_name == "fallback" {
                fallback = Some(value);
            }
        }

        let self_closing = input.peek(Slash);
        if self_closing {
            input.parse::<Slash>()?;
        }
        input.parse::<Gt>()?;

        let mut children = Vec::new();
        if !self_closing {
            while !input.peek(Lt) || !input.peek2(Slash) {
                if input.is_empty() {
                    return Err(input.error("Unclosed Suspense"));
                }
                children.push(input.parse()?);
            }
            input.parse::<Lt>()?;
            input.parse::<Slash>()?;
            let _: Ident = input.parse()?;
            input.parse::<Gt>()?;
        }

        Ok(SuspenseNode { fallback, children })
    }
}

impl Parse for ErrorBoundaryNode {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?;

        let mut fallback = None;
        while !input.peek(Gt) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let value = parse_attr_value(input)?;
            if attr_name == "fallback" {
                fallback = Some(value);
            }
        }
        input.parse::<Gt>()?;

        let mut children = Vec::new();
        while !input.peek(Lt) || !input.peek2(Slash) {
            if input.is_empty() {
                return Err(input.error("Unclosed ErrorBoundary"));
            }
            children.push(input.parse()?);
        }

        input.parse::<Lt>()?;
        input.parse::<Slash>()?;
        let _: Ident = input.parse()?;
        input.parse::<Gt>()?;

        Ok(ErrorBoundaryNode {
            fallback: fallback.unwrap_or_else(|| syn::parse_quote!(|_| "Error")),
            children,
        })
    }
}

impl Parse for PortalNode {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?;

        let mut mount = None;
        while !input.peek(Gt) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let value = parse_attr_value(input)?;
            if attr_name == "mount" {
                mount = Some(value);
            }
        }
        input.parse::<Gt>()?;

        let mut children = Vec::new();
        while !input.peek(Lt) || !input.peek2(Slash) {
            if input.is_empty() {
                return Err(input.error("Unclosed Portal"));
            }
            children.push(input.parse()?);
        }

        input.parse::<Lt>()?;
        input.parse::<Slash>()?;
        let _: Ident = input.parse()?;
        input.parse::<Gt>()?;

        Ok(PortalNode {
            mount: mount.unwrap_or_else(|| syn::parse_quote!(document().body())),
            children,
        })
    }
}

impl Parse for SlotNode {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?;

        let mut slot_name = None;
        while !input.peek(Gt) && !input.peek(Slash) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            if input.peek(LitStr) {
                let lit: LitStr = input.parse()?;
                if attr_name == "name" {
                    slot_name = Some(lit.value());
                }
            } else {
                let _: Expr = parse_attr_value(input)?;
            }
        }

        if input.peek(Slash) {
            input.parse::<Slash>()?;
        }
        input.parse::<Gt>()?;

        Ok(SlotNode {
            name: slot_name,
            fallback: None,
        })
    }
}

impl Parse for DynamicNode {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Lt>()?;
        let _name: Ident = input.parse()?;

        let mut component = None;
        let mut props = Vec::new();

        while !input.peek(Gt) && !input.peek(Slash) {
            let attr_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let value = parse_attr_value(input)?;

            if attr_name == "component" {
                component = Some(value);
            } else {
                props.push(Attribute {
                    kind: AttributeKind::Simple { name: attr_name, value: Some(value) },
                });
            }
        }

        let self_closing = input.peek(Slash);
        if self_closing {
            input.parse::<Slash>()?;
        }
        input.parse::<Gt>()?;

        let mut children = Vec::new();
        if !self_closing {
            while !input.peek(Lt) || !input.peek2(Slash) {
                if input.is_empty() {
                    return Err(input.error("Unclosed Dynamic"));
                }
                children.push(input.parse()?);
            }
            input.parse::<Lt>()?;
            input.parse::<Slash>()?;
            let _: Ident = input.parse()?;
            input.parse::<Gt>()?;
        }

        Ok(DynamicNode {
            component: component.unwrap_or_else(|| syn::parse_quote!(())),
            props,
            children,
        })
    }
}

// ============================================================================
// Code Generation
// ============================================================================

fn codegen_view_node(node: &ViewNode) -> TokenStream2 {
    match node {
        ViewNode::Element(element) => codegen_element(element),
        ViewNode::Text(text) => {
            let value = text.value();
            quote! { philjs::view::text(#value) }
        }
        ViewNode::Block(expr) => {
            quote! { philjs::view::IntoView::into_view(#expr) }
        }
        ViewNode::Fragment(children) => {
            let children: Vec<_> = children.iter().map(codegen_view_node).collect();
            quote! { philjs::view::fragment(vec![#(#children),*]) }
        }
        ViewNode::Show(show) => codegen_show(show),
        ViewNode::For(for_node) => codegen_for(for_node),
        ViewNode::Match(match_node) => codegen_match(match_node),
        ViewNode::Suspense(suspense) => codegen_suspense(suspense),
        ViewNode::ErrorBoundary(eb) => codegen_error_boundary(eb),
        ViewNode::Portal(portal) => codegen_portal(portal),
        ViewNode::Slot(slot) => codegen_slot(slot),
        ViewNode::Dynamic(dynamic) => codegen_dynamic(dynamic),
    }
}

fn codegen_element(element: &Element) -> TokenStream2 {
    let tag = match &element.name {
        ElementName::Html(name) => {
            let tag_name = name.to_string();
            quote! { philjs::view::element(#tag_name) }
        }
        ElementName::Component(name) => {
            quote! { #name }
        }
        ElementName::Namespaced { namespace, name } => {
            let ns = namespace.to_string();
            let tag = name.to_string();
            quote! { philjs::view::element_ns(#ns, #tag) }
        }
    };

    let attrs: Vec<_> = element.attributes.iter().map(codegen_attribute).collect();
    let children: Vec<_> = element.children.iter().map(codegen_view_node).collect();

    let is_component = matches!(element.name, ElementName::Component(_));

    if is_component {
        // Component invocation
        let component_name = match &element.name {
            ElementName::Component(name) => name,
            _ => unreachable!(),
        };
        let props_struct = format_ident!("{}Props", component_name);

        let props: Vec<_> = element.attributes.iter().filter_map(|attr| {
            if let AttributeKind::Simple { name, value } = &attr.kind {
                let value = value.as_ref().map(|v| quote!(#v)).unwrap_or(quote!(true));
                Some(quote! { #name: #value })
            } else {
                None
            }
        }).collect();

        // Handle event handlers for components
        let event_handlers: Vec<_> = element.attributes.iter().filter_map(|attr| {
            if let AttributeKind::Event { event, handler, .. } = &attr.kind {
                let handler_name = format_ident!("on_{}", event);
                Some(quote! { #handler_name: Some(Box::new(#handler)) })
            } else {
                None
            }
        }).collect();

        let all_props: Vec<_> = props.into_iter().chain(event_handlers.into_iter()).collect();

        if children.is_empty() {
            if all_props.is_empty() {
                // No props, use Default or empty struct
                quote! {
                    #component_name(#props_struct::default())
                }
            } else {
                quote! {
                    #component_name(#props_struct {
                        #(#all_props),*
                        ..Default::default()
                    })
                }
            }
        } else {
            quote! {
                #component_name(#props_struct {
                    #(#all_props,)*
                    children: Some(Box::new(|| philjs::view::fragment(vec![#(#children),*]))),
                    ..Default::default()
                })
            }
        }
    } else {
        // HTML element
        if element.self_closing {
            quote! {
                #tag
                    #(#attrs)*
            }
        } else {
            quote! {
                #tag
                    #(#attrs)*
                    #(.child(#children))*
            }
        }
    }
}

fn codegen_attribute(attr: &Attribute) -> TokenStream2 {
    match &attr.kind {
        AttributeKind::Simple { name, value } => {
            let attr_name = name.to_string();
            if let Some(val) = value {
                quote! { .attr(#attr_name, #val) }
            } else {
                quote! { .attr(#attr_name, true) }
            }
        }
        AttributeKind::Event { event, handler, options } => {
            let event_name = event.to_string();
            let mut modifiers = Vec::new();

            if options.prevent_default {
                modifiers.push(quote! { .prevent_default() });
            }
            if options.stop_propagation {
                modifiers.push(quote! { .stop_propagation() });
            }
            if options.capture {
                modifiers.push(quote! { .capture() });
            }
            if options.passive {
                modifiers.push(quote! { .passive() });
            }
            if options.once {
                modifiers.push(quote! { .once() });
            }

            quote! {
                .on(#event_name, #handler)
                #(#modifiers)*
            }
        }
        AttributeKind::Bind { property, signal } => {
            let prop_name = property.to_string();
            quote! { .bind(#prop_name, #signal) }
        }
        AttributeKind::ClassDirective { class_name, condition } => {
            let class = class_name.to_string();
            quote! { .class_signal(#class, move || #condition) }
        }
        AttributeKind::StyleDirective { property, value } => {
            let prop = property.to_string();
            quote! { .style_signal(#prop, move || #value) }
        }
        AttributeKind::Property { name, value } => {
            let prop_name = name.to_string();
            quote! { .prop(#prop_name, #value) }
        }
        AttributeKind::Ref(expr) => {
            quote! { .node_ref(#expr) }
        }
        AttributeKind::Spread(expr) => {
            quote! { .spread(#expr) }
        }
        AttributeKind::Use { directive, param } => {
            if let Some(p) = param {
                quote! { .use_directive(#directive, #p) }
            } else {
                quote! { .use_directive(#directive, ()) }
            }
        }
        AttributeKind::Transition { name, params } => {
            let trans_name = name.to_string();
            if let Some(p) = params {
                quote! { .transition(#trans_name, #p) }
            } else {
                quote! { .transition(#trans_name, Default::default()) }
            }
        }
        AttributeKind::Animate { name, params } => {
            let anim_name = name.to_string();
            if let Some(p) = params {
                quote! { .animate(#anim_name, #p) }
            } else {
                quote! { .animate(#anim_name, Default::default()) }
            }
        }
    }
}

fn codegen_show(show: &ShowNode) -> TokenStream2 {
    let condition = &show.condition;
    let children: Vec<_> = show.children.iter().map(codegen_view_node).collect();

    if let Some(fallback) = &show.fallback {
        let fallback_children: Vec<_> = fallback.iter().map(codegen_view_node).collect();
        quote! {
            philjs::view::Show::new(
                move || #condition,
                || philjs::view::fragment(vec![#(#children),*]),
                || philjs::view::fragment(vec![#(#fallback_children),*]),
            )
        }
    } else {
        quote! {
            philjs::view::Show::new(
                move || #condition,
                || philjs::view::fragment(vec![#(#children),*]),
                || philjs::view::empty(),
            )
        }
    }
}

fn codegen_for(for_node: &ForNode) -> TokenStream2 {
    let each = &for_node.each;
    let children: Vec<_> = for_node.children.iter().map(codegen_view_node).collect();

    if let Some(key) = &for_node.key {
        quote! {
            philjs::view::For::new(
                move || #each,
                #key,
                |item| philjs::view::fragment(vec![#(#children),*]),
            )
        }
    } else {
        quote! {
            philjs::view::For::new(
                move || #each,
                |item| item.clone(),
                |item| philjs::view::fragment(vec![#(#children),*]),
            )
        }
    }
}

fn codegen_match(match_node: &MatchNode) -> TokenStream2 {
    let value = &match_node.value;

    if match_node.arms.is_empty() {
        // Fallback for empty match - render empty view
        quote! {
            philjs::view::Dynamic::new(move || {
                match #value {
                    _ => philjs::view::empty()
                }
            })
        }
    } else {
        // Generate proper match arms
        let arms: Vec<_> = match_node.arms.iter().map(|arm| {
            let pattern = &arm.pattern;
            let body: Vec<_> = arm.body.iter().map(codegen_view_node).collect();

            let view_body = if body.is_empty() {
                quote! { philjs::view::empty() }
            } else if body.len() == 1 {
                quote! { #(#body)* }
            } else {
                quote! { philjs::view::fragment(vec![#(#body),*]) }
            };

            if let Some(guard) = &arm.guard {
                quote! {
                    #pattern if #guard => #view_body
                }
            } else {
                quote! {
                    #pattern => #view_body
                }
            }
        }).collect();

        quote! {
            philjs::view::Dynamic::new(move || {
                match #value {
                    #(#arms,)*
                }
            })
        }
    }
}

fn codegen_suspense(suspense: &SuspenseNode) -> TokenStream2 {
    let children: Vec<_> = suspense.children.iter().map(codegen_view_node).collect();

    if let Some(fallback) = &suspense.fallback {
        quote! {
            philjs::view::Suspense::new(
                || #fallback,
                || philjs::view::fragment(vec![#(#children),*]),
            )
        }
    } else {
        quote! {
            philjs::view::Suspense::new(
                || philjs::view::text("Loading..."),
                || philjs::view::fragment(vec![#(#children),*]),
            )
        }
    }
}

fn codegen_error_boundary(eb: &ErrorBoundaryNode) -> TokenStream2 {
    let fallback = &eb.fallback;
    let children: Vec<_> = eb.children.iter().map(codegen_view_node).collect();

    quote! {
        philjs::view::ErrorBoundary::new(
            #fallback,
            || philjs::view::fragment(vec![#(#children),*]),
        )
    }
}

fn codegen_portal(portal: &PortalNode) -> TokenStream2 {
    let mount = &portal.mount;
    let children: Vec<_> = portal.children.iter().map(codegen_view_node).collect();

    quote! {
        philjs::view::Portal::new(
            #mount,
            || philjs::view::fragment(vec![#(#children),*]),
        )
    }
}

fn codegen_slot(slot: &SlotNode) -> TokenStream2 {
    if let Some(name) = &slot.name {
        quote! { philjs::view::Slot::named(#name) }
    } else {
        quote! { philjs::view::Slot::default() }
    }
}

fn codegen_dynamic(dynamic: &DynamicNode) -> TokenStream2 {
    let component = &dynamic.component;
    let children: Vec<_> = dynamic.children.iter().map(codegen_view_node).collect();

    quote! {
        philjs::view::Dynamic::new(
            move || #component,
            || philjs::view::fragment(vec![#(#children),*]),
        )
    }
}

// ============================================================================
// Public API
// ============================================================================

/// Implementation of the view! macro
pub fn view_impl(input: TokenStream) -> TokenStream {
    let input = syn::parse_macro_input!(input as ViewMacroInput);

    let nodes: Vec<_> = input.nodes.iter().map(codegen_view_node).collect();

    let output = if nodes.len() == 1 {
        quote! { #(#nodes)* }
    } else {
        quote! { philjs::view::fragment(vec![#(#nodes),*]) }
    };

    TokenStream::from(output)
}
