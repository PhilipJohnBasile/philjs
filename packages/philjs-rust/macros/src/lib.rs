//! PhilJS Procedural Macros
//!
//! Provides the `view!`, `component`, and `signal` macros for
//! writing reactive UI components in pure Rust.

use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use quote::{quote, format_ident};
use syn::{
    parse::{Parse, ParseStream},
    parse_macro_input,
    punctuated::Punctuated,
    token, Attribute, Expr, ExprClosure, Ident, LitStr, Token, Type,
    FnArg, ItemFn, Pat, ReturnType, Visibility,
};

// ============================================================================
// VIEW MACRO - JSX-like syntax for Rust
// ============================================================================

/// The `view!` macro provides JSX-like syntax for building UI in Rust.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// fn counter() -> impl IntoView {
///     let count = signal(0);
///
///     view! {
///         <div class="counter">
///             <h1>"Count: " {count}</h1>
///             <button on:click=move |_| count.set(count.get() + 1)>
///                 "Increment"
///             </button>
///         </div>
///     }
/// }
/// ```
#[proc_macro]
pub fn view(input: TokenStream) -> TokenStream {
    let view_input = parse_macro_input!(input as ViewMacroInput);
    view_input.to_tokens().into()
}

struct ViewMacroInput {
    nodes: Vec<ViewNode>,
}

impl Parse for ViewMacroInput {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let mut nodes = Vec::new();
        while !input.is_empty() {
            nodes.push(input.parse()?);
        }
        Ok(ViewMacroInput { nodes })
    }
}

impl ViewMacroInput {
    fn to_tokens(&self) -> TokenStream2 {
        if self.nodes.len() == 1 {
            self.nodes[0].to_tokens()
        } else {
            let nodes: Vec<_> = self.nodes.iter().map(|n| n.to_tokens()).collect();
            quote! {
                ::philjs::Fragment::new(vec![#(#nodes.into_view()),*])
            }
        }
    }
}

enum ViewNode {
    Element(ElementNode),
    Text(LitStr),
    Block(Expr),
    Component(ComponentNode),
    Fragment(Vec<ViewNode>),
}

impl Parse for ViewNode {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        if input.peek(Token![<]) {
            // Check if it's a closing tag
            let fork = input.fork();
            fork.parse::<Token![<]>()?;
            if fork.peek(Token![/]) {
                return Err(syn::Error::new(input.span(), "unexpected closing tag"));
            }

            // Check if it's a component (PascalCase) or element (lowercase)
            if fork.peek(Ident) {
                let ident: Ident = fork.parse()?;
                let name = ident.to_string();
                if name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
                    return Ok(ViewNode::Component(input.parse()?));
                }
            }
            Ok(ViewNode::Element(input.parse()?))
        } else if input.peek(LitStr) {
            Ok(ViewNode::Text(input.parse()?))
        } else if input.peek(token::Brace) {
            let content;
            syn::braced!(content in input);
            Ok(ViewNode::Block(content.parse()?))
        } else {
            Err(syn::Error::new(input.span(), "expected element, text, or expression"))
        }
    }
}

