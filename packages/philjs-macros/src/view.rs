//! View macro implementation
//!
//! Provides JSX-like syntax that compiles to efficient PhilJS render calls.

use proc_macro::TokenStream;
use proc_macro2::{TokenStream as TokenStream2, Span};
use quote::quote;
use syn::{
    parse::{Parse, ParseStream},
    punctuated::Punctuated,
    token::{Brace, Colon, Gt, Lt, Slash},
    Expr, Ident, LitStr, Result, Token,
};

/// Parse tree for the view! macro
enum ViewNode {
    Element(Element),
    Text(LitStr),
    Block(Expr),
}

struct Element {
    name: Ident,
    attributes: Vec<Attribute>,
    children: Vec<ViewNode>,
    self_closing: bool,
}

struct Attribute {
    name: AttributeName,
    value: Option<Expr>,
}

enum AttributeName {
    Simple(Ident),
    Namespaced { namespace: Ident, name: Ident },
}

impl Parse for ViewNode {
    fn parse(input: ParseStream) -> Result<Self> {
        if input.peek(Lt) {
            // Element
            Ok(ViewNode::Element(input.parse()?))
        } else if input.peek(syn::LitStr) {
            // Text literal
            Ok(ViewNode::Text(input.parse()?))
        } else if input.peek(Brace) {
            // Expression block
            let content;
            syn::braced!(content in input);
            Ok(ViewNode::Block(content.parse()?))
        } else {
            Err(input.error("Expected element, text, or expression block"))
        }
    }
}

impl Parse for Element {
    fn parse(input: ParseStream) -> Result<Self> {
        // Parse opening tag: <name
        input.parse::<Lt>()?;
        let name: Ident = input.parse()?;

        // Parse attributes
        let mut attributes = Vec::new();
        while !input.peek(Gt) && !input.peek(Slash) {
            attributes.push(input.parse()?);
        }

        // Check for self-closing
        let self_closing = if input.peek(Slash) {
            input.parse::<Slash>()?;
            input.parse::<Gt>()?;
            true
        } else {
            input.parse::<Gt>()?;
            false
        };

        // Parse children if not self-closing
        let mut children = Vec::new();
        if !self_closing {
            while !input.peek(Lt) || !input.peek2(Slash) {
                if input.is_empty() {
                    return Err(input.error("Unclosed element"));
                }
                children.push(input.parse()?);
            }

            // Parse closing tag: </name>
            input.parse::<Lt>()?;
            input.parse::<Slash>()?;
            let closing_name: Ident = input.parse()?;
            if closing_name != name {
                return Err(syn::Error::new(
                    closing_name.span(),
                    format!("Mismatched closing tag: expected </{}>", name),
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

impl Parse for Attribute {
    fn parse(input: ParseStream) -> Result<Self> {
        let name = input.parse()?;

        let value = if input.peek(Token![=]) {
            input.parse::<Token![=]>()?;
            Some(if input.peek(syn::LitStr) {
                let lit: LitStr = input.parse()?;
                syn::parse_str(&lit.value())?
            } else if input.peek(Brace) {
                let content;
                syn::braced!(content in input);
                content.parse()?
            } else {
                return Err(input.error("Expected string literal or expression block"));
            })
        } else {
            None
        };

        Ok(Attribute { name, value })
    }
}

impl Parse for AttributeName {
    fn parse(input: ParseStream) -> Result<Self> {
        let first: Ident = input.parse()?;

        if input.peek(Colon) {
            input.parse::<Colon>()?;
            let second: Ident = input.parse()?;
            Ok(AttributeName::Namespaced {
                namespace: first,
                name: second,
            })
        } else {
            Ok(AttributeName::Simple(first))
        }
    }
}

struct ViewMacroInput {
    nodes: Vec<ViewNode>,
}

impl Parse for ViewMacroInput {
    fn parse(input: ParseStream) -> Result<Self> {
        let mut nodes = Vec::new();
        while !input.is_empty() {
            nodes.push(input.parse()?);
        }
        Ok(ViewMacroInput { nodes })
    }
}

fn codegen_view_node(node: &ViewNode) -> TokenStream2 {
    match node {
        ViewNode::Element(element) => codegen_element(element),
        ViewNode::Text(text) => {
            let value = text.value();
            quote! {
                philjs::text(#value)
            }
        }
        ViewNode::Block(expr) => {
            quote! {
                philjs::IntoView::into_view(#expr)
            }
        }
    }
}

fn codegen_element(element: &Element) -> TokenStream2 {
    let tag_name = element.name.to_string();

    // Generate attributes
    let attrs: Vec<_> = element.attributes.iter().map(|attr| {
        let attr_code = codegen_attribute(attr);
        quote! { .attr(#attr_code) }
    }).collect();

    // Generate children
    let children: Vec<_> = element.children.iter().map(codegen_view_node).collect();

    if element.self_closing {
        quote! {
            philjs::element(#tag_name)
                #(#attrs)*
        }
    } else {
        quote! {
            philjs::element(#tag_name)
                #(#attrs)*
                #(.child(#children))*
        }
    }
}

fn codegen_attribute(attr: &Attribute) -> TokenStream2 {
    let name = match &attr.name {
        AttributeName::Simple(ident) => ident.to_string(),
        AttributeName::Namespaced { namespace, name } => {
            format!("{}:{}", namespace, name)
        }
    };

    if let Some(value) = &attr.value {
        quote! {
            (#name, #value)
        }
    } else {
        quote! {
            (#name, true)
        }
    }
}

/// Implementation of the view! macro
pub fn view_impl(input: TokenStream) -> TokenStream {
    let input = syn::parse_macro_input!(input as ViewMacroInput);

    let nodes: Vec<_> = input.nodes.iter().map(codegen_view_node).collect();

    let output = if nodes.len() == 1 {
        quote! {
            #(#nodes)*
        }
    } else {
        quote! {
            philjs::fragment(vec![
                #(#nodes),*
            ])
        }
    };

    TokenStream::from(output)
}
