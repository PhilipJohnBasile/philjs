//! Native RSX Macro - Zero-overhead Rust syntax for UI
//!
//! This is a lightweight alternative to the view! macro that:
//! - Uses a more Rust-native syntax inspired by Dioxus
//! - Compiles to direct builder calls without intermediate AST
//! - Supports all the same features as view! but with less macro overhead
//! - Provides better IDE support and error messages
//!
//! # Syntax Comparison
//!
//! ```rust,ignore
//! // view! macro (JSX-like)
//! view! {
//!     <div class="container">
//!         <h1>"Hello"</h1>
//!         <button on:click={handler}>"Click"</button>
//!     </div>
//! }
//!
//! // rsx! macro (Rust-native)
//! rsx! {
//!     div { class: "container",
//!         h1 { "Hello" }
//!         button { onclick: handler, "Click" }
//!     }
//! }
//! ```

use proc_macro::TokenStream;
use proc_macro2::{TokenStream as TokenStream2, Span, Ident as Ident2, TokenTree};
use quote::{quote, format_ident, ToTokens};
use syn::{
    parse::{Parse, ParseStream, ParseBuffer},
    punctuated::Punctuated,
    spanned::Spanned,
    Expr, Ident, LitStr, Result, Token, Type, Pat, Block,
    braced, bracketed, parenthesized,
};

// ============================================================================
// AST Types for RSX
// ============================================================================

/// Root of RSX parse tree
pub struct RsxRoot {
    pub children: Vec<RsxNode>,
}

/// A node in the RSX tree
pub enum RsxNode {
    /// Element: `div { ... }`
    Element(RsxElement),
    /// Text literal: `"Hello"`
    Text(LitStr),
    /// Expression: `{some_expr}`
    Expr(Expr),
    /// If expression: `if condition { ... } else { ... }`
    If(RsxIf),
    /// For loop: `for item in items { ... }`
    For(RsxFor),
    /// Match expression: `match value { ... }`
    Match(RsxMatch),
    /// Component: `Component { props... }`
    Component(RsxComponent),
}

/// An element like `div { class: "foo", children... }`
pub struct RsxElement {
    pub name: Ident,
    pub attributes: Vec<RsxAttribute>,
    pub children: Vec<RsxNode>,
    pub key: Option<Expr>,
}

/// An attribute on an element
pub struct RsxAttribute {
    pub name: RsxAttrName,
    pub value: RsxAttrValue,
}

/// Attribute name
pub enum RsxAttrName {
    /// Simple name: `class`
    Simple(Ident),
    /// Event handler: `onclick`
    Event(Ident),
    /// Custom attribute: `data_foo` -> `data-foo`
    Custom(Ident),
}

/// Attribute value
pub enum RsxAttrValue {
    /// Literal string: `"value"`
    Literal(LitStr),
    /// Expression: `{expr}`
    Expr(Expr),
    /// Shorthand: `{variable}` for `variable: variable`
    Shorthand(Ident),
    /// Boolean (attribute present without value)
    Bool,
}

/// If expression in RSX
pub struct RsxIf {
    pub condition: Expr,
    pub then_branch: Vec<RsxNode>,
    pub else_branch: Option<Vec<RsxNode>>,
}

/// For loop in RSX
pub struct RsxFor {
    pub pattern: Pat,
    pub iterable: Expr,
    pub body: Vec<RsxNode>,
    pub key: Option<Expr>,
}

/// Match expression in RSX
pub struct RsxMatch {
    pub expr: Expr,
    pub arms: Vec<RsxMatchArm>,
}

pub struct RsxMatchArm {
    pub pattern: Pat,
    pub guard: Option<Expr>,
    pub body: Vec<RsxNode>,
}

/// A component invocation
pub struct RsxComponent {
    pub name: syn::Path,
    pub props: Vec<RsxProp>,
    pub children: Vec<RsxNode>,
    pub key: Option<Expr>,
}

pub struct RsxProp {
    pub name: Ident,
    pub value: Expr,
}

// ============================================================================
// Parsing
// ============================================================================

impl Parse for RsxRoot {
    fn parse(input: ParseStream) -> Result<Self> {
        let mut children = Vec::new();
        while !input.is_empty() {
            children.push(input.parse()?);
        }
        Ok(RsxRoot { children })
    }
}