impl ViewNode {
    fn to_tokens(&self) -> TokenStream2 {
        match self {
            ViewNode::Element(el) => el.to_tokens(),
            ViewNode::Text(lit) => quote! { ::philjs::Text::new(#lit) },
            ViewNode::Block(expr) => quote! { ::philjs::Dynamic::new(move || #expr) },
            ViewNode::Component(comp) => comp.to_tokens(),
            ViewNode::Fragment(nodes) => {
                let nodes: Vec<_> = nodes.iter().map(|n| n.to_tokens()).collect();
                quote! { ::philjs::Fragment::new(vec![#(#nodes.into_view()),*]) }
            }
        }
    }
}

struct ElementNode {
    tag: Ident,
    attrs: Vec<ElementAttr>,
    children: Vec<ViewNode>,
    self_closing: bool,
}

impl Parse for ElementNode {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<Token![<]>()?;
        let tag: Ident = input.parse()?;

        let mut attrs = Vec::new();
        while !input.peek(Token![>]) && !input.peek(Token![/]) {
            attrs.push(input.parse()?);
        }

        let self_closing = input.peek(Token![/]);
        if self_closing {
            input.parse::<Token![/]>()?;
            input.parse::<Token![>]>()?;
            return Ok(ElementNode {
                tag,
                attrs,
                children: Vec::new(),
                self_closing: true,
            });
        }

        input.parse::<Token![>]>()?;

        let mut children = Vec::new();
        while !input.peek(Token![<]) || !input.peek2(Token![/]) {
            if input.is_empty() {
                return Err(syn::Error::new(input.span(), "unclosed element"));
            }
            children.push(input.parse()?);
        }

        // Parse closing tag
        input.parse::<Token![<]>()?;
        input.parse::<Token![/]>()?;
        let close_tag: Ident = input.parse()?;
        if close_tag != tag {
            return Err(syn::Error::new(
                close_tag.span(),
                format!("expected closing tag </{}>, found </{}>", tag, close_tag),
            ));
        }
        input.parse::<Token![>]>()?;

        Ok(ElementNode {
            tag,
            attrs,
            children,
            self_closing: false,
        })
    }
}

impl ElementNode {
    fn to_tokens(&self) -> TokenStream2 {
        let tag = self.tag.to_string();
        let mut static_attrs = Vec::new();
        let mut dynamic_attrs = Vec::new();
        let mut event_handlers = Vec::new();
        let mut class_expr = None;
        let mut style_expr = None;
        let mut ref_expr = None;

        for attr in &self.attrs {
            match attr {
                ElementAttr::Static { name, value } => {
                    let name_str = name.to_string().replace('_', "-");
                    static_attrs.push(quote! { (#name_str, #value) });
                }
                ElementAttr::Dynamic { name, expr } => {
                    let name_str = name.to_string().replace('_', "-");
                    dynamic_attrs.push(quote! { (#name_str, move || #expr) });
                }
                ElementAttr::Event { name, handler } => {
                    let event_name = name.to_string();
                    event_handlers.push(quote! { (#event_name, ::std::boxed::Box::new(#handler)) });
                }
                ElementAttr::Class(expr) => {
                    class_expr = Some(expr.clone());
                }
                ElementAttr::Style(expr) => {
                    style_expr = Some(expr.clone());
                }
                ElementAttr::Ref(expr) => {
                    ref_expr = Some(expr.clone());
                }
                ElementAttr::Spread(expr) => {
                    dynamic_attrs.push(quote! { ::philjs::spread_attrs(#expr) });
                }
            }
        }

        let children: Vec<_> = self.children.iter().map(|c| c.to_tokens()).collect();

        let class_attr = class_expr.map(|e| quote! { .class(move || #e) }).unwrap_or_default();
        let style_attr = style_expr.map(|e| quote! { .style(move || #e) }).unwrap_or_default();
        let ref_attr = ref_expr.map(|e| quote! { .node_ref(#e) }).unwrap_or_default();

        let static_attrs_iter = if static_attrs.is_empty() {
            quote! {}
        } else {
            quote! { .attrs(&[#(#static_attrs),*]) }
        };

        let dynamic_attrs_iter = if dynamic_attrs.is_empty() {
            quote! {}
        } else {
            quote! { .dynamic_attrs(vec![#(#dynamic_attrs),*]) }
        };

        let events_iter = if event_handlers.is_empty() {
            quote! {}
        } else {
            quote! { .events(vec![#(#event_handlers),*]) }
        };

        let children_iter = if children.is_empty() {
            quote! {}
        } else {
            quote! { .children(vec![#(#children.into_view()),*]) }
        };

        quote! {
            ::philjs::Element::new(#tag)
                #static_attrs_iter
                #dynamic_attrs_iter
                #events_iter
                #class_attr
                #style_attr
                #ref_attr
                #children_iter
        }
    }
}

enum ElementAttr {
    Static { name: Ident, value: LitStr },
    Dynamic { name: Ident, expr: Expr },
    Event { name: Ident, handler: Expr },
    Class(Expr),
    Style(Expr),
    Ref(Expr),
    Spread(Expr),
}

impl Parse for ElementAttr {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        // Check for spread: {..props}
        if input.peek(token::Brace) {
            let content;
            syn::braced!(content in input);
            if content.peek(Token![..]) {
                content.parse::<Token![..]>()?;
                let expr: Expr = content.parse()?;
                return Ok(ElementAttr::Spread(expr));
            }
        }

        let name: Ident = input.parse()?;
        let name_str = name.to_string();

        // Check for event handler: on:click, on:input, etc.
        if name_str == "on" {
            input.parse::<Token![:]>()?;
            let event_name: Ident = input.parse()?;
            input.parse::<Token![=]>()?;
            let handler: Expr = input.parse()?;
            return Ok(ElementAttr::Event { name: event_name, handler });
        }

        // Check for special attributes
        if name_str == "class" || name_str == "style" || name_str == "node_ref" {
            input.parse::<Token![=]>()?;
            let expr: Expr = input.parse()?;
            return match name_str.as_str() {
                "class" => Ok(ElementAttr::Class(expr)),
                "style" => Ok(ElementAttr::Style(expr)),
                "node_ref" => Ok(ElementAttr::Ref(expr)),
                _ => unreachable!(),
            };
        }

        input.parse::<Token![=]>()?;

        // Dynamic or static value
        if input.peek(LitStr) {
            let value: LitStr = input.parse()?;
            Ok(ElementAttr::Static { name, value })
        } else if input.peek(token::Brace) {
            let content;
            syn::braced!(content in input);
            let expr: Expr = content.parse()?;
            Ok(ElementAttr::Dynamic { name, expr })
        } else {
            let expr: Expr = input.parse()?;
            Ok(ElementAttr::Dynamic { name, expr })
        }
    }
}

struct ComponentNode {
    name: Ident,
    props: Vec<ComponentProp>,
    children: Option<Vec<ViewNode>>,
}

impl Parse for ComponentNode {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<Token![<]>()?;
        let name: Ident = input.parse()?;

        let mut props = Vec::new();
        while !input.peek(Token![>]) && !input.peek(Token![/]) {
            props.push(input.parse()?);
        }

        if input.peek(Token![/]) {
            input.parse::<Token![/]>()?;
            input.parse::<Token![>]>()?;
            return Ok(ComponentNode { name, props, children: None });
        }

        input.parse::<Token![>]>()?;

        let mut children = Vec::new();
        while !input.peek(Token![<]) || !input.peek2(Token![/]) {
            if input.is_empty() {
                break;
            }
            children.push(input.parse()?);
        }

        // Parse closing tag
        input.parse::<Token![<]>()?;
        input.parse::<Token![/]>()?;
        let close_name: Ident = input.parse()?;
        if close_name != name {
            return Err(syn::Error::new(
                close_name.span(),
                format!("expected </{}>, found </{}>", name, close_name),
            ));
        }
        input.parse::<Token![>]>()?;

        let children = if children.is_empty() { None } else { Some(children) };

        Ok(ComponentNode { name, props, children })
    }
}

impl ComponentNode {
    fn to_tokens(&self) -> TokenStream2 {
        let name = &self.name;
        let props_name = format_ident!("{}Props", name);

        let prop_fields: Vec<_> = self.props.iter().map(|p| {
            let field_name = &p.name;
            let value = &p.value;
            quote! { #field_name: #value }
        }).collect();

        let children = self.children.as_ref().map(|c| {
            let children: Vec<_> = c.iter().map(|n| n.to_tokens()).collect();
            quote! { children: ::philjs::Children::new(vec![#(#children.into_view()),*]) }
        });

        let all_props = if let Some(children) = children {
            quote! { #(#prop_fields,)* #children }
        } else {
            quote! { #(#prop_fields),* }
        };

        quote! {
            #name(#props_name { #all_props })
        }
    }
}

struct ComponentProp {
    name: Ident,
    value: Expr,
}

impl Parse for ComponentProp {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let name: Ident = input.parse()?;
        input.parse::<Token![=]>()?;

        let value = if input.peek(token::Brace) {
            let content;
            syn::braced!(content in input);
            content.parse()?
        } else if input.peek(LitStr) {
            let lit: LitStr = input.parse()?;
            syn::parse_quote!(#lit.to_string())
        } else {
            input.parse()?
        };

        Ok(ComponentProp { name, value })
    }
}

// ============================================================================
// COMPONENT MACRO - Define reactive components
// ============================================================================

/// Define a PhilJS component with automatic prop handling.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// #[component]
/// fn Button(
///     /// Button label
///     label: String,
///     /// Optional click handler
///     #[prop(optional)]
///     on_click: Option<Box<dyn Fn()>>,
///     /// Children elements
///     children: Children,
/// ) -> impl IntoView {
///     view! {
///         <button on:click=move |_| {
///             if let Some(handler) = &on_click {
///                 handler();
///             }
///         }>
///             {label}
///             {children}
///         </button>
///     }
/// }
/// ```
#[proc_macro_attribute]
pub fn component(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(item as ItemFn);
    expand_component(input_fn).into()
}

fn expand_component(input: ItemFn) -> TokenStream2 {
    let vis = &input.vis;
    let fn_name = &input.sig.ident;
    let props_name = format_ident!("{}Props", fn_name);
    let generics = &input.sig.generics;
    let where_clause = &input.sig.generics.where_clause;
    let return_type = &input.sig.output;
    let body = &input.block;
    let attrs = &input.attrs;

    // Extract props from function arguments
    let mut prop_fields = Vec::new();
    let mut prop_defaults = Vec::new();
    let mut prop_extracts = Vec::new();

    for arg in &input.sig.inputs {
        if let FnArg::Typed(pat_type) = arg {
            if let Pat::Ident(pat_ident) = &*pat_type.pat {
                let name = &pat_ident.ident;
                let ty = &*pat_type.ty;
                let attrs = &pat_type.attrs;

                // Check for #[prop(optional)] or #[prop(default = ...)]
                let mut is_optional = false;
                let mut default_value = None;

                for attr in attrs {
                    if attr.path().is_ident("prop") {
                        let _ = attr.parse_nested_meta(|meta| {
                            if meta.path.is_ident("optional") {
                                is_optional = true;
                            } else if meta.path.is_ident("default") {
                                let value: Expr = meta.value()?.parse()?;
                                default_value = Some(value);
                            }
                            Ok(())
                        });
                    }
                }

                if is_optional {
                    prop_fields.push(quote! {
                        #[serde(default)]
                        pub #name: #ty
                    });
                    prop_defaults.push(quote! { #name: Default::default() });
                } else if let Some(default) = default_value {
                    prop_fields.push(quote! {
                        #[serde(default = #default)]
                        pub #name: #ty
                    });
                    prop_defaults.push(quote! { #name: #default });
                } else {
                    prop_fields.push(quote! { pub #name: #ty });
                    prop_defaults.push(quote! {});
                }

                prop_extracts.push(quote! { let #name = props.#name; });
            }
        }
    }

    quote! {
        #(#attrs)*
        #[derive(Clone, Debug, Default)]
        #vis struct #props_name #generics #where_clause {
            #(#prop_fields),*
        }

        #(#attrs)*
        #vis fn #fn_name #generics (props: #props_name #generics) #return_type #where_clause {
            #(#prop_extracts)*
            #body
        }
    }
}

// ============================================================================
// SIGNAL MACRO - Create reactive signals
// ============================================================================

/// Create a reactive signal with optional initial value.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = signal!(0);
/// let name = signal!(String::new());
/// let items = signal!(Vec::<Item>::new());
/// ```
#[proc_macro]
pub fn signal(input: TokenStream) -> TokenStream {
    let expr = parse_macro_input!(input as Expr);
    quote! {
        ::philjs::Signal::new(#expr)
    }.into()
}

// ============================================================================
// MEMO MACRO - Create computed/derived values
// ============================================================================

/// Create a memoized computed value.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = signal!(0);
/// let doubled = memo!(count.get() * 2);
/// ```
#[proc_macro]
pub fn memo(input: TokenStream) -> TokenStream {
    let expr = parse_macro_input!(input as Expr);
    quote! {
        ::philjs::Memo::new(move || #expr)
    }.into()
}

// ============================================================================
// EFFECT MACRO - Create side effects
// ============================================================================

/// Create a reactive side effect.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = signal!(0);
/// effect! {
///     println!("Count changed to: {}", count.get());
/// }
/// ```
#[proc_macro]
pub fn effect(input: TokenStream) -> TokenStream {
    let expr = parse_macro_input!(input as Expr);
    quote! {
        ::philjs::Effect::new(move || { #expr })
    }.into()
}

// ============================================================================
// RESOURCE MACRO - Async data fetching
// ============================================================================

/// Create an async resource with automatic loading states.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let user_id = signal!(1);
/// let user = resource!(user_id.get(), |id| async move {
///     fetch_user(id).await
/// });
/// ```
#[proc_macro]
pub fn resource(input: TokenStream) -> TokenStream {
    let input2: TokenStream2 = input.into();
    quote! {
        ::philjs::Resource::new(move || #input2)
    }.into()
}

// ============================================================================
// STORE MACRO - Create reactive stores
// ============================================================================

/// Create a reactive store for complex state.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// #[derive(Store)]
/// struct AppState {
///     count: i32,
///     user: Option<User>,
///     items: Vec<Item>,
/// }
/// ```
#[proc_macro_derive(Store, attributes(store))]
pub fn derive_store(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as syn::DeriveInput);
    let name = &input.ident;
    let store_name = format_ident!("{}Store", name);

    let fields = if let syn::Data::Struct(data) = &input.data {
        if let syn::Fields::Named(fields) = &data.fields {
            &fields.named
        } else {
            panic!("Store derive only supports structs with named fields");
        }
    } else {
        panic!("Store derive only supports structs");
    };

    let field_signals: Vec<_> = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote! { pub #name: ::philjs::Signal<#ty> }
    }).collect();

    let field_inits: Vec<_> = fields.iter().map(|f| {
        let name = &f.ident;
        quote! { #name: ::philjs::Signal::new(value.#name) }
    }).collect();

    let field_gets: Vec<_> = fields.iter().map(|f| {
        let name = &f.ident;
        quote! { #name: self.#name.get() }
    }).collect();

    quote! {
        #[derive(Clone)]
        pub struct #store_name {
            #(#field_signals),*
        }

        impl #store_name {
            pub fn new(value: #name) -> Self {
                Self {
                    #(#field_inits),*
                }
            }

            pub fn get(&self) -> #name {
                #name {
                    #(#field_gets),*
                }
            }
        }

        impl From<#name> for #store_name {
            fn from(value: #name) -> Self {
                Self::new(value)
            }
        }
    }.into()
}
