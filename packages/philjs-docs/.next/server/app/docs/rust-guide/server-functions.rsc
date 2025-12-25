2:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","548","static/chunks/app/docs/rust-guide/server-functions/page-8387523fbb68ce1e.js"],"Callout"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","548","static/chunks/app/docs/rust-guide/server-functions/page-8387523fbb68ce1e.js"],"CodeBlock"]
8:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","548","static/chunks/app/docs/rust-guide/server-functions/page-8387523fbb68ce1e.js"],""]
9:I[6419,[],""]
a:I[8445,[],""]
b:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
c:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
d:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
e:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
4:T4f3,use philjs::prelude::*;
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
}5:T4ca,#[component]
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
}6:T608,use philjs_server::*;

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
}7:T47d,use futures::stream::Stream;

#[server(StreamingData, output = StreamingText)]
pub async fn streaming_data() -> Result<TextStream, ServerFnError> {
    let stream = async_stream::stream! {
        for i in 0..10 {
            tokio::time::sleep(Duration::from_millis(100)).await;
            yield Ok(format!("Message {}
", i));
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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["rust-guide",{"children":["server-functions",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["rust-guide",{"children":["server-functions",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Server Functions"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Server functions allow you to call server-side Rust code directly from your frontend components with full type safety and automatic serialization."}],["$","$L2",null,{"type":"info","title":"How It Works","children":"Server functions are compiled to both the client and server. On the client, they become RPC calls. On the server, they execute as regular Rust functions with access to databases, file systems, and environment variables."}],["$","h2",null,{"id":"basic-usage","children":"Basic Usage"}],["$","$L3",null,{"code":"$4","language":"rust","filename":"server_functions.rs"}],["$","h2",null,{"id":"parameters","children":"Function Parameters"}],["$","$L3",null,{"code":"#[server(CreateTodo)]\npub async fn create_todo(\n    title: String,\n    description: Option<String>,\n) -> Result<Todo, ServerFnError> {\n    let todo = db::create_todo(&title, description.as_deref()).await?;\n    Ok(todo)\n}\n\n#[server(UpdateTodo)]\npub async fn update_todo(\n    id: i32,\n    title: Option<String>,\n    completed: Option<bool>,\n) -> Result<Todo, ServerFnError> {\n    let todo = db::update_todo(id, title.as_deref(), completed).await?;\n    Ok(todo)\n}\n\n#[server(DeleteTodo)]\npub async fn delete_todo(id: i32) -> Result<(), ServerFnError> {\n    db::delete_todo(id).await?;\n    Ok(())\n}","language":"rust"}],["$","h2",null,{"id":"server-actions","children":"Server Actions"}],["$","p",null,{"children":["Use ",["$","code",null,{"children":"create_server_action"}]," for mutations that you want to track:"]}],["$","$L3",null,{"code":"$5","language":"rust"}],["$","h2",null,{"id":"multi-actions","children":"Multi-Actions"}],["$","p",null,{"children":"For handling multiple concurrent submissions:"}],["$","$L3",null,{"code":"#[component]\nfn BulkActions() -> impl IntoView {\n    let delete_todo = create_server_multi_action::<DeleteTodo>();\n\n    // Get all submissions\n    let submissions = delete_todo.submissions();\n\n    view! {\n        <For\n            each=move || todos()\n            key=|todo| todo.id\n            children=move |todo| {\n                let id = todo.id;\n                view! {\n                    <li>\n                        {todo.title}\n                        <button on:click=move |_| {\n                            delete_todo.dispatch(DeleteTodo { id });\n                        }>\n                            \"Delete\"\n                        </button>\n                    </li>\n                }\n            }\n        />\n\n        // Show pending deletions\n        <For\n            each=move || submissions().into_iter().filter(|s| s.pending())\n            key=|s| s.input().id\n            children=|s| view! {\n                <p>\"Deleting \" {s.input().id} \"...\"</p>\n            }\n        />\n    }\n}","language":"rust"}],["$","h2",null,{"id":"error-handling","children":"Error Handling"}],["$","$L3",null,{"code":"use thiserror::Error;\n\n#[derive(Error, Debug, Clone, Serialize, Deserialize)]\npub enum TodoError {\n    #[error(\"Todo not found\")]\n    NotFound,\n    #[error(\"Invalid title: {0}\")]\n    InvalidTitle(String),\n    #[error(\"Database error: {0}\")]\n    Database(String),\n}\n\nimpl From<TodoError> for ServerFnError {\n    fn from(err: TodoError) -> Self {\n        ServerFnError::ServerError(err.to_string())\n    }\n}\n\n#[server(ValidateTodo)]\npub async fn validate_todo(title: String) -> Result<(), ServerFnError> {\n    if title.is_empty() {\n        return Err(TodoError::InvalidTitle(\"Title cannot be empty\".into()).into());\n    }\n    if title.len() > 100 {\n        return Err(TodoError::InvalidTitle(\"Title too long\".into()).into());\n    }\n    Ok(())\n}","language":"rust"}],["$","h2",null,{"id":"accessing-context","children":"Accessing Server Context"}],["$","$L3",null,{"code":"use axum::extract::Extension;\nuse sqlx::PgPool;\n\n#[server(GetUserTodos)]\npub async fn get_user_todos() -> Result<Vec<Todo>, ServerFnError> {\n    // Access the database pool from server context\n    let pool = expect_context::<PgPool>();\n\n    // Access the current user from auth context\n    let user = expect_context::<AuthUser>();\n\n    let todos = sqlx::query_as!(\n        Todo,\n        \"SELECT * FROM todos WHERE user_id = $1\",\n        user.id\n    )\n    .fetch_all(&pool)\n    .await?;\n\n    Ok(todos)\n}\n\n// With custom extractors\n#[server(GetSecureTodos, input = Json, output = Json)]\npub async fn get_secure_todos(\n    // Extract request info\n    headers: leptos_axum::extract::Headers,\n) -> Result<Vec<Todo>, ServerFnError> {\n    let auth_header = headers.get(\"Authorization\")\n        .and_then(|h| h.to_str().ok())\n        .ok_or_else(|| ServerFnError::ServerError(\"Unauthorized\".into()))?;\n\n    // Validate token and get todos...\n    Ok(vec![])\n}","language":"rust"}],["$","h2",null,{"id":"file-uploads","children":"File Uploads"}],["$","$L3",null,{"code":"$6","language":"rust"}],["$","h2",null,{"id":"streaming","children":"Streaming Responses"}],["$","$L3",null,{"code":"$7","language":"rust"}],["$","h2",null,{"id":"configuration","children":"Configuration"}],["$","$L3",null,{"code":"// Custom endpoint\n#[server(\n    CustomEndpoint,\n    prefix = \"/api/v2\",\n    endpoint = \"custom-action\"\n)]\npub async fn custom_endpoint() -> Result<(), ServerFnError> {\n    Ok(())\n}\n// This creates endpoint: POST /api/v2/custom-action\n\n// With middleware\n#[server(AuthenticatedAction, middleware = [require_auth])]\npub async fn authenticated_action() -> Result<(), ServerFnError> {\n    // Only accessible if authenticated\n    Ok(())\n}","language":"rust"}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L8",null,{"href":"/docs/rust-guide/axum","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Axum Integration"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Set up a full-stack Axum backend"}]]}],["$","$L8",null,{"href":"/docs/rust-guide/wasm","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"WASM Deployment"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Deploy your app as WebAssembly"}]]}]]}]]}],null],null],null]},[null,["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","rust-guide","children","server-functions","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","rust-guide","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Lb",null,{"sections":"$c"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Ld",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Le",null,{}],["$","$L9",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Lf",null]]]]
f:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Server Functions | PhilJS"}],["$","meta","3",{"name":"description","content":"Build type-safe server functions in PhilJS with Rust."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
