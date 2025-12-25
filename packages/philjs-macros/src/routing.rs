//! Type-Safe Routing Macros
//!
//! Provides compile-time type-safe routing inspired by Leptos and Axum:
//! - `#[route("/path/:param")]` for route handlers
//! - `#[layout]` for nested layouts
//! - `use_params!()` for extracting path parameters
//! - `use_query!()` for extracting query parameters
//! - Automatic route generation and type checking

use proc_macro::TokenStream;
use proc_macro2::{TokenStream as TokenStream2, Span};
use quote::{quote, format_ident};
use syn::{
    parse::{Parse, ParseStream},
    parse_macro_input, Ident, ItemFn, LitStr, Result, Token, Type, FnArg, Pat,
    Attribute, Visibility,
};
use darling::FromMeta;

// ============================================================================
// Route Macro
// ============================================================================

#[derive(Debug, FromMeta, Default)]
pub struct RouteArgs {
    /// The route path pattern (e.g., "/users/:id")
    #[darling(default)]
    pub path: Option<String>,

    /// HTTP method (defaults to GET for pages)
    #[darling(default)]
    pub method: Option<String>,

    /// Whether this is a layout route
    #[darling(default)]
    pub layout: bool,

    /// Whether this is an index route
    #[darling(default)]
    pub index: bool,

    /// Parent layout to nest under
    #[darling(default)]
    pub parent: Option<String>,

    /// SSR mode: "ssr", "csr", "ssg", "isr"
    #[darling(default)]
    pub ssr: Option<String>,

    /// Revalidate interval for ISR (in seconds)
    #[darling(default)]
    pub revalidate: Option<u32>,

    /// Whether to preload this route
    #[darling(default)]
    pub preload: bool,

    /// Metadata for the route
    #[darling(default)]
    pub title: Option<String>,

    /// Route guard/middleware
    #[darling(default)]
    pub guard: Option<String>,
}

/// Represents a path segment
#[derive(Debug, Clone)]
pub enum PathSegment {
    /// Static segment: "users"
    Static(String),
    /// Dynamic parameter: ":id"
    Param { name: String, ty: Option<String> },
    /// Catch-all: "*rest"
    CatchAll(String),
    /// Optional parameter: ":id?"
    Optional { name: String, ty: Option<String> },
}

impl PathSegment {
    fn parse_path(path: &str) -> Vec<PathSegment> {
        path.split('/')
            .filter(|s| !s.is_empty())
            .map(|segment| {
                if segment.starts_with('*') {
                    PathSegment::CatchAll(segment[1..].to_string())
                } else if segment.starts_with(':') {
                    let rest = &segment[1..];
                    if rest.ends_with('?') {
                        let name = rest[..rest.len() - 1].to_string();
                        PathSegment::Optional { name, ty: None }
                    } else if let Some(pos) = rest.find('<') {
                        let name = rest[..pos].to_string();
                        let ty = rest[pos + 1..rest.len() - 1].to_string();
                        PathSegment::Param {
                            name,
                            ty: Some(ty),
                        }
                    } else {
                        PathSegment::Param {
                            name: rest.to_string(),
                            ty: None,
                        }
                    }
                } else {
                    PathSegment::Static(segment.to_string())
                }
            })
            .collect()
    }
}