impl Parse for RsxNode {
    fn parse(input: ParseStream) -> Result<Self> {
        // Check for text literal
        if input.peek(LitStr) {
            return Ok(RsxNode::Text(input.parse()?));
        }

        // Check for expression block
        if input.peek(syn::token::Brace) && !is_element_ahead(input) {
            let content;
            braced!(content in input);
            return Ok(RsxNode::Expr(content.parse()?));
        }

        // Check for if expression
        if input.peek(Token![if]) {
            return Ok(RsxNode::If(input.parse()?));
        }

        // Check for for loop
        if input.peek(Token![for]) {
            return Ok(RsxNode::For(input.parse()?));
        }

        // Check for match
        if input.peek(Token![match]) {
            return Ok(RsxNode::Match(input.parse()?));
        }

        // Must be an element or component
        let name: Ident = input.parse()?;
        let name_str = name.to_string();
        let first_char = name_str.chars().next().unwrap_or('a');

        if first_char.is_uppercase() {
            // Component
            parse_component(input, name)
        } else {
            // HTML element
            Ok(RsxNode::Element(parse_element(input, name)?))
        }
    }
}

fn is_element_ahead(input: ParseStream) -> bool {
    // Look ahead to see if this is an element (ident { ... })
    let fork = input.fork();
    if fork.peek(Ident) {
        let _ = fork.parse::<Ident>();
        fork.peek(syn::token::Brace)
    } else {
        false
    }
}

fn parse_element(input: ParseStream, name: Ident) -> Result<RsxElement> {
    let content;
    braced!(content in input);

    let mut attributes = Vec::new();
    let mut children = Vec::new();
    let mut key = None;

    while !content.is_empty() {
        // Check for key attribute
        if content.peek(Ident) {
            let fork = content.fork();
            let attr_name: Ident = fork.parse()?;
            if attr_name == "key" && fork.peek(Token![:]) {
                content.parse::<Ident>()?; // consume "key"
                content.parse::<Token![:]>()?;
                key = Some(content.parse()?);
                if content.peek(Token![,]) {
                    content.parse::<Token![,]>()?;
                }
                continue;
            }
        }

        // Check for attribute (name: value) or (name,)
        if content.peek(Ident) && (peek_colon_after_ident(&content) || content.peek2(Token![,])) {
            attributes.push(content.parse()?);
            if content.peek(Token![,]) {
                content.parse::<Token![,]>()?;
            }
        } else {
            // Must be a child
            children.push(content.parse()?);
        }
    }

    Ok(RsxElement {
        name,
        attributes,
        children,
        key,
    })
}

fn peek_colon_after_ident(input: &ParseBuffer) -> bool {
    let fork = input.fork();
    if fork.parse::<Ident>().is_ok() {
        fork.peek(Token![:]) && !fork.peek(Token![::])
    } else {
        false
    }
}

fn parse_component(input: ParseStream, first_ident: Ident) -> Result<RsxNode> {
    // Build the full path (might be multiple segments)
    let mut path_segments = vec![first_ident];

    while input.peek(Token![::]) {
        input.parse::<Token![::]>()?;
        path_segments.push(input.parse()?);
    }

    let content;
    braced!(content in input);

    let mut props = Vec::new();
    let mut children = Vec::new();
    let mut key = None;

    while !content.is_empty() {
        // Check for key
        if content.peek(Ident) {
            let fork = content.fork();
            let prop_name: Ident = fork.parse()?;
            if prop_name == "key" && fork.peek(Token![:]) {
                content.parse::<Ident>()?;
                content.parse::<Token![:]>()?;
                key = Some(content.parse()?);
                if content.peek(Token![,]) {
                    content.parse::<Token![,]>()?;
                }
                continue;
            }
        }

        // Check for prop (name: value)
        if content.peek(Ident) && peek_colon_after_ident(&content) {
            let name: Ident = content.parse()?;
            content.parse::<Token![:]>()?;
            let value: Expr = content.parse()?;
            props.push(RsxProp { name, value });
            if content.peek(Token![,]) {
                content.parse::<Token![,]>()?;
            }
        } else {
            // Must be a child
            children.push(content.parse()?);
        }
    }

    // Build path
    let path = syn::Path {
        leading_colon: None,
        segments: path_segments
            .into_iter()
            .map(|ident| syn::PathSegment {
                ident,
                arguments: syn::PathArguments::None,
            })
            .collect(),
    };

    Ok(RsxNode::Component(RsxComponent {
        name: path,
        props,
        children,
        key,
    }))
}

impl Parse for RsxAttribute {
    fn parse(input: ParseStream) -> Result<Self> {
        let name: Ident = input.parse()?;
        let name_str = name.to_string();

        // Determine attribute type
        let attr_name = if name_str.starts_with("on") {
            RsxAttrName::Event(name)
        } else if name_str.contains('_') {
            RsxAttrName::Custom(name)
        } else {
            RsxAttrName::Simple(name)
        };

        // Check for value
        let value = if input.peek(Token![:]) {
            input.parse::<Token![:]>()?;
            if input.peek(LitStr) {
                RsxAttrValue::Literal(input.parse()?)
            } else {
                RsxAttrValue::Expr(input.parse()?)
            }
        } else {
            RsxAttrValue::Bool
        };

        Ok(RsxAttribute {
            name: attr_name,
            value,
        })
    }
}

