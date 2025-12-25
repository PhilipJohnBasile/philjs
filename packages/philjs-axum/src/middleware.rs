//! Middleware for Axum

use axum::{body::Body, http::Request, response::Response};
use std::task::{Context, Poll};
use tower::{Layer, Service};
use std::future::Future;
use std::pin::Pin;

/// PhilJS middleware layer
#[derive(Clone)]
pub struct PhilJsLayer;

impl PhilJsLayer {
    pub fn new() -> Self {
        Self
    }
}

impl Default for PhilJsLayer {
    fn default() -> Self {
        Self::new()
    }
}

impl<S> Layer<S> for PhilJsLayer {
    type Service = PhilJsMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        PhilJsMiddleware { inner }
    }
}

#[derive(Clone)]
pub struct PhilJsMiddleware<S> {
    inner: S,
}

impl<S> Service<Request<Body>> for PhilJsMiddleware<S>
where
    S: Service<Request<Body>, Response = Response> + Clone + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<Body>) -> Self::Future {
        let fut = self.inner.call(req);
        Box::pin(async move {
            let res = fut.await?;
            Ok(res)
        })
    }
}
