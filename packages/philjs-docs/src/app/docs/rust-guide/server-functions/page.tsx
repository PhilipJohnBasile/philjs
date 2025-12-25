import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Server Functions',
  description: 'Build type-safe server functions in PhilJS with Rust.',
};

export default function ServerFunctionsPage() {
  return (
    <div className="mdx-content">
      <h1>Server Functions</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Server functions allow you to call server-side Rust code directly from your frontend
        components with full type safety and automatic serialization.
      </p>

      <Callout type="info" title="How It Works">
        Server functions are compiled to both the client and server. On the client, they become
        RPC calls. On the server, they execute as regular Rust functions with access to
        databases, file systems, and environment variables.
      </Callout>

      <h2 id="basic-usage">Basic Usage</h2>

      <CodeBlock
        code={`use philjs::prelude::*;
use philjs_server::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Todo {
    pub id: i32,
    pub title: String,
    pub completed: bool,
}

// Define a server function
#[server(GetTodos)]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    // This code only runs on the server
    let todos = db::get_all_todos().await?;
    Ok(todos)
}

// Use in a component
#[component]
fn TodoList() -> impl IntoView {
    let todos = create_resource(|| (), |_| async move {
        get_todos().await
    });

    view! {
        <Suspense fallback=move || view! { <p>"Loading..."</p> }>
            {move || todos.get().map(|result| match result {
                Ok(todos) => view! {
                    <ul>
                        <For
                            each=move || todos.clone()
                            key=|todo| todo.id
                            children=|todo| view! {
                                <li>{todo.title}</li>
                            }
                        />
                    </ul>
                }.into_view(),
                Err(e) => view! { <p>"Error: " {e.to_string()}</p> }.into_view(),
            })}
        </Suspense>
    }
}`}
        language="rust"
        filename="server_functions.rs"
      />

      <h2 id="parameters">Function Parameters</h2>

      <CodeBlock
        code={`#[server(CreateTodo)]
pub async fn create_todo(
    title: String,
    description: Option<String>,
) -> Result<Todo, ServerFnError> {
    let todo = db::create_todo(&title, description.as_deref()).await?;
    Ok(todo)
}

#[server(UpdateTodo)]
pub async fn update_todo(
    id: i32,
    title: Option<String>,
    completed: Option<bool>,
) -> Result<Todo, ServerFnError> {
    let todo = db::update_todo(id, title.as_deref(), completed).await?;
    Ok(todo)
}

#[server(DeleteTodo)]
pub async fn delete_todo(id: i32) -> Result<(), ServerFnError> {
    db::delete_todo(id).await?;
    Ok(())
}`}
        language="rust"
      />

      <h2 id="server-actions">Server Actions</h2>

      <p>
        Use <code>create_server_action</code> for mutations that you want to track:
      </p>

      <CodeBlock
        code={`#[component]
fn TodoForm() -> impl IntoView {
    let (title, set_title) = create_signal(String::new());
    let create_todo = create_server_action::<CreateTodo>();

    // Access action state
    let pending = create_todo.pending();
    let result = create_todo.value();

    view! {
        <form on:submit=move |ev| {
            ev.prevent_default();
            create_todo.dispatch(CreateTodo {
                title: title(),
                description: None,
            });
            set_title(String::new());
        }>
            <input
                type="text"
                prop:value=title
                on:input=move |ev| set_title(event_target_value(&ev))
                disabled=pending
            />
            <button type="submit" disabled=pending>
                {move || if pending() { "Creating..." } else { "Create" }}
            </button>
        </form>

        // Show result
        {move || result().map(|r| match r {
            Ok(todo) => view! {
                <p class="success">"Created: " {todo.title}</p>
            }.into_view(),
            Err(e) => view! {
                <p class="error">"Error: " {e.to_string()}</p>
            }.into_view(),
        })}
    }
}`}
        language="rust"
      />

      <h2 id="multi-actions">Multi-Actions</h2>

      <p>
        For handling multiple concurrent submissions:
      </p>

      <CodeBlock
        code={`#[component]
fn BulkActions() -> impl IntoView {
    let delete_todo = create_server_multi_action::<DeleteTodo>();

    // Get all submissions
    let submissions = delete_todo.submissions();

    view! {
        <For
            each=move || todos()
            key=|todo| todo.id
            children=move |todo| {
                let id = todo.id;
                view! {
                    <li>
                        {todo.title}
                        <button on:click=move |_| {
                            delete_todo.dispatch(DeleteTodo { id });
                        }>
                            "Delete"
                        </button>
                    </li>
                }
            }
        />

        // Show pending deletions
        <For
            each=move || submissions().into_iter().filter(|s| s.pending())
            key=|s| s.input().id
            children=|s| view! {
                <p>"Deleting " {s.input().id} "..."</p>
            }
        />
    }
}`}
        language="rust"
      />

      <h2 id="error-handling">Error Handling</h2>

      <CodeBlock
        code={`use thiserror::Error;

#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum TodoError {
    #[error("Todo not found")]
    NotFound,
    #[error("Invalid title: {0}")]
    InvalidTitle(String),
    #[error("Database error: {0}")]
    Database(String),
}

impl From<TodoError> for ServerFnError {
    fn from(err: TodoError) -> Self {
        ServerFnError::ServerError(err.to_string())
    }
}

#[server(ValidateTodo)]
pub async fn validate_todo(title: String) -> Result<(), ServerFnError> {
    if title.is_empty() {
        return Err(TodoError::InvalidTitle("Title cannot be empty".into()).into());
    }
    if title.len() > 100 {
        return Err(TodoError::InvalidTitle("Title too long".into()).into());
    }
    Ok(())
}`}
        language="rust"
      />

      <h2 id="accessing-context">Accessing Server Context</h2>

      <CodeBlock
        code={`use axum::extract::Extension;
use sqlx::PgPool;

#[server(GetUserTodos)]
pub async fn get_user_todos() -> Result<Vec<Todo>, ServerFnError> {
    // Access the database pool from server context
    let pool = expect_context::<PgPool>();

    // Access the current user from auth context
    let user = expect_context::<AuthUser>();

    let todos = sqlx::query_as!(
        Todo,
        "SELECT * FROM todos WHERE user_id = $1",
        user.id
    )
    .fetch_all(&pool)
    .await?;

    Ok(todos)
}

// With custom extractors
#[server(GetSecureTodos, input = Json, output = Json)]
pub async fn get_secure_todos(
    // Extract request info
    headers: leptos_axum::extract::Headers,
) -> Result<Vec<Todo>, ServerFnError> {
    let auth_header = headers.get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| ServerFnError::ServerError("Unauthorized".into()))?;

    // Validate token and get todos...
    Ok(vec![])
}`}
        language="rust"
      />

      <h2 id="file-uploads">File Uploads</h2>

      <CodeBlock
        code={`use philjs_server::*;

#[server(UploadFile, input = MultipartFormData)]
pub async fn upload_file(
    file: MultipartData,
) -> Result<String, ServerFnError> {
    let mut data = file.into_inner();

    while let Some(mut chunk) = data.next_field().await? {
        let name = chunk.name().unwrap_or("file").to_string();
        let filename = chunk.file_name().unwrap_or("unknown").to_string();
        let content_type = chunk.content_type().unwrap_or("application/octet-stream").to_string();

        let mut bytes = Vec::new();
        while let Some(chunk) = chunk.chunk().await? {
            bytes.extend_from_slice(&chunk);
        }

        // Save file
        let path = format!("uploads/{}", filename);
        tokio::fs::write(&path, bytes).await?;

        return Ok(path);
    }

    Err(ServerFnError::ServerError("No file provided".into()))
}

// Component with file upload
#[component]
fn FileUpload() -> impl IntoView {
    let upload = create_server_action::<UploadFile>();

    view! {
        <form
            method="POST"
            enctype="multipart/form-data"
            on:submit=move |ev| {
                ev.prevent_default();
                let form_data = FormData::new_with_form(
                    &ev.target().unwrap().dyn_into::<HtmlFormElement>().unwrap()
                ).unwrap();
                upload.dispatch(UploadFile { file: form_data.into() });
            }
        >
            <input type="file" name="file"/>
            <button type="submit">"Upload"</button>
        </form>
    }
}`}
        language="rust"
      />

      <h2 id="streaming">Streaming Responses</h2>

      <CodeBlock
        code={`use futures::stream::Stream;

#[server(StreamingData, output = StreamingText)]
pub async fn streaming_data() -> Result<TextStream, ServerFnError> {
    let stream = async_stream::stream! {
        for i in 0..10 {
            tokio::time::sleep(Duration::from_millis(100)).await;
            yield Ok(format!("Message {}\n", i));
        }
    };

    Ok(TextStream::new(stream))
}

// Usage in component
#[component]
fn StreamingComponent() -> impl IntoView {
    let (messages, set_messages) = create_signal(Vec::<String>::new());

    let start_stream = move |_| {
        spawn_local(async move {
            let mut stream = streaming_data().await.unwrap();
            while let Some(msg) = stream.next().await {
                if let Ok(text) = msg {
                    set_messages.update(|msgs| msgs.push(text));
                }
            }
        });
    };

    view! {
        <button on:click=start_stream>"Start Stream"</button>
        <ul>
            <For
                each=move || messages()
                key=|msg| msg.clone()
                children=|msg| view! { <li>{msg}</li> }
            />
        </ul>
    }
}`}
        language="rust"
      />

      <h2 id="configuration">Configuration</h2>

      <CodeBlock
        code={`// Custom endpoint
#[server(
    CustomEndpoint,
    prefix = "/api/v2",
    endpoint = "custom-action"
)]
pub async fn custom_endpoint() -> Result<(), ServerFnError> {
    Ok(())
}
// This creates endpoint: POST /api/v2/custom-action

// With middleware
#[server(AuthenticatedAction, middleware = [require_auth])]
pub async fn authenticated_action() -> Result<(), ServerFnError> {
    // Only accessible if authenticated
    Ok(())
}`}
        language="rust"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust-guide/axum"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Axum Integration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Set up a full-stack Axum backend
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/wasm"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">WASM Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy your app as WebAssembly
          </p>
        </Link>
      </div>
    </div>
  );
}
