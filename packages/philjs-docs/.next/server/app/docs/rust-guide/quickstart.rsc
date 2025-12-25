2:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","2323","static/chunks/app/docs/rust-guide/quickstart/page-d749b569ae660f70.js"],"Callout"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","2323","static/chunks/app/docs/rust-guide/quickstart/page-d749b569ae660f70.js"],"Terminal"]
4:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","2323","static/chunks/app/docs/rust-guide/quickstart/page-d749b569ae660f70.js"],"CodeBlock"]
9:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","2323","static/chunks/app/docs/rust-guide/quickstart/page-d749b569ae660f70.js"],""]
a:I[6419,[],""]
b:I[8445,[],""]
c:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
d:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
e:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
f:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
5:T44f,// src/lib.rs
use philjs::prelude::*;
use wasm_bindgen::prelude::*;

mod components;
use components::app::App;

#[wasm_bindgen(start)]
pub fn main() {
    // Set up panic handler for better error messages
    console_error_panic_hook::set_once();

    // Mount the app to the DOM
    mount_to_body(App);
}

// src/components/app.rs
use philjs::prelude::*;
use super::counter::Counter;

#[component]
pub fn App() -> impl IntoView {
    view! {
        <main class="container">
            <h1>"Welcome to PhilJS"</h1>
            <p>"Built with Rust and WebAssembly"</p>
            <Counter />
        </main>
    }
}

// src/components/counter.rs
use philjs::prelude::*;

#[component]
pub fn Counter() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <div class="counter">
            <button on:click=move |_| set_count.update(|n| *n -= 1)>
                "-"
            </button>
            <span class="count">{count}</span>
            <button on:click=move |_| set_count.update(|n| *n += 1)>
                "+"
            </button>
        </div>
    }
}6:T840,use philjs::prelude::*;

#[derive(Clone, Debug)]
struct Todo {
    id: u32,
    text: String,
    completed: bool,
}

#[component]
fn TodoApp() -> impl IntoView {
    let (todos, set_todos) = create_store(Vec::<Todo>::new());
    let (input, set_input) = create_signal(String::new());

    let add_todo = move |_| {
        let text = input();
        if !text.is_empty() {
            set_todos.update(|todos| {
                let id = todos.len() as u32 + 1;
                todos.push(Todo { id, text, completed: false });
            });
            set_input(String::new());
        }
    };

    let toggle_todo = move |id: u32| {
        set_todos.update(|todos| {
            if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
                todo.completed = !todo.completed;
            }
        });
    };

    view! {
        <div class="todo-app">
            <div class="input-row">
                <input
                    type="text"
                    prop:value=input
                    on:input=move |ev| set_input(event_target_value(&ev))
                    on:keypress=move |ev| {
                        if ev.key() == "Enter" {
                            add_todo(());
                        }
                    }
                />
                <button on:click=add_todo>"Add"</button>
            </div>

            <ul class="todo-list">
                <For
                    each=move || todos.get().clone()
                    key=|todo| todo.id
                    children=move |todo| {
                        view! {
                            <li class:completed=todo.completed>
                                <input
                                    type="checkbox"
                                    prop:checked=todo.completed
                                    on:change=move |_| toggle_todo(todo.id)
                                />
                                <span>{todo.text.clone()}</span>
                            </li>
                        }
                    }
                />
            </ul>
        </div>
    }
}7:T4e9,use philjs::prelude::*;

