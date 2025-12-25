//! Utility functions for proc macros

use proc_macro2::{Ident, Span};
use syn::{parse_quote, FnArg, Pat, Type};

/// Convert a function name to PascalCase for component names
pub fn to_pascal_case(s: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = true;

    for c in s.chars() {
        if c == '_' {
            capitalize_next = true;
        } else if capitalize_next {
            result.push(c.to_ascii_uppercase());
            capitalize_next = false;
        } else {
            result.push(c);
        }
    }

    result
}

/// Extract the pattern and type from a function argument
pub fn extract_arg_pat_type(arg: &FnArg) -> Option<(&Pat, &Type)> {
    match arg {
        FnArg::Typed(pat_type) => Some((&pat_type.pat, &pat_type.ty)),
        _ => None,
    }
}

/// Generate a display name for a component
pub fn generate_display_name(fn_name: &Ident) -> String {
    to_pascal_case(&fn_name.to_string())
}

/// Check if a type is a specific path (e.g., "Scope" or "ComponentProps")
pub fn is_type_path(ty: &Type, expected: &str) -> bool {
    if let Type::Path(type_path) = ty {
        type_path.path.segments.last()
            .map(|seg| seg.ident == expected)
            .unwrap_or(false)
    } else {
        false
    }
}

/// Create a new identifier with the given name
pub fn new_ident(name: &str) -> Ident {
    Ident::new(name, Span::call_site())
}

/// Generate a unique identifier based on a base name and index
pub fn unique_ident(base: &str, index: usize) -> Ident {
    Ident::new(&format!("{}_{}", base, index), Span::call_site())
}
