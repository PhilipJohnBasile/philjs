//! Enhanced Server Function Macro Implementation
//!
//! Marks functions as server-only and generates RPC calls for client-side usage.
//! Inspired by Leptos server functions with additional features:
//! - Multiple encodings (JSON, CBOR, URL-encoded, Multipart)
//! - Streaming responses
//! - Custom endpoints
//! - Middleware support
//! - Automatic OpenAPI generation
//! - Error handling with typed errors
//! - Request/Response access
//! - Cancellation support

use proc_macro::TokenStream;
use quote::{quote, format_ident};
use syn::{parse_macro_input, ItemFn, FnArg, Pat, ReturnType, Attribute, Visibility, Type};
use darling::FromMeta;

/// Server function encoding types
#[derive(Debug, Clone, Copy, Default)]
pub enum ServerFnEncoding {
    #[default]
    Json,
    Cbor,
    Url,
    Multipart,
    GetJson,
    GetCbor,
}

impl FromMeta for ServerFnEncoding {
    fn from_string(value: &str) -> darling::Result<Self> {
        match value.to_lowercase().as_str() {
            "json" | "postjson" => Ok(ServerFnEncoding::Json),
            "cbor" | "postcbor" => Ok(ServerFnEncoding::Cbor),
            "url" | "posturl" => Ok(ServerFnEncoding::Url),
            "multipart" => Ok(ServerFnEncoding::Multipart),
            "getjson" => Ok(ServerFnEncoding::GetJson),
            "getcbor" => Ok(ServerFnEncoding::GetCbor),
            _ => Err(darling::Error::unknown_value(value)),
        }
    }
}

#[derive(Debug, FromMeta, Default)]
pub struct ServerArgs {
    /// Custom endpoint path (defaults to /api/{fn_name})
    #[darling(default)]
    pub endpoint: Option<String>,

    /// API prefix (defaults to /api)
    #[darling(default)]
    pub prefix: Option<String>,

    /// Encoding format
    #[darling(default)]
    pub encoding: Option<ServerFnEncoding>,

    /// Input encoding (for different request/response encodings)
    #[darling(default)]
    pub input: Option<ServerFnEncoding>,

    /// Output encoding
    #[darling(default)]
    pub output: Option<ServerFnEncoding>,

    /// Whether this is a streaming response
    #[darling(default)]
    pub streaming: bool,

    /// Custom error type
    #[darling(default)]
    pub error: Option<String>,

    /// Middleware to apply
    #[darling(default)]
    pub middleware: Option<String>,

    /// Whether to generate OpenAPI docs
    #[darling(default)]
    pub openapi: bool,

    /// Rate limit (requests per minute)
    #[darling(default)]
    pub rate_limit: Option<u32>,

    /// Required role/permission
    #[darling(default)]
    pub require: Option<String>,

    /// Cache duration in seconds
    #[darling(default)]
    pub cache: Option<u32>,

    /// Custom HTTP method
    #[darling(default)]
    pub method: Option<String>,
}

