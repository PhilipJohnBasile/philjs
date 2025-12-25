//! PhilJS Application builder for Rocket

use rocket::{Build, Rocket, Route};
use rocket::fairing::Fairing;
use crate::config::PhilJsConfig;
use crate::fairing::{PhilJsSsrFairing, PhilJsLiveViewFairing, PhilJsMetricsFairing, PhilJsCorsFairing, PhilJsSecurityFairing};
use crate::state::AppState;

/// PhilJS Rocket Application builder
pub struct PhilJsApp {
    rocket: Rocket<Build>,
    config: PhilJsConfig,
}

impl PhilJsApp {
    /// Create a new PhilJS application
    pub fn new() -> Self {
        Self {
            rocket: rocket::build(),
            config: PhilJsConfig::default(),
        }
    }

    /// Create with custom Rocket configuration
    pub fn with_rocket(rocket: Rocket<Build>) -> Self {
        Self {
            rocket,
            config: PhilJsConfig::default(),
        }
    }

    /// Set PhilJS configuration
    pub fn config(mut self, config: PhilJsConfig) -> Self {
        self.config = config;
        self
    }

    /// Add SSR support
    pub fn with_ssr(mut self) -> Self {
        self.rocket = self.rocket.attach(PhilJsSsrFairing::new());
        self
    }

    /// Add SSR support with custom configuration
    pub fn with_ssr_config(mut self, fairing: PhilJsSsrFairing) -> Self {
        self.rocket = self.rocket.attach(fairing);
        self
    }

    /// Add LiveView support
    pub fn with_liveview(mut self) -> Self {
        self.rocket = self.rocket.attach(PhilJsLiveViewFairing::new());
        self
    }

    /// Add LiveView support with custom configuration
    pub fn with_liveview_config(mut self, fairing: PhilJsLiveViewFairing) -> Self {
        self.rocket = self.rocket.attach(fairing);
        self
    }

    /// Add metrics/logging support
    pub fn with_metrics(mut self) -> Self {
        self.rocket = self.rocket.attach(PhilJsMetricsFairing::new());
        self
    }

    /// Add CORS support
    pub fn with_cors(mut self) -> Self {
        self.rocket = self.rocket.attach(PhilJsCorsFairing::new());
        self
    }

    /// Add CORS support with custom configuration
    pub fn with_cors_config(mut self, fairing: PhilJsCorsFairing) -> Self {
        self.rocket = self.rocket.attach(fairing);
        self
    }

    /// Add security headers
    pub fn with_security(mut self) -> Self {
        self.rocket = self.rocket.attach(PhilJsSecurityFairing::new());
        self
    }

    /// Add security headers with custom configuration
    pub fn with_security_config(mut self, fairing: PhilJsSecurityFairing) -> Self {
        self.rocket = self.rocket.attach(fairing);
        self
    }

    /// Add a custom fairing
    pub fn attach<F: Fairing>(mut self, fairing: F) -> Self {
        self.rocket = self.rocket.attach(fairing);
        self
    }

    /// Mount routes at a base path
    pub fn mount(mut self, base: &str, routes: Vec<Route>) -> Self {
        self.rocket = self.rocket.mount(base, routes);
        self
    }

    /// Add application state
    pub fn manage<T: Send + Sync + 'static>(mut self, state: T) -> Self {
        self.rocket = self.rocket.manage(state);
        self
    }

    /// Add managed PhilJS app state
    pub fn with_state(mut self, state: AppState) -> Self {
        self.rocket = self.rocket.manage(state);
        self
    }

    /// Register error catchers
    pub fn register_catchers(mut self, catchers: Vec<rocket::Catcher>) -> Self {
        self.rocket = self.rocket.register("/", catchers);
        self
    }

    /// Enable template support
    #[cfg(feature = "templates")]
    pub fn with_templates(mut self) -> Self {
        self.rocket = self.rocket.attach(crate::templates::template_fairing());
        self
    }

    /// Serve static files from a directory
    pub fn static_files(mut self, path: &str, dir: &str) -> Self {
        use rocket::fs::FileServer;
        self.rocket = self.rocket.mount(path, FileServer::from(dir));
        self
    }

    /// Build the Rocket application
    pub fn build(mut self) -> Rocket<Build> {
        // Add configuration as managed state
        self.rocket = self.rocket.manage(self.config);
        self.rocket
    }

    /// Launch the application
    pub fn launch(self) -> Rocket<Build> {
        self.build()
    }
}

impl Default for PhilJsApp {
    fn default() -> Self {
        Self::new()
    }
}

/// Quick configuration presets
pub struct PhilJsPresets;

impl PhilJsPresets {
    /// Full-stack preset with SSR, LiveView, and all features
    pub fn fullstack() -> PhilJsApp {
        PhilJsApp::new()
            .with_ssr()
            .with_liveview()
            .with_metrics()
            .with_cors()
            .with_security()
    }

    /// API-only preset
    pub fn api() -> PhilJsApp {
        PhilJsApp::new()
            .with_metrics()
            .with_cors()
            .with_security()
    }

    /// Static site preset with SSR
    pub fn static_site() -> PhilJsApp {
        PhilJsApp::new()
            .with_ssr()
            .with_security()
    }

    /// Development preset with minimal features
    pub fn development() -> PhilJsApp {
        PhilJsApp::new()
            .with_ssr()
            .with_metrics()
            .with_cors_config(PhilJsCorsFairing::new().origins(vec!["*"]))
    }
}

/// Route builder helpers
pub mod routes {
    use rocket::{Route, route::Outcome};
    use rocket::http::Method;

    /// Create a health check route
    pub fn health_check() -> Vec<Route> {
        use rocket::{get, routes};

        #[get("/health")]
        async fn health() -> &'static str {
            r#"{"status":"ok"}"#
        }

        routes![health]
    }

    /// Create not found catcher
    pub fn not_found_catcher() -> rocket::Catcher {
        use rocket::{catch, catchers, Request};

        #[catch(404)]
        fn not_found(req: &Request) -> String {
            format!(
                r#"{{"error":"Not Found","path":"{}","status":404}}"#,
                req.uri()
            )
        }

        catchers![not_found].into_iter().next().unwrap()
    }

    /// Create internal error catcher
    pub fn internal_error_catcher() -> rocket::Catcher {
        use rocket::{catch, catchers, Request};

        #[catch(500)]
        fn internal_error(_req: &Request) -> &'static str {
            r#"{"error":"Internal Server Error","status":500}"#
        }

        catchers![internal_error].into_iter().next().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_builder() {
        let _app = PhilJsApp::new()
            .with_ssr()
            .with_metrics()
            .build();
    }

    #[test]
    fn test_presets() {
        let _fullstack = PhilJsPresets::fullstack();
        let _api = PhilJsPresets::api();
        let _static = PhilJsPresets::static_site();
        let _dev = PhilJsPresets::development();
    }
}
