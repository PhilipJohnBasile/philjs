//! Advanced patterns and best practices for philjs-macros

use philjs_macros::{component, view, Props, signal, server};
use std::rc::Rc;

// Pattern 1: Shared State with Signals
#[signal]
struct AppState {
    user: Option<User>,
    theme: Theme,
    notifications: Vec<Notification>,
    loading: bool,
}

#[derive(Clone)]
struct User {
    id: u32,
    name: String,
}

#[derive(Clone)]
enum Theme {
    Light,
    Dark,
}

#[derive(Clone)]
struct Notification {
    id: u32,
    message: String,
}

// Pattern 2: Props with Callbacks and Event Handlers
#[derive(Props, Clone)]
struct DataTableProps<T: Clone> {
    data: Vec<T>,
    columns: Vec<Column<T>>,

    #[prop(optional)]
    on_row_click: Option<Callback<usize>>,

    #[prop(optional)]
    on_sort: Option<Callback<String>>,

    #[prop(default = "10")]
    page_size: usize,
}

#[derive(Clone)]
struct Column<T> {
    header: String,
    render: Rc<dyn Fn(&T) -> String>,
}

// Pattern 3: Async Server Functions with Error Handling
#[derive(Debug, thiserror::Error)]
enum ApiError {
    #[error("Not found")]
    NotFound,

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Database error: {0}")]
    Database(String),
}

#[server]
async fn fetch_user_profile(user_id: u32) -> Result<UserProfile, ApiError> {
    let db = get_database().await?;

    let user = db.get_user(user_id)
        .await
        .ok_or(ApiError::NotFound)?;

    let posts = db.get_user_posts(user_id).await?;

    Ok(UserProfile {
        user,
        posts,
        followers_count: db.count_followers(user_id).await?,
    })
}

#[derive(serde::Serialize, serde::Deserialize)]
struct UserProfile {
    user: User,
    posts: Vec<Post>,
    followers_count: u32,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct Post {
    id: u32,
    title: String,
    content: String,
}

// Pattern 4: Higher-Order Components
#[component]
fn WithAuth<F>(check_auth: F, children: Children) -> impl IntoView
where
    F: Fn() -> bool + 'static,
{
    view! {
        {if check_auth() {
            view! { {children} }
        } else {
            view! {
                <div class="auth-required">
                    <p>"You must be logged in to view this content"</p>
                    <a href="/login">"Login"</a>
                </div>
            }
        }}
    }
}

// Pattern 5: Form Handling with Validation
#[signal]
struct FormState {
    username: String,
    email: String,
    password: String,
    errors: Vec<String>,
    submitting: bool,
}

impl FormState {
    fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();

        if self.username().len() < 3 {
            errors.push("Username must be at least 3 characters".to_string());
        }

        if !self.email().contains('@') {
            errors.push("Invalid email address".to_string());
        }

        if self.password().len() < 8 {
            errors.push("Password must be at least 8 characters".to_string());
        }

        errors
    }
}

#[component]
fn RegistrationForm() -> impl IntoView {
    let form = FormState::new(
        String::new(),
        String::new(),
        String::new(),
        Vec::new(),
        false,
    );

    let on_submit = move |e: Event| {
        e.prevent_default();

        let errors = form.validate();
        form.set_errors(errors.clone());

        if errors.is_empty() {
            form.set_submitting(true);

            spawn_local(async move {
                match register_user(
                    form.username(),
                    form.email(),
                    form.password(),
                ).await {
                    Ok(_) => {
                        // Redirect to success page
                        navigate("/welcome");
                    }
                    Err(e) => {
                        form.set_errors(vec![e.to_string()]);
                        form.set_submitting(false);
                    }
                }
            });
        }
    };

    view! {
        <form on:submit={on_submit}>
            <div class="form-group">
                <label>"Username"</label>
                <input
                    type="text"
                    value={form.username()}
                    on:input={move |e| form.set_username(e.target.value)}
                    disabled={form.submitting()}
                />
            </div>

            <div class="form-group">
                <label>"Email"</label>
                <input
                    type="email"
                    value={form.email()}
                    on:input={move |e| form.set_email(e.target.value)}
                    disabled={form.submitting()}
                />
            </div>

            <div class="form-group">
                <label>"Password"</label>
                <input
                    type="password"
                    value={form.password()}
                    on:input={move |e| form.set_password(e.target.value)}
                    disabled={form.submitting()}
                />
            </div>

            {(!form.errors().is_empty()).then(|| view! {
                <div class="errors">
                    {form.errors().iter().map(|error| view! {
                        <p class="error">{error}</p>
                    }).collect::<Vec<_>>()}
                </div>
            })}

            <button type="submit" disabled={form.submitting()}>
                {if form.submitting() { "Submitting..." } else { "Register" }}
            </button>
        </form>
    }
}