/// Implementation of the #[route] macro
pub fn route_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    // Parse the path from the first argument if it's a string literal
    let args_clone = args.clone();
    let path = syn::parse::<LitStr>(args_clone)
        .ok()
        .map(|lit| lit.value());

    // Parse remaining args
    let meta_args = match darling::ast::NestedMeta::parse_meta_list(args.into()) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(darling::Error::from(e).write_errors()),
    };

    let mut route_args = match RouteArgs::from_list(&meta_args) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(e.write_errors()),
    };

    // Use the positional path if provided
    if let Some(p) = path {
        route_args.path = Some(p);
    }

    let input_fn = parse_macro_input!(input as ItemFn);

    let fn_name = &input_fn.sig.ident;
    let fn_vis = &input_fn.vis;
    let fn_generics = &input_fn.sig.generics;
    let fn_where = &input_fn.sig.generics.where_clause;
    let fn_block = &input_fn.block;
    let fn_async = &input_fn.sig.asyncness;
    let fn_attrs = &input_fn.attrs;
    let fn_return = &input_fn.sig.output;

    // Get or generate path
    let route_path = route_args.path.clone().unwrap_or_else(|| {
        format!("/{}", fn_name.to_string().replace('_', "-"))
    });

    // Parse path segments
    let segments = PathSegment::parse_path(&route_path);

    // Extract parameters from path
    let params: Vec<_> = segments
        .iter()
        .filter_map(|seg| match seg {
            PathSegment::Param { name, ty } => Some((name.clone(), ty.clone())),
            PathSegment::Optional { name, ty } => Some((name.clone(), ty.clone())),
            PathSegment::CatchAll(name) => Some((name.clone(), Some("String".to_string()))),
            _ => None,
        })
        .collect();

    // Generate params struct
    let params_struct_name = format_ident!("{}Params", to_pascal_case(&fn_name.to_string()));
    let params_fields: Vec<_> = params
        .iter()
        .map(|(name, ty)| {
            let name_ident = format_ident!("{}", name);
            let type_tokens: TokenStream2 = ty
                .as_ref()
                .map(|t| {
                    let ty_ident = format_ident!("{}", t);
                    quote! { #ty_ident }
                })
                .unwrap_or_else(|| quote! { String });
            quote! {
                pub #name_ident: #type_tokens
            }
        })
        .collect();

    // Generate route pattern for matching
    let route_pattern = generate_route_pattern(&segments);

    // Generate params extraction
    let params_extraction: Vec<_> = params
        .iter()
        .enumerate()
        .map(|(idx, (name, ty))| {
            let name_ident = format_ident!("{}", name);
            let parse_expr = if ty.as_ref().map(|t| t != "String").unwrap_or(false) {
                quote! {
                    params.get(#idx)
                        .ok_or_else(|| philjs::router::RouteError::MissingParam(#name.to_string()))?
                        .parse()
                        .map_err(|_| philjs::router::RouteError::InvalidParam(#name.to_string()))?
                }
            } else {
                quote! {
                    params.get(#idx)
                        .ok_or_else(|| philjs::router::RouteError::MissingParam(#name.to_string()))?
                        .to_string()
                }
            };
            quote! {
                #name_ident: #parse_expr
            }
        })
        .collect();

    // Generate SSR mode
    let ssr_mode = match route_args.ssr.as_deref() {
        Some("csr") => quote! { philjs::router::SsrMode::ClientOnly },
        Some("ssg") => quote! { philjs::router::SsrMode::StaticGeneration },
        Some("isr") => {
            let revalidate = route_args.revalidate.unwrap_or(60);
            quote! { philjs::router::SsrMode::IncrementalRegeneration(#revalidate) }
        }
        _ => quote! { philjs::router::SsrMode::ServerSide },
    };

    // Generate guard/middleware
    let guard_check = if let Some(guard) = &route_args.guard {
        let guard_ident = format_ident!("{}", guard);
        quote! {
            if !#guard_ident(&ctx).await {
                return Err(philjs::router::RouteError::Unauthorized);
            }
        }
    } else {
        quote! {}
    };

    // Generate metadata
    let title = route_args.title.clone().unwrap_or_else(|| {
        to_title_case(&fn_name.to_string())
    });

    // Check if function has params argument
    let fn_args = &input_fn.sig.inputs;
    let has_params_arg = fn_args.iter().any(|arg| {
        if let FnArg::Typed(pat_type) = arg {
            if let Pat::Ident(pat_ident) = &*pat_type.pat {
                return pat_ident.ident == "params";
            }
        }
        false
    });

    // Generate the output
    let output = if route_args.layout {
        // Layout route
        quote! {
            // Params struct
            #[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
            #fn_vis struct #params_struct_name {
                #(#params_fields),*
            }

            // Layout component
            #(#fn_attrs)*
            #fn_vis #fn_async fn #fn_name #fn_generics(
                children: impl Fn() -> philjs::view::View,
            ) #fn_return #fn_where {
                #fn_block
            }

            // Route registration
            philjs::inventory::submit! {
                philjs::router::RouteRegistration {
                    path: #route_path,
                    pattern: #route_pattern,
                    component: |params| Box::pin(async move {
                        #guard_check
                        let params = #params_struct_name {
                            #(#params_extraction),*
                        };
                        Ok(#fn_name(|| philjs::view::Outlet::new()))
                    }),
                    ssr_mode: #ssr_mode,
                    is_layout: true,
                    metadata: philjs::router::RouteMetadata {
                        title: Some(#title.to_string()),
                        ..Default::default()
                    },
                }
            }
        }
    } else {
        // Page route
        let component_call = if has_params_arg {
            quote! { #fn_name(params) }
        } else if params.is_empty() {
            quote! { #fn_name() }
        } else {
            quote! { #fn_name(params) }
        };

        quote! {
            // Params struct
            #[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
            #fn_vis struct #params_struct_name {
                #(#params_fields),*
            }

            // Page component
            #(#fn_attrs)*
            #fn_vis #fn_async fn #fn_name #fn_generics(
                #fn_args
            ) #fn_return #fn_where {
                #fn_block
            }

            // Route registration
            philjs::inventory::submit! {
                philjs::router::RouteRegistration {
                    path: #route_path,
                    pattern: #route_pattern,
                    component: |raw_params| Box::pin(async move {
                        #guard_check
                        let params = #params_struct_name {
                            #(#params_extraction),*
                        };
                        Ok(#component_call)
                    }),
                    ssr_mode: #ssr_mode,
                    is_layout: false,
                    metadata: philjs::router::RouteMetadata {
                        title: Some(#title.to_string()),
                        ..Default::default()
                    },
                }
            }
        }
    };

    TokenStream::from(output)
}

/// Generate a regex-like pattern for route matching
fn generate_route_pattern(segments: &[PathSegment]) -> String {
    let mut pattern = String::from("^");

    for segment in segments {
        pattern.push('/');
        match segment {
            PathSegment::Static(s) => {
                pattern.push_str(&regex_escape(s));
            }
            PathSegment::Param { .. } => {
                pattern.push_str("([^/]+)");
            }
            PathSegment::Optional { .. } => {
                pattern.push_str("([^/]*)");
            }
            PathSegment::CatchAll(_) => {
                pattern.push_str("(.*)");
            }
        }
    }

    pattern.push('$');
    pattern
}

fn regex_escape(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            '.' | '+' | '*' | '?' | '^' | '$' | '(' | ')' | '[' | ']' | '{' | '}' | '|' | '\\' => {
                format!("\\{}", c)
            }
            _ => c.to_string(),
        })
        .collect()
}

fn to_pascal_case(s: &str) -> String {
    s.split('_')
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().chain(chars).collect(),
            }
        })
        .collect()
}

fn to_title_case(s: &str) -> String {
    s.split('_')
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().chain(chars).collect(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

// ============================================================================
// Layout Macro
// ============================================================================

/// Implementation of the #[layout] macro
pub fn layout_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    // Parse the path from the first argument
    let path = syn::parse::<LitStr>(args.clone())
        .ok()
        .map(|lit| lit.value());

    let input_fn = parse_macro_input!(input as ItemFn);

    let fn_name = &input_fn.sig.ident;
    let fn_vis = &input_fn.vis;
    let fn_generics = &input_fn.sig.generics;
    let fn_where = &input_fn.sig.generics.where_clause;
    let fn_block = &input_fn.block;
    let fn_async = &input_fn.sig.asyncness;
    let fn_attrs = &input_fn.attrs;
    let fn_return = &input_fn.sig.output;

    let layout_path = path.unwrap_or_else(|| "/".to_string());

    let output = quote! {
        #(#fn_attrs)*
        #fn_vis #fn_async fn #fn_name #fn_generics(
            children: impl Fn() -> philjs::view::View,
        ) #fn_return #fn_where {
            #fn_block
        }

        philjs::inventory::submit! {
            philjs::router::LayoutRegistration {
                path: #layout_path,
                component: |children| #fn_name(children),
            }
        }
    };

    TokenStream::from(output)
}

// ============================================================================
// Params Macro
// ============================================================================

/// Parse input for use_params! macro
struct UseParamsInput {
    ty: Type,
}

impl Parse for UseParamsInput {
    fn parse(input: ParseStream) -> Result<Self> {
        Ok(UseParamsInput {
            ty: input.parse()?,
        })
    }
}

/// Implementation of the use_params! macro
pub fn use_params_impl(input: TokenStream) -> TokenStream {
    let UseParamsInput { ty } = parse_macro_input!(input as UseParamsInput);

    let output = quote! {
        {
            let params_signal = philjs::router::use_params::<#ty>();
            params_signal
        }
    };

    TokenStream::from(output)
}

// ============================================================================
// Query Macro
// ============================================================================

/// Parse input for use_query! macro
struct UseQueryInput {
    ty: Type,
}

impl Parse for UseQueryInput {
    fn parse(input: ParseStream) -> Result<Self> {
        Ok(UseQueryInput {
            ty: input.parse()?,
        })
    }
}

/// Implementation of the use_query! macro
pub fn use_query_impl(input: TokenStream) -> TokenStream {
    let UseQueryInput { ty } = parse_macro_input!(input as UseQueryInput);

    let output = quote! {
        {
            let query_signal = philjs::router::use_query::<#ty>();
            query_signal
        }
    };

    TokenStream::from(output)
}

// ============================================================================
// Navigate Macro
// ============================================================================

/// Implementation of the navigate! macro for type-safe navigation
pub fn navigate_impl(input: TokenStream) -> TokenStream {
    let lit = parse_macro_input!(input as LitStr);
    let path = lit.value();

    let output = quote! {
        philjs::router::navigate(#path)
    };

    TokenStream::from(output)
}

// ============================================================================
// Link Component Macro
// ============================================================================

#[derive(Debug, FromMeta, Default)]
pub struct LinkArgs {
    #[darling(default)]
    pub to: Option<String>,

    #[darling(default)]
    pub replace: bool,

    #[darling(default)]
    pub prefetch: Option<String>,

    #[darling(default)]
    pub active_class: Option<String>,
}

/// Generates a type-safe Link component
pub fn link_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    let args = match darling::ast::NestedMeta::parse_meta_list(args.into()) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(darling::Error::from(e).write_errors()),
    };

    let link_args = match LinkArgs::from_list(&args) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(e.write_errors()),
    };

    let to = link_args.to.unwrap_or_else(|| "/".to_string());
    let replace = link_args.replace;
    let prefetch = link_args.prefetch.unwrap_or_else(|| "hover".to_string());
    let active_class = link_args.active_class.unwrap_or_else(|| "active".to_string());

    let output = quote! {
        philjs::router::Link::new(#to)
            .replace(#replace)
            .prefetch(#prefetch)
            .active_class(#active_class)
    };

    TokenStream::from(output)
}

// ============================================================================
// Redirect Macro
// ============================================================================

/// Implementation of the redirect! macro
pub fn redirect_impl(input: TokenStream) -> TokenStream {
    let lit = parse_macro_input!(input as LitStr);
    let path = lit.value();

    let output = quote! {
        return Err(philjs::router::RouteError::Redirect(#path.to_string()))
    };

    TokenStream::from(output)
}

// ============================================================================
// API Route Macro
// ============================================================================

#[derive(Debug, FromMeta, Default)]
pub struct ApiRouteArgs {
    #[darling(default)]
    pub method: Option<String>,

    #[darling(default)]
    pub path: Option<String>,
}

/// Implementation of the #[api] macro for API routes
pub fn api_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    let method_lit = syn::parse::<Ident>(args.clone()).ok();
    let method = method_lit
        .map(|i| i.to_string().to_uppercase())
        .unwrap_or_else(|| "GET".to_string());

    let input_fn = parse_macro_input!(input as ItemFn);

    let fn_name = &input_fn.sig.ident;
    let fn_vis = &input_fn.vis;
    let fn_generics = &input_fn.sig.generics;
    let fn_where = &input_fn.sig.generics.where_clause;
    let fn_block = &input_fn.block;
    let fn_attrs = &input_fn.attrs;

    let api_path = format!("/api/{}", fn_name.to_string().replace('_', "-"));

    let output = quote! {
        #(#fn_attrs)*
        #fn_vis async fn #fn_name #fn_generics(
            req: philjs::server::Request,
        ) -> philjs::server::Response #fn_where {
            #fn_block
        }

        philjs::inventory::submit! {
            philjs::router::ApiRouteRegistration {
                method: #method,
                path: #api_path,
                handler: |req| Box::pin(#fn_name(req)),
            }
        }
    };

    TokenStream::from(output)
}
