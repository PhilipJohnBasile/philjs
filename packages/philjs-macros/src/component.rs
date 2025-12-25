//! Component macro implementation
//!
//! Transforms functions into PhilJS components with proper props handling
//! and display name generation.

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, FnArg, Pat, ReturnType};
use darling::FromMeta;

use crate::utils::{generate_display_name, extract_arg_pat_type};

#[derive(Debug, FromMeta, Default)]
struct ComponentArgs {
    #[darling(default)]
    transparent: bool,
}

/// Implementation of the #[component] macro
pub fn component_impl(args: TokenStream, input: TokenStream) -> TokenStream {
    let args = match darling::ast::NestedMeta::parse_meta_list(args.into()) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(darling::Error::from(e).write_errors()),
    };

    let args = match ComponentArgs::from_list(&args) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(e.write_errors()),
    };

    let input_fn = parse_macro_input!(input as ItemFn);

    let fn_name = &input_fn.sig.ident;
    let fn_generics = &input_fn.sig.generics;
    let fn_where = &input_fn.sig.generics.where_clause;
    let fn_block = &input_fn.block;
    let fn_vis = &input_fn.vis;
    let fn_async = &input_fn.sig.asyncness;
    let return_type = &input_fn.sig.output;

    // Generate component display name
    let display_name = generate_display_name(fn_name);

    // Extract props from function arguments
    let mut props_args = Vec::new();
    let mut prop_bindings = Vec::new();

    for arg in &input_fn.sig.inputs {
        if let Some((pat, ty)) = extract_arg_pat_type(arg) {
            props_args.push(quote! { #pat: #ty });

            if let Pat::Ident(pat_ident) = pat {
                let field_name = &pat_ident.ident;
                prop_bindings.push(quote! { let #field_name = props.#field_name; });
            }
        }
    }

    // Determine if we need to wrap in a component struct or use transparent mode
    let output = if args.transparent {
        // Transparent mode - just add metadata without wrapping
        quote! {
            #[allow(non_snake_case)]
            #fn_vis #fn_async fn #fn_name #fn_generics(
                #(#props_args),*
            ) #return_type #fn_where {
                #fn_block
            }

            impl philjs::ComponentName for #fn_name {
                fn component_name() -> &'static str {
                    #display_name
                }
            }
        }
    } else {
        // Create props struct
        let props_struct_name = quote::format_ident!("{}Props", fn_name);

        // Extract individual prop fields for the struct
        let mut struct_fields = Vec::new();
        let mut struct_field_names = Vec::new();

        for arg in &input_fn.sig.inputs {
            if let FnArg::Typed(pat_type) = arg {
                if let Pat::Ident(pat_ident) = &*pat_type.pat {
                    let field_name = &pat_ident.ident;
                    let field_type = &pat_type.ty;
                    struct_fields.push(quote! {
                        pub #field_name: #field_type
                    });
                    struct_field_names.push(field_name);
                }
            }
        }

        quote! {
            // Generate props struct
            #[derive(Clone)]
            pub struct #props_struct_name #fn_generics #fn_where {
                #(#struct_fields),*
            }

            // Component function
            #[allow(non_snake_case)]
            #fn_vis #fn_async fn #fn_name #fn_generics(
                props: #props_struct_name #fn_generics
            ) #return_type #fn_where {
                #(#prop_bindings)*
                #fn_block
            }

            impl #fn_generics philjs::ComponentName for #props_struct_name #fn_generics #fn_where {
                fn component_name() -> &'static str {
                    #display_name
                }
            }

            impl #fn_generics philjs::Component for #props_struct_name #fn_generics #fn_where {
                type Output = <#return_type as philjs::IntoView>::Output;

                fn render(self) -> Self::Output {
                    #fn_name(self)
                }
            }
        }
    };

    TokenStream::from(output)
}
