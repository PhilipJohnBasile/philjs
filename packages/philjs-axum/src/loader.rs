//! Data loaders for routes

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use serde::{de::DeserializeOwned, Serialize};
use std::future::Future;

use crate::error::PhilJSError;
use crate::state::AppState;

/// Trait for data loaders
#[async_trait]
pub trait Loader: Send + Sync {
    /// The data type returned by this loader
    type Data: Serialize + Send;

    /// Load data for the route
    async fn load(&self, ctx: LoaderContext) -> Result<Self::Data, PhilJSError>;
}

/// Context passed to loaders
#[derive(Clone)]
pub struct LoaderContext {
    /// Request path
    pub path: String,
    /// Path parameters
    pub params: std::collections::HashMap<String, String>,
    /// Query parameters
    pub query: std::collections::HashMap<String, String>,
    /// Application state
    pub state: AppState,
}

/// Extractor for loader data
pub struct LoaderData<T>(pub T);

#[async_trait]
impl<S, T> FromRequestParts<S> for LoaderData<T>
where
    S: Send + Sync,
    AppState: FromRef<S>,
    T: DeserializeOwned + Send + 'static,
{
    type Rejection = PhilJSError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // Check if data was already loaded and stored
        if let Some(data) = parts.extensions.get::<T>() {
            return Ok(LoaderData(data.clone()));
        }

        Err(PhilJSError::LoaderError("No loader data found".into()))
    }
}

/// Create a loader from an async function
pub fn loader<F, Fut, T>(f: F) -> impl Loader<Data = T>
where
    F: Fn(LoaderContext) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<T, PhilJSError>> + Send + 'static,
    T: Serialize + Send + 'static,
{
    FnLoader { f }
}

struct FnLoader<F> {
    f: F,
}

#[async_trait]
impl<F, Fut, T> Loader for FnLoader<F>
where
    F: Fn(LoaderContext) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<T, PhilJSError>> + Send + 'static,
    T: Serialize + Send + 'static,
{
    type Data = T;

    async fn load(&self, ctx: LoaderContext) -> Result<Self::Data, PhilJSError> {
        (self.f)(ctx).await
    }
}

/// Action trait for form submissions
#[async_trait]
pub trait Action: Send + Sync {
    /// The input type for this action
    type Input: DeserializeOwned + Send;
    /// The result type
    type Result: Serialize + Send;

    /// Execute the action
    async fn run(&self, input: Self::Input, ctx: ActionContext) -> Result<Self::Result, PhilJSError>;
}

/// Context passed to actions
#[derive(Clone)]
pub struct ActionContext {
    /// Request path
    pub path: String,
    /// Application state
    pub state: AppState,
}

/// Create an action from an async function
pub fn action<F, Fut, I, R>(f: F) -> impl Action<Input = I, Result = R>
where
    F: Fn(I, ActionContext) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<R, PhilJSError>> + Send + 'static,
    I: DeserializeOwned + Send + 'static,
    R: Serialize + Send + 'static,
{
    FnAction { f, _marker: std::marker::PhantomData }
}

struct FnAction<F, I> {
    f: F,
    _marker: std::marker::PhantomData<I>,
}

#[async_trait]
impl<F, Fut, I, R> Action for FnAction<F, I>
where
    F: Fn(I, ActionContext) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = Result<R, PhilJSError>> + Send + 'static,
    I: DeserializeOwned + Send + 'static,
    R: Serialize + Send + 'static,
{
    type Input = I;
    type Result = R;

    async fn run(&self, input: I, ctx: ActionContext) -> Result<R, PhilJSError> {
        (self.f)(input, ctx).await
    }
}