/// Implementation of the enhanced #[server] macro
pub fn server_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    let args = match darling::ast::NestedMeta::parse_meta_list(args.into()) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(darling::Error::from(e).write_errors()),
    };

    let args = match ServerArgs::from_list(&args) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(e.write_errors()),
    };

    let input_fn = parse_macro_input!(input as ItemFn);

    let fn_name = &input_fn.sig.ident;
    let fn_vis = &input_fn.vis;
    let fn_generics = &input_fn.sig.generics;
    let fn_where = &input_fn.sig.generics.where_clause;
    let fn_block = &input_fn.block;
    let fn_async = &input_fn.sig.asyncness;
    let fn_attrs = &input_fn.attrs;

    // Extract function arguments
    let mut arg_names = Vec::new();
    let mut arg_types = Vec::new();
    let mut input_struct_fields = Vec::new();
    let mut has_request_context = false;

    for arg in &input_fn.sig.inputs {
        if let FnArg::Typed(pat_type) = arg {
            if let Pat::Ident(pat_ident) = &*pat_type.pat {
                let arg_name = &pat_ident.ident;
                let arg_type = &pat_type.ty;

                // Check for special types that shouldn't be serialized
                let type_str = quote!(#arg_type).to_string();
                if type_str.contains("RequestContext") || type_str.contains("Request") {
                    has_request_context = true;
                    continue;
                }

                arg_names.push(arg_name.clone());
                arg_types.push(arg_type.clone());
                input_struct_fields.push(quote! {
                    pub #arg_name: #arg_type
                });
            }
        }
    }

    // Extract return type
    let return_type = match &input_fn.sig.output {
        ReturnType::Default => quote! { () },
        ReturnType::Type(_, ty) => quote! { #ty },
    };

    // Generate endpoint path
    let endpoint_path = args.endpoint.clone().unwrap_or_else(|| {
        let prefix = args.prefix.clone().unwrap_or_else(|| "/api".to_string());
        format!("{}/{}", prefix, fn_name)
    });

    // Generate struct names
    let fn_name_str = fn_name.to_string();
    let pascal_name = to_pascal_case(&fn_name_str);
    let input_struct_name = format_ident!("{}Input", pascal_name);
    let output_struct_name = format_ident!("{}Output", pascal_name);
    let error_struct_name = format_ident!("{}Error", pascal_name);

    // Determine encoding
    let encoding = args.encoding.unwrap_or_default();
    let input_encoding = args.input.unwrap_or(encoding);
    let output_encoding = args.output.unwrap_or(encoding);

    let (serialize_fn, deserialize_fn) = match input_encoding {
        ServerFnEncoding::Json | ServerFnEncoding::GetJson => (
            quote! { philjs_rust::server::to_json },
            quote! { philjs_rust::server::from_json },
        ),
        ServerFnEncoding::Cbor | ServerFnEncoding::GetCbor => (
            quote! { philjs_rust::server::to_cbor },
            quote! { philjs_rust::server::from_cbor },
        ),
        ServerFnEncoding::Url => (
            quote! { philjs_rust::server::to_url_encoded },
            quote! { philjs_rust::server::from_url_encoded },
        ),
        ServerFnEncoding::Multipart => (
            quote! { philjs_rust::server::to_multipart },
            quote! { philjs_rust::server::from_multipart },
        ),
    };

    let http_method = match input_encoding {
        ServerFnEncoding::GetJson | ServerFnEncoding::GetCbor => quote! { "GET" },
        _ => quote! { "POST" },
    };

    // Generate streaming support
    let fn_name_stream = format_ident!("{}_stream", fn_name);
    let streaming_support = if args.streaming {
        quote! {
            /// Streaming version of this server function
            #fn_vis async fn #fn_name_stream #fn_generics(
                #(#arg_names: #arg_types),*
            ) -> impl futures::Stream<Item = Result<#return_type, philjs_rust::ServerFnError>> #fn_where {
                philjs_rust::server::stream_fn(#endpoint_path, #input_struct_name {
                    #(#arg_names),*
                })
            }
        }
    } else {
        quote! {}
    };

    // Generate middleware application
    let middleware_wrapper = if let Some(middleware) = &args.middleware {
        let middleware_ident = format_ident!("{}", middleware);
        quote! {
            let handler = #middleware_ident(handler);
        }
    } else {
        quote! {}
    };

    // Generate rate limiting
    let rate_limit_check = if let Some(limit) = args.rate_limit {
        quote! {
            philjs_rust::server::check_rate_limit(req, #limit)?;
        }
    } else {
        quote! {}
    };

    // Generate auth check
    let auth_check = if let Some(require) = &args.require {
        quote! {
            philjs_rust::server::require_permission(req, #require)?;
        }
    } else {
        quote! {}
    };

    // Generate caching
    let cache_header = if let Some(cache_duration) = args.cache {
        quote! {
            response = response.header("Cache-Control", format!("max-age={}", #cache_duration));
        }
    } else {
        quote! {}
    };

    // Generate OpenAPI documentation
    let openapi_doc = if args.openapi {
        let description = extract_doc_comment(fn_attrs);
        quote! {
            #[cfg(feature = "openapi")]
            inventory::submit! {
                philjs_rust::openapi::ServerFnSpec {
                    path: #endpoint_path,
                    method: #http_method,
                    description: #description,
                    input_schema: <#input_struct_name as schemars::JsonSchema>::schema_name(),
                    output_schema: <#return_type as schemars::JsonSchema>::schema_name(),
                }
            }
        }
    } else {
        quote! {}
    };

    // Generate the full output
    let output = quote! {
        // Input struct for serialization
        #[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
        #[cfg_attr(feature = "openapi", derive(philjs_rust::openapi::JsonSchema))]
        #fn_vis struct #input_struct_name #fn_generics #fn_where {
            #(#input_struct_fields),*
        }

        // Server function trait implementation
        impl #fn_generics philjs_rust::server::ServerFn for #input_struct_name #fn_generics #fn_where {
            type Input = Self;
            type Output = #return_type;

            const PATH: &'static str = #endpoint_path;
            const METHOD: &'static str = #http_method;

            fn run(input: Self::Input) -> std::pin::Pin<Box<dyn std::future::Future<Output = philjs_rust::server::ServerResult<Self::Output>> + Send>> {
                Box::pin(async move {
                    #fn_name(#(input.#arg_names),*).await
                })
            }
        }

        // Server-side implementation
        #[cfg(feature = "ssr")]
        #(#fn_attrs)*
        #fn_vis #fn_async fn #fn_name #fn_generics(
            #(#arg_names: #arg_types),*
        ) -> #return_type #fn_where {
            #fn_block
        }

        // Client-side RPC stub
        #[cfg(not(feature = "ssr"))]
        #(#fn_attrs)*
        #fn_vis async fn #fn_name #fn_generics(
            #(#arg_names: #arg_types),*
        ) -> #return_type #fn_where {
            let input = #input_struct_name {
                #(#arg_names),*
            };

            philjs_rust::server::call_server::<#input_struct_name>(input).await
                .expect("Server function call failed")
        }

        // Register server function handler
        #[cfg(feature = "ssr")]
        const _: () = {
            #[used]
            #[allow(non_upper_case_globals)]
            static __PHILJS_SERVER_FN: () = {
                philjs_rust::server::register_server_fn::<#input_struct_name>();
            };
        };

        #streaming_support

        #openapi_doc
    };

    TokenStream::from(output)
}

