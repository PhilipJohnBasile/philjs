2:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","27","static/chunks/app/docs/getting-started/quickstart-rust/page-72ff5dc9fb312943.js"],"Callout"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","27","static/chunks/app/docs/getting-started/quickstart-rust/page-72ff5dc9fb312943.js"],"Terminal"]
4:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","27","static/chunks/app/docs/getting-started/quickstart-rust/page-72ff5dc9fb312943.js"],"CodeBlock"]
7:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","27","static/chunks/app/docs/getting-started/quickstart-rust/page-72ff5dc9fb312943.js"],""]
8:I[6419,[],""]
9:I[8445,[],""]
a:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
b:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
c:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
d:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
5:T45b,use philjs::prelude::*;

#[derive(Clone, PartialEq)]
struct Todo {
    id: u32,
    text: String,
    done: bool,
}

#[component]
fn TodoList() -> Element {
    let todos = use_signal(|| vec![
        Todo { id: 1, text: "Learn Rust".into(), done: true },
        Todo { id: 2, text: "Build with PhilJS".into(), done: false },
    ]);

    let add_todo = move |text: String| {
        todos.update(|t| t.push(Todo {
            id: t.len() as u32 + 1,
            text,
            done: false,
        }));
    };

    view! {
        <ul class="space-y-2">
            <For
                each=move || todos()
                key=|todo| todo.id
                children=|todo| view! {
                    <li class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            prop:checked=todo.done
                        />
                        <span class=("line-through", todo.done)>
                            {todo.text}
                        </span>
                    </li>
                }
            />
        </ul>
    }
}6:T4c4,use philjs::prelude::*;
use serde::Deserialize;

