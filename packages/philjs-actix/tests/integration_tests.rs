//! Integration tests for PhilJS Actix-web integration

use actix_web::{test, web, App, HttpResponse};
use philjs_actix::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
struct TestUser {
    id: i64,
    name: String,
    email: String,
}

#[actix_rt::test]
async fn test_health_check_handler() {
    use philjs_actix::handlers::health_check;

    let app = test::init_service(App::new().route("/health", web::get().to(health_check))).await;

    let req = test::TestRequest::get().uri("/health").to_request();
    let resp = test::call_service(&app, req).await;

    assert!(resp.status().is_success());
}

#[actix_rt::test]
async fn test_not_found_handler() {
    use philjs_actix::handlers::not_found;

    let app = test::init_service(
        App::new().default_service(web::to(not_found)),
    )
    .await;

    let req = test::TestRequest::get().uri("/nonexistent").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 404);
}

#[actix_rt::test]
async fn test_json_extractor() {
    use philjs_actix::extractors::Json;

    async fn create_user(Json(user): Json<TestUser>) -> HttpResponse {
        HttpResponse::Ok().json(user)
    }

    let app = test::init_service(App::new().route("/users", web::post().to(create_user))).await;

    let user = TestUser {
        id: 1,
        name: "Test User".to_string(),
        email: "test@example.com".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/users")
        .set_json(&user)
        .to_request();

    let resp: TestUser = test::call_and_read_body_json(&app, req).await;
    assert_eq!(resp, user);
}

#[actix_rt::test]
async fn test_query_extractor() {
    use philjs_actix::extractors::Query;

    #[derive(Deserialize)]
    struct SearchQuery {
        q: String,
    }

    async fn search(Query(query): Query<SearchQuery>) -> HttpResponse {
        HttpResponse::Ok().body(query.q)
    }

    let app = test::init_service(App::new().route("/search", web::get().to(search))).await;

    let req = test::TestRequest::get()
        .uri("/search?q=test")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

#[actix_rt::test]
async fn test_path_extractor() {
    use philjs_actix::extractors::Path;

    #[derive(Deserialize)]
    struct UserPath {
        id: i64,
    }

    async fn get_user(Path(params): Path<UserPath>) -> HttpResponse {
        HttpResponse::Ok().body(format!("User ID: {}", params.id))
    }

    let app = test::init_service(App::new().route("/users/{id}", web::get().to(get_user))).await;

    let req = test::TestRequest::get().uri("/users/123").to_request();
    let resp = test::call_service(&app, req).await;

    assert!(resp.status().is_success());
}

#[actix_rt::test]
async fn test_ssr_context_extractor() {
    use philjs_actix::extractors::SsrContext;

    async fn ssr_handler(ctx: SsrContext) -> HttpResponse {
        HttpResponse::Ok().body(format!("Path: {}", ctx.path()))
    }

    let app = test::init_service(App::new().route("/page", web::get().to(ssr_handler))).await;

    let req = test::TestRequest::get()
        .uri("/page")
        .insert_header(("user-agent", "test-agent"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

#[actix_rt::test]
async fn test_api_response_builder() {
    use philjs_actix::handlers::ApiResponse;

    async fn success_handler() -> HttpResponse {
        ApiResponse::success("Hello").with_message("Success").build()
    }

    async fn error_handler() -> HttpResponse {
        ApiResponse::<()>::error("Something went wrong").build()
    }

    let app = test::init_service(
        App::new()
            .route("/success", web::get().to(success_handler))
            .route("/error", web::get().to(error_handler)),
    )
    .await;

    let req = test::TestRequest::get().uri("/success").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 200);

    let req = test::TestRequest::get().uri("/error").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);
}

#[actix_rt::test]
async fn test_pagination_params() {
    use philjs_actix::handlers::{PaginationParams, PaginatedResponse};

    async fn list_users(params: web::Query<PaginationParams>) -> HttpResponse {
        let users = vec![
            TestUser {
                id: 1,
                name: "User 1".to_string(),
                email: "user1@example.com".to_string(),
            },
            TestUser {
                id: 2,
                name: "User 2".to_string(),
                email: "user2@example.com".to_string(),
            },
        ];

        PaginatedResponse::new(users, 100, params.page, params.per_page).build()
    }

    let app = test::init_service(App::new().route("/users", web::get().to(list_users))).await;

    let req = test::TestRequest::get()
        .uri("/users?page=2&per_page=20")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

#[actix_rt::test]
async fn test_redirect_handler() {
    use philjs_actix::handlers::redirect;

    async fn old_route() -> HttpResponse {
        redirect("/new-route", false)
    }

    let app = test::init_service(App::new().route("/old", web::get().to(old_route))).await;

    let req = test::TestRequest::get().uri("/old").to_request();
    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 302);
    assert!(resp.headers().contains_key("location"));
}

#[actix_rt::test]
async fn test_cors_preflight() {
    use philjs_actix::handlers::cors_preflight;

    let app = test::init_service(
        App::new().route("/api/endpoint", web::options().to(cors_preflight)),
    )
    .await;

    let req = test::TestRequest::with_uri("/api/endpoint")
        .method(actix_web::http::Method::OPTIONS)
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    assert!(resp.headers().contains_key("access-control-allow-origin"));
}

#[actix_rt::test]
async fn test_ssr_renderer() {
    use philjs_actix::ssr::{SsrRenderer, SsrConfig};

    let config = SsrConfig::default();
    let renderer = SsrRenderer::new(config);

    let html = renderer.render(|| "Hello, World!");
    assert_eq!(html, "Hello, World!");
}

#[actix_rt::test]
async fn test_html_document_builder() {
    use philjs_actix::ssr::{HtmlDocument, MetaTag, Script};

    let doc = HtmlDocument::new("Test Page")
        .lang("en")
        .meta(MetaTag::name("description", "A test page"))
        .stylesheet("/styles.css")
        .script(Script::src("/app.js").module())
        .body("<h1>Hello</h1>")
        .build();

    assert!(doc.contains("<!DOCTYPE html>"));
    assert!(doc.contains("<title>Test Page</title>"));
    assert!(doc.contains("<h1>Hello</h1>"));
    assert!(doc.contains("/styles.css"));
    assert!(doc.contains("/app.js"));
}

#[actix_rt::test]
async fn test_seo_builder() {
    use philjs_actix::ssr::SeoBuilder;

    let tags = SeoBuilder::new("My Page")
        .description("A great page")
        .keywords(vec!["rust", "web", "philjs"])
        .og("image", "https://example.com/image.jpg")
        .twitter("card", "summary_large_image")
        .build();

    assert!(!tags.is_empty());
    assert!(tags.iter().any(|t| t.clone().render().contains("description")));
}

#[actix_rt::test]
async fn test_error_handler() {
    use philjs_actix::handlers::ErrorHandler;

    let handler = ErrorHandler::new(500, "Internal Server Error");
    let response = handler.html();

    assert_eq!(response.status(), 500);

    let json_response = handler.json();
    assert_eq!(json_response.status(), 500);
}

#[test]
fn test_pagination_offset_calculation() {
    use philjs_actix::handlers::PaginationParams;

    let params = PaginationParams {
        page: 3,
        per_page: 25,
    };

    assert_eq!(params.offset(), 50);
    assert_eq!(params.limit(), 25);
}