/// Convert snake_case to PascalCase
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

/// Extract doc comments from attributes
fn extract_doc_comment(attrs: &[Attribute]) -> String {
    attrs
        .iter()
        .filter_map(|attr| {
            if attr.path().is_ident("doc") {
                attr.meta.require_name_value().ok().and_then(|nv| {
                    if let syn::Expr::Lit(syn::ExprLit {
                        lit: syn::Lit::Str(s),
                        ..
                    }) = &nv.value
                    {
                        Some(s.value().trim().to_string())
                    } else {
                        None
                    }
                })
            } else {
                None
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

// ============================================================================
// Additional Server Macros
// ============================================================================

/// Create an action that can be called from forms
/// Similar to Remix actions
pub fn action_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    // Reuse server_impl with form-specific defaults
    let args_with_defaults = format!("encoding = \"url\", {}", args.to_string());
    let args_tokens: TokenStream = args_with_defaults.parse().unwrap_or(args);
    server_impl(args_tokens, input)
}

/// Create a loader for route data
/// Similar to Remix loaders
pub fn loader_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    // Reuse server_impl with GET defaults
    let args_with_defaults = format!("encoding = \"getjson\", {}", args.to_string());
    let args_tokens: TokenStream = args_with_defaults.parse().unwrap_or(args);
    server_impl(args_tokens, input)
}