#[component]
fn ControlFlowDemo() -> impl IntoView {
    let (show, set_show) = create_signal(true);
    let (items, _) = create_signal(vec!["Apple", "Banana", "Cherry"]);
    let (status, set_status) = create_signal("loading");

    view! {
        <div>
            // Conditional rendering
            <Show
                when=move || show()
                fallback=|| view! { <p>"Hidden"</p> }
            >
                <p>"Visible"</p>
            </Show>

            // List rendering
            <ul>
                <For
                    each=move || items()
                    key=|item| *item
                    children=|item| view! {
                        <li>{item}</li>
                    }
                />
            </ul>

            // Pattern matching
            {move || match status() {
                "loading" => view! { <Spinner /> }.into_view(),
                "error" => view! { <Error /> }.into_view(),
                "success" => view! { <Content /> }.into_view(),
                _ => view! { <p>"Unknown"</p> }.into_view(),
            }}

            <button on:click=move |_| set_show.update(|s| *s = !*s)>
                "Toggle"
            </button>
        </div>
    }
}8:T406,use philjs::prelude::*;
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

async fn fetch_user(id: u32) -> Result<User, reqwest::Error> {
    let url = format!("https://api.example.com/users/{}", id);
    reqwest::get(&url).await?.json().await
}

#[component]
fn UserProfile(id: u32) -> impl IntoView {
    let user = create_resource(
        move || id,
        |id| async move { fetch_user(id).await }
    );

    view! {
        <Suspense fallback=move || view! { <p>"Loading..."</p> }>
            {move || user.get().map(|result| match result {
                Ok(user) => view! {
                    <div class="profile">
                        <h2>{&user.name}</h2>
                        <p>{&user.email}</p>
                    </div>
                }.into_view(),
                Err(e) => view! {
                    <p class="error">"Error: " {e.to_string()}</p>
                }.into_view(),
            })}
        </Suspense>
    }
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["rust-guide",{"children":["quickstart",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["rust-guide",{"children":["quickstart",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Rust Quickstart"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Build type-safe, high-performance web applications with Rust, compiled to WebAssembly. PhilJS brings fine-grained reactivity to Rust developers."}],["$","$L2",null,{"type":"info","title":"Why Rust + PhilJS?","children":["$","ul",null,{"className":"list-disc list-inside space-y-1 mt-2","children":[["$","li",null,{"children":[["$","strong",null,{"children":"Type Safety"}],": Compile-time guarantees across your entire stack"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Performance"}],": Near-native speed with WASM, zero-cost abstractions"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Memory Safety"}],": No null pointers, no data races, no garbage collector"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Full-Stack Rust"}],": Same language for frontend, backend, and shared code"]}]]}]}],["$","h2",null,{"id":"prerequisites","children":"Prerequisites"}],["$","$L3",null,{"commands":["# Install Rust (if not already installed)","curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh","","# Add WASM target","rustup target add wasm32-unknown-unknown","","# Install cargo-philjs","cargo install cargo-philjs"]}],["$","h2",null,{"id":"create-project","children":"Create a New Project"}],["$","$L3",null,{"commands":["# Create a new full-stack project","cargo philjs new my-app --template fullstack","cd my-app","","# Or choose a specific template","cargo philjs new my-app --template minimal","cargo philjs new my-app --template ssr","cargo philjs new my-app --template liveview"]}],["$","h2",null,{"id":"project-structure","children":"Project Structure"}],["$","$L4",null,{"code":"my-app/\n├── Cargo.toml           # Rust dependencies\n├── src/\n│   ├── lib.rs           # WASM entry point\n│   ├── app.rs           # Root component\n│   └── components/      # UI components\n│       ├── mod.rs\n│       ├── header.rs\n│       └── counter.rs\n├── server/              # (Full-stack only)\n│   ├── main.rs          # Server entry\n│   └── routes/          # API routes\n├── static/              # Static assets\n│   └── styles.css\n└── index.html           # HTML template","language":"text","filename":"Project Structure"}],["$","h2",null,{"id":"first-component","children":"Your First Component"}],["$","$L4",null,{"code":"$5","language":"rust","filename":"First Component"}],["$","h2",null,{"id":"reactivity","children":"Reactivity System"}],["$","h3",null,{"id":"signals","children":"Signals"}],["$","$L4",null,{"code":"use philjs::prelude::*;\n\n#[component]\nfn ReactivityDemo() -> impl IntoView {\n    // Basic signal\n    let (name, set_name) = create_signal(String::from(\"World\"));\n\n    // Derived signal (like useMemo)\n    let greeting = create_memo(move || {\n        format!(\"Hello, {}!\", name())\n    });\n\n    // Effect (runs when dependencies change)\n    create_effect(move || {\n        log::info!(\"Name changed to: {}\", name());\n    });\n\n    view! {\n        <div>\n            <input\n                type=\"text\"\n                prop:value=name\n                on:input=move |ev| {\n                    set_name(event_target_value(&ev));\n                }\n            />\n            <p>{greeting}</p>\n        </div>\n    }\n}","language":"rust","filename":"Signals"}],["$","h3",null,{"id":"stores","children":"Stores (Nested State)"}],["$","$L4",null,{"code":"$6","language":"rust","filename":"TodoApp.rs"}],["$","h2",null,{"id":"control-flow","children":"Control Flow"}],["$","$L4",null,{"code":"$7","language":"rust","filename":"ControlFlow.rs"}],["$","h2",null,{"id":"async","children":"Async Data Fetching"}],["$","$L4",null,{"code":"$8","language":"rust","filename":"AsyncData.rs"}],["$","h2",null,{"id":"server-functions","children":"Server Functions"}],["$","p",null,{"children":"Call server-side Rust functions directly from your components:"}],["$","$L4",null,{"code":"use philjs::prelude::*;\nuse philjs_server::*;\n\n// This function runs on the server\n#[server(CreateTodo)]\npub async fn create_todo(title: String) -> Result<Todo, ServerFnError> {\n    // Access database, environment variables, etc.\n    let todo = db::todos::create(&title).await?;\n    Ok(todo)\n}\n\n#[component]\nfn TodoForm() -> impl IntoView {\n    let (title, set_title) = create_signal(String::new());\n    let create = create_server_action::<CreateTodo>();\n\n    view! {\n        <form on:submit=move |ev| {\n            ev.prevent_default();\n            create.dispatch(CreateTodo { title: title() });\n            set_title(String::new());\n        }>\n            <input\n                type=\"text\"\n                prop:value=title\n                on:input=move |ev| set_title(event_target_value(&ev))\n            />\n            <button type=\"submit\" disabled=move || create.pending()>\n                {move || if create.pending() { \"Creating...\" } else { \"Create\" }}\n            </button>\n        </form>\n    }\n}","language":"rust","filename":"ServerFunctions.rs"}],["$","h2",null,{"id":"run-dev","children":"Run Development Server"}],["$","$L3",null,{"commands":["# Start development server with hot reload","cargo philjs dev","","# Open http://localhost:8080"]}],["$","h2",null,{"id":"build-prod","children":"Build for Production"}],["$","$L3",null,{"commands":["# Build optimized WASM","cargo philjs build --release","","# Output is in dist/ directory","ls dist/"]}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L9",null,{"href":"/docs/rust-guide/cargo-philjs","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"cargo-philjs CLI"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Full CLI reference and commands"}]]}],["$","$L9",null,{"href":"/docs/rust-guide/axum-integration","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Axum Integration"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Full-stack apps with Axum backend"}]]}],["$","$L9",null,{"href":"/docs/rust-guide/view-macro","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"View Macro Syntax"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Complete view! macro reference"}]]}],["$","$L9",null,{"href":"/docs/rust-guide/server-functions","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Server Functions"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"RPC-style server communication"}]]}]]}]]}],null],null],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","rust-guide","children","quickstart","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","rust-guide","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Lc",null,{"sections":"$d"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Le",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Lf",null,{}],["$","$La",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$L10",null]]]]
10:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Rust Quickstart | PhilJS"}],["$","meta","3",{"name":"description","content":"Build your first PhilJS application with Rust and WebAssembly."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
