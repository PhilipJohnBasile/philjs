(()=>{var e={};e.id=548,e.ids=[548],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},7754:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>c,routeModule:()=>m,tree:()=>d}),r(8061),r(2108),r(4001),r(1305);var s=r(3545),o=r(5947),i=r(9761),n=r.n(i),a=r(4798),l={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>a[e]);r.d(t,l);let d=["",{children:["docs",{children:["rust-guide",{children:["server-functions",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,8061)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\server-functions\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\server-functions\\page.tsx"],u="/docs/rust-guide/server-functions/page",p={require:r,loadChunk:()=>Promise.resolve()},m=new s.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/docs/rust-guide/server-functions/page",pathname:"/docs/rust-guide/server-functions",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7656:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>c,docsNavigation:()=>d});var s=r(6741),o=r(8972),i=r(47),n=r(7678),a=r(3178),l=r(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function c({sections:e}){let t=(0,i.usePathname)(),[r,d]=(0,l.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),c=e=>{d(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=r.has(e.title),l=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>c(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(a.Z,{className:(0,n.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||l)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(o.default,{href:e.href,className:(0,n.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>o.a});var s=r(7654),o=r.n(s)},7654:(e,t,r)=>{"use strict";let{createProxy:s}=r(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});var s=r(9015),o=r(1471);let i=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),n=(0,o.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(n,{sections:i}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},8061:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>l,metadata:()=>a});var s=r(9015),o=r(3288),i=r(7309),n=r(8951);let a={title:"Server Functions",description:"Build type-safe server functions in PhilJS with Rust."};function l(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Server Functions"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Server functions allow you to call server-side Rust code directly from your frontend components with full type safety and automatic serialization."}),s.jsx(i.U,{type:"info",title:"How It Works",children:"Server functions are compiled to both the client and server. On the client, they become RPC calls. On the server, they execute as regular Rust functions with access to databases, file systems, and environment variables."}),s.jsx("h2",{id:"basic-usage",children:"Basic Usage"}),s.jsx(o.dn,{code:`use philjs::prelude::*;
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
}`,language:"rust",filename:"server_functions.rs"}),s.jsx("h2",{id:"parameters",children:"Function Parameters"}),s.jsx(o.dn,{code:`#[server(CreateTodo)]
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
}`,language:"rust"}),s.jsx("h2",{id:"server-actions",children:"Server Actions"}),(0,s.jsxs)("p",{children:["Use ",s.jsx("code",{children:"create_server_action"})," for mutations that you want to track:"]}),s.jsx(o.dn,{code:`#[component]
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
}`,language:"rust"}),s.jsx("h2",{id:"multi-actions",children:"Multi-Actions"}),s.jsx("p",{children:"For handling multiple concurrent submissions:"}),s.jsx(o.dn,{code:`#[component]
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
}`,language:"rust"}),s.jsx("h2",{id:"error-handling",children:"Error Handling"}),s.jsx(o.dn,{code:`use thiserror::Error;

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
}`,language:"rust"}),s.jsx("h2",{id:"accessing-context",children:"Accessing Server Context"}),s.jsx(o.dn,{code:`use axum::extract::Extension;
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
}`,language:"rust"}),s.jsx("h2",{id:"file-uploads",children:"File Uploads"}),s.jsx(o.dn,{code:`use philjs_server::*;

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
}`,language:"rust"}),s.jsx("h2",{id:"streaming",children:"Streaming Responses"}),s.jsx(o.dn,{code:`use futures::stream::Stream;

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
}`,language:"rust"}),s.jsx("h2",{id:"configuration",children:"Configuration"}),s.jsx(o.dn,{code:`// Custom endpoint
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
}`,language:"rust"}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(n.default,{href:"/docs/rust-guide/axum",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Axum Integration"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Set up a full-stack Axum backend"})]}),(0,s.jsxs)(n.default,{href:"/docs/rust-guide/wasm",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"WASM Deployment"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy your app as WebAssembly"})]})]})]})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>o,oI:()=>i});var s=r(1471);let o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(7754));module.exports=s})();