impl Parse for RsxIf {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Token![if]>()?;

        // Parse condition (everything until the brace)
        let condition: Expr = input.parse()?;

        // Parse then branch
        let then_content;
        braced!(then_content in input);
        let mut then_branch = Vec::new();
        while !then_content.is_empty() {
            then_branch.push(then_content.parse()?);
        }

        // Check for else
        let else_branch = if input.peek(Token![else]) {
            input.parse::<Token![else]>()?;
            if input.peek(Token![if]) {
                // else if - wrap in another RsxIf
                let else_if: RsxIf = input.parse()?;
                Some(vec![RsxNode::If(else_if)])
            } else {
                let else_content;
                braced!(else_content in input);
                let mut else_nodes = Vec::new();
                while !else_content.is_empty() {
                    else_nodes.push(else_content.parse()?);
                }
                Some(else_nodes)
            }
        } else {
            None
        };

        Ok(RsxIf {
            condition,
            then_branch,
            else_branch,
        })
    }
}

impl Parse for RsxFor {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Token![for]>()?;
        let pattern: Pat = input.parse()?;
        input.parse::<Token![in]>()?;
        let iterable: Expr = input.parse()?;

        let content;
        braced!(content in input);

        let mut body = Vec::new();
        let mut key = None;

        // Check for key as first attribute
        if content.peek(Ident) {
            let fork = content.fork();
            let maybe_key: Ident = fork.parse()?;
            if maybe_key == "key" && fork.peek(Token![:]) {
                content.parse::<Ident>()?;
                content.parse::<Token![:]>()?;
                key = Some(content.parse()?);
                if content.peek(Token![,]) {
                    content.parse::<Token![,]>()?;
                }
            }
        }

        while !content.is_empty() {
            body.push(content.parse()?);
        }

        Ok(RsxFor {
            pattern,
            iterable,
            body,
            key,
        })
    }
}

impl Parse for RsxMatch {
    fn parse(input: ParseStream) -> Result<Self> {
        input.parse::<Token![match]>()?;
        let expr: Expr = input.parse()?;

        let content;
        braced!(content in input);

        let mut arms = Vec::new();
        while !content.is_empty() {
            arms.push(content.parse()?);
        }

        Ok(RsxMatch { expr, arms })
    }
}

impl Parse for RsxMatchArm {
    fn parse(input: ParseStream) -> Result<Self> {
        let pattern: Pat = input.parse()?;

        let guard = if input.peek(Token![if]) {
            input.parse::<Token![if]>()?;
            Some(input.parse()?)
        } else {
            None
        };

        input.parse::<Token![=>]>()?;

        // Parse body - either a block or single node
        let body = if input.peek(syn::token::Brace) {
            let content;
            braced!(content in input);
            let mut nodes = Vec::new();
            while !content.is_empty() {
                nodes.push(content.parse()?);
            }
            nodes
        } else {
            vec![input.parse()?]
        };

        // Optional comma
        if input.peek(Token![,]) {
            input.parse::<Token![,]>()?;
        }

        Ok(RsxMatchArm {
            pattern,
            guard,
            body,
        })
    }
}

// ============================================================================
// Code Generation
// ============================================================================

