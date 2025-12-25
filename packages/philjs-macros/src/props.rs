//! Props derive macro implementation
//!
//! Derives the Props trait with support for optional props and defaults.

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields, Meta, Lit};
use darling::{FromDeriveInput, FromField};

#[derive(Debug, FromField)]
#[darling(attributes(prop))]
struct PropField {
    ident: Option<syn::Ident>,
    ty: syn::Type,

    #[darling(default)]
    default: Option<String>,

    #[darling(default)]
    optional: bool,

    #[darling(default)]
    into: bool,
}

#[derive(Debug, FromDeriveInput)]
#[darling(attributes(prop))]
struct PropsInput {
    ident: syn::Ident,
    generics: syn::Generics,
    data: darling::ast::Data<(), PropField>,
}

/// Implementation of the #[derive(Props)] macro
pub fn derive_props_impl(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let props_input = match PropsInput::from_derive_input(&input) {
        Ok(v) => v,
        Err(e) => return TokenStream::from(e.write_errors()),
    };

    let struct_name = &props_input.ident;
    let generics = &props_input.generics;
    let where_clause = &generics.where_clause;

    let fields = match props_input.data {
        darling::ast::Data::Struct(fields) => fields.fields,
        _ => {
            return TokenStream::from(
                quote! {
                    compile_error!("#[derive(Props)] can only be applied to structs");
                }
            )
        }
    };

    // Generate builder pattern
    let builder_name = quote::format_ident!("{}Builder", struct_name);

    let mut builder_fields = Vec::new();
    let mut builder_methods = Vec::new();
    let mut builder_inits = Vec::new();
    let mut builder_build_fields = Vec::new();

    for field in fields {
        let field_name = field.ident.as_ref().unwrap();
        let field_type = &field.ty;

        if field.optional {
            // Optional field
            builder_fields.push(quote! {
                #field_name: Option<#field_type>
            });

            builder_inits.push(quote! {
                #field_name: None
            });

            if field.into {
                builder_methods.push(quote! {
                    pub fn #field_name(mut self, value: impl Into<#field_type>) -> Self {
                        self.#field_name = Some(value.into());
                        self
                    }
                });
            } else {
                builder_methods.push(quote! {
                    pub fn #field_name(mut self, value: #field_type) -> Self {
                        self.#field_name = Some(value);
                        self
                    }
                });
            }

            builder_build_fields.push(quote! {
                #field_name: self.#field_name
            });
        } else if let Some(default_val) = &field.default {
            // Field with default
            builder_fields.push(quote! {
                #field_name: Option<#field_type>
            });

            builder_inits.push(quote! {
                #field_name: None
            });

            if field.into {
                builder_methods.push(quote! {
                    pub fn #field_name(mut self, value: impl Into<#field_type>) -> Self {
                        self.#field_name = Some(value.into());
                        self
                    }
                });
            } else {
                builder_methods.push(quote! {
                    pub fn #field_name(mut self, value: #field_type) -> Self {
                        self.#field_name = Some(value);
                        self
                    }
                });
            }

            // Parse default value
            let default_expr: syn::Expr = syn::parse_str(default_val)
                .unwrap_or_else(|_| syn::parse_quote! { Default::default() });

            builder_build_fields.push(quote! {
                #field_name: self.#field_name.unwrap_or_else(|| #default_expr)
            });
        } else {
            // Required field
            builder_fields.push(quote! {
                #field_name: Option<#field_type>
            });

            builder_inits.push(quote! {
                #field_name: None
            });

            if field.into {
                builder_methods.push(quote! {
                    pub fn #field_name(mut self, value: impl Into<#field_type>) -> Self {
                        self.#field_name = Some(value.into());
                        self
                    }
                });
            } else {
                builder_methods.push(quote! {
                    pub fn #field_name(mut self, value: #field_type) -> Self {
                        self.#field_name = Some(value);
                        self
                    }
                });
            }

            let error_msg = format!("Missing required prop: {}", field_name);
            builder_build_fields.push(quote! {
                #field_name: self.#field_name.expect(#error_msg)
            });
        }
    }

    let output = quote! {
        pub struct #builder_name #generics #where_clause {
            #(#builder_fields),*
        }

        impl #generics #builder_name #generics #where_clause {
            pub fn new() -> Self {
                Self {
                    #(#builder_inits),*
                }
            }

            #(#builder_methods)*

            pub fn build(self) -> #struct_name #generics {
                #struct_name {
                    #(#builder_build_fields),*
                }
            }
        }

        impl #generics Default for #builder_name #generics #where_clause {
            fn default() -> Self {
                Self::new()
            }
        }

        impl #generics philjs::Props for #struct_name #generics #where_clause {
            type Builder = #builder_name #generics;

            fn builder() -> Self::Builder {
                #builder_name::new()
            }
        }
    };

    TokenStream::from(output)
}
