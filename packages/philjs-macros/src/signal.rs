//! Signal macro implementation
//!
//! Creates reactive signals from struct fields with automatic getter/setter generation.

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

/// Implementation of the #[signal] macro
pub fn signal_impl(_args: TokenStream, input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let struct_name = &input.ident;
    let generics = &input.generics;
    let where_clause = &input.generics.where_clause;
    let vis = &input.vis;

    let fields = match &input.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => {
                return TokenStream::from(
                    quote! {
                        compile_error!("#[signal] only supports structs with named fields");
                    }
                )
            }
        },
        _ => {
            return TokenStream::from(
                quote! {
                    compile_error!("#[signal] can only be applied to structs");
                }
            )
        }
    };

    // Generate signal fields and methods
    let mut signal_fields = Vec::new();
    let mut signal_inits = Vec::new();
    let mut getters = Vec::new();
    let mut setters = Vec::new();
    let mut updaters = Vec::new();

    for field in fields {
        let field_name = field.ident.as_ref().unwrap();
        let field_type = &field.ty;
        let signal_field = quote::format_ident!("{}_signal", field_name);

        // Signal field in struct
        signal_fields.push(quote! {
            #signal_field: philjs::Signal<#field_type>
        });

        // Initialize signal in new()
        signal_inits.push(quote! {
            #signal_field: philjs::Signal::new(#field_name)
        });

        // Getter method
        getters.push(quote! {
            pub fn #field_name(&self) -> #field_type
            where
                #field_type: Clone
            {
                self.#signal_field.get()
            }
        });

        // Setter method
        let setter_name = quote::format_ident!("set_{}", field_name);
        setters.push(quote! {
            pub fn #setter_name(&self, value: #field_type) {
                self.#signal_field.set(value);
            }
        });

        // Update method
        let update_name = quote::format_ident!("update_{}", field_name);
        updaters.push(quote! {
            pub fn #update_name(&self, f: impl FnOnce(&mut #field_type)) {
                self.#signal_field.update(f);
            }
        });
    }

    // Extract original field names and types for constructor
    let original_fields: Vec<_> = fields.iter()
        .map(|f| {
            let name = f.ident.as_ref().unwrap();
            let ty = &f.ty;
            quote! { #name: #ty }
        })
        .collect();

    let original_field_names: Vec<_> = fields.iter()
        .map(|f| f.ident.as_ref().unwrap())
        .collect();

    let output = quote! {
        #[derive(Clone)]
        #vis struct #struct_name #generics #where_clause {
            #(#signal_fields),*
        }

        impl #generics #struct_name #generics #where_clause {
            pub fn new(#(#original_fields),*) -> Self {
                Self {
                    #(#signal_inits),*
                }
            }

            #(#getters)*
            #(#setters)*
            #(#updaters)*
        }
    };

    TokenStream::from(output)
}