fn generate_rsx(root: &RsxRoot) -> TokenStream2 {
    let children: Vec<_> = root.children.iter().map(generate_node).collect();

    if children.len() == 1 {
        quote! { #(#children)* }
    } else {
        quote! { philjs::rsx::fragment([#(#children),*]) }
    }
}

fn generate_node(node: &RsxNode) -> TokenStream2 {
    match node {
        RsxNode::Element(el) => generate_element(el),
        RsxNode::Text(lit) => {
            let text = lit.value();
            quote! { philjs::rsx::text(#text) }
        }
        RsxNode::Expr(expr) => {
            quote! { philjs::rsx::IntoNode::into_node(#expr) }
        }
        RsxNode::If(if_node) => generate_if(if_node),
        RsxNode::For(for_node) => generate_for(for_node),
        RsxNode::Match(match_node) => generate_match(match_node),
        RsxNode::Component(comp) => generate_component(comp),
    }
}

fn generate_element(el: &RsxElement) -> TokenStream2 {
    let tag = el.name.to_string();

    // Generate attributes
    let attrs: Vec<_> = el.attributes.iter().map(|attr| {
        let value = match &attr.value {
            RsxAttrValue::Literal(lit) => quote! { #lit },
            RsxAttrValue::Expr(expr) => quote! { #expr },
            RsxAttrValue::Shorthand(ident) => quote! { #ident },
            RsxAttrValue::Bool => quote! { true },
        };

        match &attr.name {
            RsxAttrName::Simple(name) => {
                let name_str = name.to_string();
                quote! { .attr(#name_str, #value) }
            }
            RsxAttrName::Event(name) => {
                // Convert onclick -> click, onmouseover -> mouseover, etc.
                let event_name = name.to_string();
                let event = event_name.strip_prefix("on").unwrap_or(&event_name);
                quote! { .on(#event, #value) }
            }
            RsxAttrName::Custom(name) => {
                // Convert data_foo -> data-foo
                let attr_name = name.to_string().replace('_', "-");
                quote! { .attr(#attr_name, #value) }
            }
        }
    }).collect();

    // Generate children
    let children: Vec<_> = el.children.iter().map(generate_node).collect();

    // Generate key if present
    let key_attr = el.key.as_ref().map(|k| {
        quote! { .key(#k) }
    });

    if children.is_empty() {
        quote! {
            philjs::rsx::element(#tag)
                #(#attrs)*
                #key_attr
        }
    } else {
        quote! {
            philjs::rsx::element(#tag)
                #(#attrs)*
                #key_attr
                .children([#(#children),*])
        }
    }
}

fn generate_if(if_node: &RsxIf) -> TokenStream2 {
    let condition = &if_node.condition;
    let then_children: Vec<_> = if_node.then_branch.iter().map(generate_node).collect();

    if let Some(else_branch) = &if_node.else_branch {
        let else_children: Vec<_> = else_branch.iter().map(generate_node).collect();
        quote! {
            if #condition {
                philjs::rsx::fragment([#(#then_children),*])
            } else {
                philjs::rsx::fragment([#(#else_children),*])
            }
        }
    } else {
        quote! {
            if #condition {
                philjs::rsx::fragment([#(#then_children),*])
            } else {
                philjs::rsx::empty()
            }
        }
    }
}

fn generate_for(for_node: &RsxFor) -> TokenStream2 {
    let pattern = &for_node.pattern;
    let iterable = &for_node.iterable;
    let body: Vec<_> = for_node.body.iter().map(generate_node).collect();

    if let Some(key) = &for_node.key {
        quote! {
            philjs::rsx::For::new(
                move || #iterable,
                #key,
                |#pattern| philjs::rsx::fragment([#(#body),*])
            )
        }
    } else {
        quote! {
            philjs::rsx::For::new(
                move || #iterable,
                |item| item.clone(),
                |#pattern| philjs::rsx::fragment([#(#body),*])
            )
        }
    }
}

fn generate_match(match_node: &RsxMatch) -> TokenStream2 {
    let expr = &match_node.expr;
    let arms: Vec<_> = match_node.arms.iter().map(|arm| {
        let pattern = &arm.pattern;
        let body: Vec<_> = arm.body.iter().map(generate_node).collect();

        if let Some(guard) = &arm.guard {
            quote! {
                #pattern if #guard => philjs::rsx::fragment([#(#body),*])
            }
        } else {
            quote! {
                #pattern => philjs::rsx::fragment([#(#body),*])
            }
        }
    }).collect();

    quote! {
        match #expr {
            #(#arms),*
        }
    }
}

fn generate_component(comp: &RsxComponent) -> TokenStream2 {
    let name = &comp.name;
    let props: Vec<_> = comp.props.iter().map(|prop| {
        let name = &prop.name;
        let value = &prop.value;
        quote! { #name: #value }
    }).collect();

    let children: Vec<_> = comp.children.iter().map(generate_node).collect();

    let key_attr = comp.key.as_ref().map(|k| {
        quote! { .key(#k) }
    });

    let props_struct = format_ident!("{}Props", name.segments.last().unwrap().ident);

    if children.is_empty() {
        quote! {
            #name(#props_struct {
                #(#props),*
            })
            #key_attr
        }
    } else {
        quote! {
            #name(#props_struct {
                #(#props),*
                children: Some(Box::new(|| philjs::rsx::fragment([#(#children),*]))),
            })
            #key_attr
        }
    }
}

// ============================================================================
// Public API
// ============================================================================

/// Implementation of the rsx! macro
pub fn rsx_impl(input: TokenStream) -> TokenStream {
    let root = syn::parse_macro_input!(input as RsxRoot);
    let output = generate_rsx(&root);
    TokenStream::from(output)
}

/// Implementation of the render_rsx! macro for static rendering
pub fn render_rsx_impl(input: TokenStream) -> TokenStream {
    let root = syn::parse_macro_input!(input as RsxRoot);
    let generated = generate_rsx(&root);

    let output = quote! {
        philjs::rsx::render_to_string(|| #generated)
    };

    TokenStream::from(output)
}
