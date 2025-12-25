//! Context API for dependency injection

use std::any::{Any, TypeId};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

thread_local! {
    static CONTEXT: RefCell<ContextStack> = RefCell::new(ContextStack::new());
}

struct ContextStack {
    stack: Vec<HashMap<TypeId, Rc<dyn Any>>>,
}

impl ContextStack {
    fn new() -> Self {
        ContextStack {
            stack: vec![HashMap::new()],
        }
    }

    fn push(&mut self) {
        self.stack.push(HashMap::new());
    }

    fn pop(&mut self) {
        if self.stack.len() > 1 {
            self.stack.pop();
        }
    }

    fn provide<T: 'static>(&mut self, value: T) {
        if let Some(scope) = self.stack.last_mut() {
            scope.insert(TypeId::of::<T>(), Rc::new(value));
        }
    }

    fn get<T: 'static + Clone>(&self) -> Option<T> {
        let type_id = TypeId::of::<T>();
        for scope in self.stack.iter().rev() {
            if let Some(value) = scope.get(&type_id) {
                if let Some(v) = value.downcast_ref::<T>() {
                    return Some(v.clone());
                }
            }
        }
        None
    }
}

/// A context value that can be provided and consumed.
pub struct Context<T> {
    _marker: std::marker::PhantomData<T>,
}

impl<T: 'static + Clone> Context<T> {
    /// Create a new context.
    pub const fn new() -> Self {
        Context {
            _marker: std::marker::PhantomData,
        }
    }

    /// Provide a value for this context.
    pub fn provide(&self, value: T) {
        provide_context(value);
    }

    /// Use the context value.
    pub fn use_context(&self) -> Option<T> {
        use_context::<T>()
    }

    /// Use the context value, panicking if not found.
    pub fn expect(&self, msg: &str) -> T {
        self.use_context().expect(msg)
    }
}

impl<T: 'static + Clone + Default> Context<T> {
    /// Use the context value, returning default if not found.
    pub fn use_or_default(&self) -> T {
        self.use_context().unwrap_or_default()
    }
}

/// Provide a context value.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// #[derive(Clone)]
/// struct Theme {
///     primary: String,
///     secondary: String,
/// }
///
/// provide_context(Theme {
///     primary: "#007bff".to_string(),
///     secondary: "#6c757d".to_string(),
/// });
/// ```
pub fn provide_context<T: 'static>(value: T) {
    CONTEXT.with(|ctx| ctx.borrow_mut().provide(value));
}

/// Use a context value.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let theme: Option<Theme> = use_context();
/// ```
pub fn use_context<T: 'static + Clone>() -> Option<T> {
    CONTEXT.with(|ctx| ctx.borrow().get::<T>())
}

/// Run a function with a new context scope.
pub fn with_context_scope<R>(f: impl FnOnce() -> R) -> R {
    CONTEXT.with(|ctx| ctx.borrow_mut().push());
    let result = f();
    CONTEXT.with(|ctx| ctx.borrow_mut().pop());
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context() {
        #[derive(Clone, PartialEq, Debug)]
        struct TestContext(i32);

        provide_context(TestContext(42));
        let value = use_context::<TestContext>();
        assert_eq!(value, Some(TestContext(42)));
    }

    #[test]
    fn test_context_scope() {
        #[derive(Clone, PartialEq, Debug)]
        struct TestContext(i32);

        provide_context(TestContext(1));

        with_context_scope(|| {
            provide_context(TestContext(2));
            assert_eq!(use_context::<TestContext>(), Some(TestContext(2)));
        });

        assert_eq!(use_context::<TestContext>(), Some(TestContext(1)));
    }
}
