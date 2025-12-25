//! Server function macro implementation
//!
//! Marks functions as server-only and generates RPC calls for client-side usage.

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, FnArg, Pat, ReturnType};
use darling::FromMeta;

#[derive(Debug, FromMeta, Default)]
struct ServerArgs {
    #[darling(default)]
    endpoint: Option<String>,

    #[darling(default)]
    prefix: Option<String>,
}

/// Implementation of the #[server] macro
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

    // Extract function arguments
    let mut arg_names = Vec::new();
    let mut arg_types = Vec::new();
    let mut input_struct_fields = Vec::new();

    for arg in &input_fn.sig.inputs {
        if let FnArg::Typed(pat_type) = arg {
            if let Pat::Ident(pat_ident) = &*pat_type.pat {
                let arg_name = &pat_ident.ident;
                let arg_type = &pat_type.ty;

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
    let endpoint_path = args.endpoint.unwrap_or_else(|| {
        let prefix = args.prefix.unwrap_or_else(|| "/api".to_string());
        format!("{}/{}", prefix, fn_name)
    });

    // Generate input/output structs
    let input_struct_name = quote::format_ident!("{}Input",
        fn_name.to_string()
            .chars()
            .next()
            .map(|c| c.to_uppercase().collect::<String>())
            .unwrap_or_default()
            + &fn_name.to_string()[1..]
    );

    let output = quote! {
        // Input struct for serialization
        #[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
        struct #input_struct_name #fn_generics #fn_where {
            #(#input_struct_fields),*
        }

        // Server-side implementation
        #[cfg(feature = "ssr")]
        #fn_vis #fn_async fn #fn_name #fn_generics(
            #(#arg_names: #arg_types),*
        ) -> #return_type #fn_where {
            #fn_block
        }

        // Client-side RPC stub
        #[cfg(not(feature = "ssr"))]
        #fn_vis async fn #fn_name #fn_generics(
            #(#arg_names: #arg_types),*
        ) -> #return_type #fn_where {
            let input = #input_struct_name {
                #(#arg_names),*
            };

            let response = philjs::fetch_json(#endpoint_path, &input)
                .await
                .expect("Server function call failed");

            response
        }

        // Register server function
        #[cfg(feature = "ssr")]
        philjs::inventory::submit! {
            philjs::ServerFn {
                path: #endpoint_path,
                handler: |req| Box::pin(async move {
                    let input: #input_struct_name = philjs::extract_json(req).await?;
                    let result = #fn_name(#(input.#arg_names),*).await;
                    philjs::json_response(result)
                }),
            }
        }
    };

    TokenStream::from(output)
}