#[derive(Clone, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[component]
fn UserProfile() -> Element {
    let user_id = use_signal(|| 1u32);

    let user = use_resource(move || async move {
        let url = format!(
            "https://api.example.com/users/{}",
            user_id()
        );
        reqwest::get(&url)
            .await?
            .json::<User>()
            .await
    });

    view! {
        <div>
            <Suspense fallback=|| view! { <p>"Loading..."</p> }>
                {move || user.read().map(|result| {
                    match result {
                        Ok(u) => view! {
                            <div>
                                <h2>{u.name.clone()}</h2>
                                <p>{u.email.clone()}</p>
                            </div>
                        },
                        Err(e) => view! {
                            <p class="text-red-500">
                                "Error: " {e.to_string()}
                            </p>
                        },
                    }
                })}
            </Suspense>
        </div>
    }
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["getting-started",{"children":["quickstart-rust",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["getting-started",{"children":["quickstart-rust",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Quick Start (Rust)"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Build blazing-fast web applications with PhilJS and Rust. Compile to WebAssembly for near-native performance."}],["$","$L2",null,{"type":"info","title":"Prerequisites","children":["Make sure you have Rust 1.75+ installed. Run ",["$","code",null,{"children":"rustup update"}]," to get the latest version. You'll also need the wasm32-unknown-unknown target: ",["$","code",null,{"children":"rustup target add wasm32-unknown-unknown"}]]}],["$","h2",null,{"id":"install-cli","children":"Install cargo-philjs"}],["$","$L3",null,{"commands":["cargo install cargo-philjs"]}],["$","h2",null,{"id":"create-project","children":"Create a New Project"}],["$","$L3",null,{"commands":["cargo philjs new my-app","cd my-app","cargo philjs dev"]}],["$","p",null,{"children":["Open ",["$","a",null,{"href":"http://localhost:3000","target":"_blank","rel":"noopener noreferrer","children":"http://localhost:3000"}]," to see your app running."]}],["$","h2",null,{"id":"project-structure","children":"Project Structure"}],["$","$L4",null,{"code":"my-app/\n├── src/\n│   ├── lib.rs              # App entry point\n│   ├── app.rs              # Main App component\n│   ├── components/\n│   │   ├── mod.rs\n│   │   └── counter.rs      # Example component\n│   └── routes/\n│       ├── mod.rs\n│       └── home.rs         # Home page\n├── public/\n│   └── index.html\n├── Cargo.toml\n└── PhilJS.toml             # PhilJS configuration","language":"plaintext","showLineNumbers":false}],["$","h2",null,{"id":"view-macro","children":"The view! Macro"}],["$","p",null,{"children":["PhilJS Rust uses the ",["$","code",null,{"children":"view!"}]," macro for declarative UI. It looks similar to HTML but with Rust expressions:"]}],["$","$L4",null,{"code":"use philjs::prelude::*;\n\n#[component]\nfn Counter() -> Element {\n    let count = use_signal(|| 0);\n\n    view! {\n        <div class=\"counter\">\n            <h1>\"Count: \" {count}</h1>\n            <button on:click=move |_| count.set(|c| c + 1)>\n                \"Increment\"\n            </button>\n        </div>\n    }\n}","language":"rust","filename":"src/components/counter.rs"}],["$","h3",null,{"children":"Key Differences from JSX"}],["$","ul",null,{"children":[["$","li",null,{"children":[["$","strong",null,{"children":"Strings must be quoted"}],": Use ",["$","code",null,{"children":"\"text\""}]," instead of bare text"]}],["$","li",null,{"children":[["$","strong",null,{"children":["Use ",["$","code",null,{"children":"class"}]]}],": Not ",["$","code",null,{"children":"className"}]]}],["$","li",null,{"children":[["$","strong",null,{"children":"Event handlers"}],": Use ",["$","code",null,{"children":"on:click"}]," syntax"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Expressions"}],": Wrap Rust expressions in ",["$","code",null,{"children":"{}"}]]}]]}],["$","h2",null,{"id":"signals","children":"Signals in Rust"}],["$","p",null,{"children":"Signals work similarly to TypeScript, but with Rust's ownership semantics:"}],["$","$L4",null,{"code":"use philjs::prelude::*;\n\n#[component]\nfn SignalsExample() -> Element {\n    // Create a signal - Clone is automatic\n    let count = use_signal(|| 0);\n\n    // Computed values with use_memo\n    let doubled = use_memo(move || count() * 2);\n    let is_even = use_memo(move || count() % 2 == 0);\n\n    // Side effects\n    use_effect(move || {\n        log::info!(\"Count changed to: {}\", count());\n\n        // Cleanup (optional)\n        on_cleanup(|| {\n            log::info!(\"Cleaning up...\");\n        });\n    });\n\n    view! {\n        <div>\n            <p>\"Count: \" {count}</p>\n            <p>\"Doubled: \" {doubled}</p>\n            <p>\"Is Even: \" {move || if is_even() { \"Yes\" } else { \"No\" }}</p>\n            <button on:click=move |_| count.set(|c| c + 1)>\"+1\"</button>\n        </div>\n    }\n}","language":"rust","filename":"src/components/signals_example.rs"}],["$","h2",null,{"id":"lists","children":"Rendering Lists"}],["$","p",null,{"children":["Use the ",["$","code",null,{"children":"For"}]," component for efficient list rendering:"]}],["$","$L4",null,{"code":"$5","language":"rust","filename":"src/components/todo_list.rs"}],["$","h2",null,{"id":"async","children":"Async Data Fetching"}],["$","p",null,{"children":["Use ",["$","code",null,{"children":"use_resource"}]," for async data:"]}],["$","$L4",null,{"code":"$6","language":"rust","filename":"src/components/user_profile.rs"}],["$","h2",null,{"id":"server-functions","children":"Server Functions"}],["$","p",null,{"children":"Call Rust functions on the server directly from your components:"}],["$","$L4",null,{"code":"use philjs::prelude::*;\n\n// This function runs on the server\n#[server]\nasync fn get_user(id: u32) -> Result<User, ServerError> {\n    // Database access, file I/O, etc.\n    let user = db::get_user(id).await?;\n    Ok(user)\n}\n\n#[server]\nasync fn create_todo(text: String) -> Result<Todo, ServerError> {\n    let todo = db::create_todo(&text).await?;\n    Ok(todo)\n}\n\n#[component]\nfn UserPage() -> Element {\n    let user_id = use_params::<u32>();\n\n    // Call server function from client\n    let user = use_resource(move || get_user(user_id()));\n\n    view! {\n        <Suspense fallback=|| view! { <LoadingSkeleton /> }>\n            {move || user.read().map(|result| {\n                result.map(|u| view! {\n                    <UserCard user=u />\n                })\n            })}\n        </Suspense>\n    }\n}","language":"rust","filename":"src/routes/user.rs"}],["$","h2",null,{"id":"building","children":"Building for Production"}],["$","$L3",null,{"commands":["# Build optimized WASM binary","cargo philjs build --release","","# Output is in dist/","ls dist/"]}],["$","p",null,{"children":"The build output includes optimized WASM, JavaScript glue code, and your static assets. Deploy to any static hosting provider."}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L7",null,{"href":"/docs/rust/view-macro","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"View Macro Deep Dive"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Master the view! macro syntax and patterns"}]]}],["$","$L7",null,{"href":"/docs/rust/server-functions","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Server Functions"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Build full-stack apps with type-safe RPC"}]]}],["$","$L7",null,{"href":"/docs/rust/axum","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Axum Integration"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Use PhilJS with the Axum web framework"}]]}],["$","$L7",null,{"href":"/docs/rust/wasm","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"WASM Deployment"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Deploy your Rust app to the web"}]]}]]}]]}],null],null],null]},[null,["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","getting-started","children","quickstart-rust","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","getting-started","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$La",null,{"sections":"$b"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Lc",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Ld",null,{}],["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Le",null]]]]
e:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Quick Start (Rust) | PhilJS"}],["$","meta","3",{"name":"description","content":"Build your first PhilJS application with Rust. Learn the view! macro, signals, and WebAssembly deployment."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
