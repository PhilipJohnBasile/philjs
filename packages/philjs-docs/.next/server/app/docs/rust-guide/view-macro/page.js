(()=>{var e={};e.id=2330,e.ids=[2330],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9989:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>h,tree:()=>c}),s(5714),s(2108),s(4001),s(1305);var i=s(3545),r=s(5947),o=s(9761),l=s.n(o),a=s(4798),n={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(n[e]=()=>a[e]);s.d(t,n);let c=["",{children:["docs",{children:["rust-guide",{children:["view-macro",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,5714)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\view-macro\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\rust-guide\\view-macro\\page.tsx"],u="/docs/rust-guide/view-macro/page",p={require:s,loadChunk:()=>Promise.resolve()},h=new i.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/docs/rust-guide/view-macro/page",pathname:"/docs/rust-guide/view-macro",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7656:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,5505,23)),Promise.resolve().then(s.bind(s,2015)),Promise.resolve().then(s.bind(s,306))},4444:(e,t,s)=>{Promise.resolve().then(s.bind(s,5173))},5173:(e,t,s)=>{"use strict";s.d(t,{Sidebar:()=>d,docsNavigation:()=>c});var i=s(6741),r=s(8972),o=s(47),l=s(7678),a=s(3178),n=s(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[s,c]=(0,n.useState)(()=>{let s=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(s?[s.title]:[e[0]?.title])}),d=e=>{c(t=>{let s=new Set(t);return s.has(e)?s.delete(e):s.add(e),s})};return i.jsx("nav",{className:"w-64 flex-shrink-0",children:i.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:i.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=s.has(e.title),n=e.links.some(e=>t===e.href);return(0,i.jsxs)("li",{children:[(0,i.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,i.jsx(a.Z,{className:(0,l.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||n)&&i.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let s=t===e.href;return i.jsx("li",{children:i.jsx(r.default,{href:e.href,className:(0,l.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",s?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,s)=>{"use strict";s.d(t,{default:()=>r.a});var i=s(7654),r=s.n(i)},7654:(e,t,s)=>{"use strict";let{createProxy:i}=s(1471);e.exports=i("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});var i=s(9015),r=s(1471);let o=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),l=(0,r.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return i.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,i.jsxs)("div",{className:"flex gap-12",children:[i.jsx(l,{sections:o}),i.jsx("main",{className:"flex-1 min-w-0",children:i.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},5714:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>n,metadata:()=>a});var i=s(9015),r=s(3288),o=s(7309),l=s(8951);let a={title:"View Macro Syntax",description:"Complete reference for the PhilJS view! macro syntax in Rust."};function n(){return(0,i.jsxs)("div",{className:"mdx-content",children:[i.jsx("h1",{children:"View Macro Syntax"}),i.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"The view! macro provides a JSX-like syntax for building UI in Rust. It compiles to efficient DOM operations with full type safety."}),i.jsx("h2",{id:"basic-syntax",children:"Basic Syntax"}),i.jsx(r.dn,{code:`use philjs::prelude::*;

view! {
    <div class="container">
        <h1>"Hello, World!"</h1>
        <p>"Welcome to PhilJS"</p>
    </div>
}`,language:"rust"}),i.jsx(o.U,{type:"info",title:"String Literals",children:"In the view! macro, text content must be quoted. This is different from JSX where text can be unquoted."}),i.jsx("h2",{id:"elements",children:"HTML Elements"}),i.jsx("h3",{children:"Standard Elements"}),i.jsx(r.dn,{code:`view! {
    // Self-closing elements
    <br/>
    <hr/>
    <input type="text"/>
    <img src="image.png" alt="Description"/>

    // Elements with children
    <div>
        <span>"Nested content"</span>
    </div>

    // Void elements
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="styles.css"/>
}`,language:"rust"}),i.jsx("h3",{children:"Custom Components"}),i.jsx(r.dn,{code:`#[component]
fn Button(text: String, #[prop(optional)] disabled: bool) -> impl IntoView {
    view! {
        <button disabled=disabled>{text}</button>
    }
}

// Usage
view! {
    <Button text="Click me".to_string()/>
    <Button text="Disabled".to_string() disabled=true/>
}`,language:"rust"}),i.jsx("h2",{id:"attributes",children:"Attributes"}),i.jsx("h3",{children:"Static Attributes"}),i.jsx(r.dn,{code:`view! {
    <div class="container" id="main">
        <input type="text" placeholder="Enter text"/>
        <a href="https://example.com" target="_blank">
            "External Link"
        </a>
    </div>
}`,language:"rust"}),i.jsx("h3",{children:"Dynamic Attributes"}),i.jsx(r.dn,{code:`let (class, _) = create_signal("active");
let (disabled, _) = create_signal(false);

view! {
    // Dynamic attribute value
    <div class=class>
        "Content"
    </div>

    // Boolean attribute
    <button disabled=disabled>
        "Button"
    </button>

    // Computed attribute
    <div class=move || if active() { "visible" } else { "hidden" }>
        "Toggle content"
    </div>
}`,language:"rust"}),i.jsx("h3",{children:"Class Directives"}),i.jsx(r.dn,{code:`let (active, _) = create_signal(true);
let (highlighted, _) = create_signal(false);

view! {
    // Conditional class
    <div class:active=active>
        "Active when signal is true"
    </div>

    // Multiple conditional classes
    <div
        class="base-class"
        class:active=active
        class:highlighted=highlighted
    >
        "Multiple classes"
    </div>

    // Dynamic class expression
    <div class=move || {
        let mut classes = vec!["base"];
        if active() { classes.push("active"); }
        if highlighted() { classes.push("highlighted"); }
        classes.join(" ")
    }>
        "Computed classes"
    </div>
}`,language:"rust"}),i.jsx("h3",{children:"Style Directives"}),i.jsx(r.dn,{code:`let (color, _) = create_signal("red");
let (size, _) = create_signal(16);

view! {
    // Inline style
    <div style="color: red; font-size: 16px;">
        "Styled text"
    </div>

    // Dynamic style property
    <div style:color=color style:font-size=move || format!("{}px", size())>
        "Dynamic styles"
    </div>
}`,language:"rust"}),i.jsx("h2",{id:"properties",children:"Properties"}),i.jsx(r.dn,{code:`let (value, set_value) = create_signal(String::new());
let (checked, set_checked) = create_signal(false);

view! {
    // prop: prefix for DOM properties (not attributes)
    <input
        type="text"
        prop:value=value
        on:input=move |ev| set_value(event_target_value(&ev))
    />

    // Checkbox with checked property
    <input
        type="checkbox"
        prop:checked=checked
        on:change=move |_| set_checked.update(|c| *c = !*c)
    />
}`,language:"rust"}),(0,i.jsxs)(o.U,{type:"warning",title:"Attributes vs Properties",children:["Use ",i.jsx("code",{children:"prop:"})," for DOM properties like ",i.jsx("code",{children:"value"})," and ",i.jsx("code",{children:"checked"}),". Use regular attributes for HTML attributes like ",i.jsx("code",{children:"class"})," and ",i.jsx("code",{children:"id"}),"."]}),i.jsx("h2",{id:"events",children:"Event Handlers"}),i.jsx("h3",{children:"Basic Events"}),i.jsx(r.dn,{code:`view! {
    // Click event
    <button on:click=move |_| {
        log::info!("Button clicked!");
    }>
        "Click me"
    </button>

    // Input event
    <input
        type="text"
        on:input=move |ev| {
            let value = event_target_value(&ev);
            log::info!("Input: {}", value);
        }
    />

    // Form submit
    <form on:submit=move |ev| {
        ev.prevent_default();
        log::info!("Form submitted!");
    }>
        <button type="submit">"Submit"</button>
    </form>
}`,language:"rust"}),i.jsx("h3",{children:"Event Modifiers"}),i.jsx(r.dn,{code:`view! {
    // Prevent default
    <a href="#" on:click=move |ev| {
        ev.prevent_default();
        // handle click
    }>
        "Link"
    </a>

    // Stop propagation
    <div on:click=move |_| log::info!("Parent clicked")>
        <button on:click=move |ev| {
            ev.stop_propagation();
            log::info!("Button clicked");
        }>
            "Click"
        </button>
    </div>
}`,language:"rust"}),i.jsx("h3",{children:"Keyboard Events"}),i.jsx(r.dn,{code:`view! {
    <input
        type="text"
        on:keydown=move |ev| {
            if ev.key() == "Enter" {
                log::info!("Enter pressed!");
            }
        }
        on:keyup=move |ev| {
            if ev.key() == "Escape" {
                log::info!("Escape released!");
            }
        }
    />
}`,language:"rust"}),i.jsx("h2",{id:"refs",children:"Element References"}),i.jsx(r.dn,{code:`use philjs::prelude::*;

#[component]
fn FocusInput() -> impl IntoView {
    let input_ref = create_node_ref::<Input>();

    let focus = move |_| {
        if let Some(input) = input_ref.get() {
            let _ = input.focus();
        }
    };

    view! {
        <input type="text" node_ref=input_ref/>
        <button on:click=focus>"Focus Input"</button>
    }
}`,language:"rust"}),i.jsx("h2",{id:"control-flow",children:"Control Flow"}),i.jsx("h3",{children:"Show/Hide"}),i.jsx(r.dn,{code:`let (visible, set_visible) = create_signal(true);

view! {
    <Show
        when=move || visible()
        fallback=|| view! { <p>"Hidden"</p> }
    >
        <p>"Visible"</p>
    </Show>

    <button on:click=move |_| set_visible.update(|v| *v = !*v)>
        "Toggle"
    </button>
}`,language:"rust"}),i.jsx("h3",{children:"For Loops"}),i.jsx(r.dn,{code:`let items = vec!["Apple", "Banana", "Cherry"];

view! {
    <ul>
        <For
            each=move || items.clone()
            key=|item| item.to_string()
            children=|item| view! {
                <li>{item}</li>
            }
        />
    </ul>
}`,language:"rust"}),i.jsx("h3",{children:"Match Expressions"}),i.jsx(r.dn,{code:`let (status, _) = create_signal("loading");

view! {
    {move || match status() {
        "loading" => view! { <Spinner/> }.into_view(),
        "error" => view! { <ErrorMessage/> }.into_view(),
        "success" => view! { <Content/> }.into_view(),
        _ => view! { <p>"Unknown"</p> }.into_view(),
    }}
}`,language:"rust"}),i.jsx("h2",{id:"fragments",children:"Fragments"}),i.jsx(r.dn,{code:`// Return multiple elements without a wrapper
view! {
    <>
        <h1>"Title"</h1>
        <p>"Paragraph 1"</p>
        <p>"Paragraph 2"</p>
    </>
}`,language:"rust"}),i.jsx("h2",{id:"spreading",children:"Spreading Props"}),i.jsx(r.dn,{code:`use philjs::prelude::*;

#[component]
fn MyButton(
    #[prop(attrs)] attrs: Vec<(&'static str, Attribute)>,
    children: Children,
) -> impl IntoView {
    view! {
        <button {..attrs}>
            {children()}
        </button>
    }
}

// Usage
view! {
    <MyButton class="btn" id="submit" disabled=true>
        "Click me"
    </MyButton>
}`,language:"rust"}),i.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,i.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,i.jsxs)(l.default,{href:"/docs/rust-guide/server-functions",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[i.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Server Functions"}),i.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Call server-side Rust from your components"})]}),(0,i.jsxs)(l.default,{href:"/docs/rust-guide/axum",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[i.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Axum Integration"}),i.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Build full-stack apps with Axum"})]})]})]})}},3288:(e,t,s)=>{"use strict";s.d(t,{dn:()=>r,oI:()=>o});var i=s(1471);let r=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),i=t.X(0,[732,6314,9858],()=>s(9989));module.exports=i})();