// Pattern 6: Resource Loading with Suspense
#[component]
fn UserDashboard(user_id: u32) -> impl IntoView {
    let profile = create_resource(
        move || user_id,
        |id| async move { fetch_user_profile(id).await },
    );

    view! {
        <div class="dashboard">
            <Suspense fallback={view! { <Spinner /> }}>
                {move || profile.read().map(|data| view! {
                    <div>
                        <h1>{data.user.name}</h1>
                        <p>"Followers: " {data.followers_count}</p>

                        <h2>"Recent Posts"</h2>
                        <div class="posts">
                            {data.posts.iter().map(|post| view! {
                                <article>
                                    <h3>{&post.title}</h3>
                                    <p>{&post.content}</p>
                                </article>
                            }).collect::<Vec<_>>()}
                        </div>
                    </div>
                })}
            </Suspense>
        </div>
    }
}

// Pattern 7: Reusable UI Components Library
pub mod components {
    use super::*;

    #[derive(Props, Clone)]
    pub struct ModalProps {
        #[prop(into)]
        pub title: String,

        pub open: bool,

        #[prop(optional)]
        pub on_close: Option<Callback<()>>,

        pub children: Children,
    }

    #[component]
    pub fn Modal(props: ModalProps) -> impl IntoView {
        view! {
            {props.open.then(|| view! {
                <div class="modal-overlay" on:click={props.on_close.clone()}>
                    <div class="modal" on:click={|e| e.stop_propagation()}>
                        <div class="modal-header">
                            <h2>{props.title}</h2>
                            {props.on_close.map(|close| view! {
                                <button class="close" on:click={close}>"×"</button>
                            })}
                        </div>
                        <div class="modal-body">
                            {props.children}
                        </div>
                    </div>
                </div>
            })}
        }
    }

    #[derive(Props, Clone)]
    pub struct TabsProps {
        pub tabs: Vec<Tab>,

        #[prop(default = "0")]
        pub initial_tab: usize,
    }

    #[derive(Clone)]
    pub struct Tab {
        pub label: String,
        pub content: View,
    }

    #[component]
    pub fn Tabs(props: TabsProps) -> impl IntoView {
        let active_tab = create_signal(props.initial_tab);

        view! {
            <div class="tabs">
                <div class="tab-headers">
                    {props.tabs.iter().enumerate().map(|(i, tab)| view! {
                        <button
                            class={if i == active_tab.get() { "active" } else { "" }}
                            on:click={move |_| active_tab.set(i)}
                        >
                            {&tab.label}
                        </button>
                    }).collect::<Vec<_>>()}
                </div>
                <div class="tab-content">
                    {props.tabs.get(active_tab.get()).map(|tab| &tab.content)}
                </div>
            </div>
        }
    }
}

// Pattern 8: Server Functions with Caching
#[server(endpoint = "/api/users")]
async fn get_users() -> Result<Vec<User>, ApiError> {
    // Server-side caching
    static CACHE: OnceCell<RwLock<Option<(Vec<User>, Instant)>>> = OnceCell::new();
    let cache = CACHE.get_or_init(|| RwLock::new(None));

    {
        let cache_read = cache.read().await;
        if let Some((users, timestamp)) = &*cache_read {
            if timestamp.elapsed() < Duration::from_secs(60) {
                return Ok(users.clone());
            }
        }
    }

    let db = get_database().await?;
    let users = db.query_all_users().await?;

    let mut cache_write = cache.write().await;
    *cache_write = Some((users.clone(), Instant::now()));

    Ok(users)
}
