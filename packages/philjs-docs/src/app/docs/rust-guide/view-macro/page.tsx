import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'View Macro Syntax',
  description: 'Complete reference for the PhilJS view! macro syntax in Rust.',
};

export default function ViewMacroPage() {
  return (
    <div className="mdx-content">
      <h1>View Macro Syntax</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        The view! macro provides a JSX-like syntax for building UI in Rust. It compiles to efficient DOM operations with full type safety.
      </p>

      <h2 id="basic-syntax">Basic Syntax</h2>

      <CodeBlock
        code={`use philjs::prelude::*;

view! {
    <div class="container">
        <h1>"Hello, World!"</h1>
        <p>"Welcome to PhilJS"</p>
    </div>
}`}
        language="rust"
      />

      <Callout type="info" title="String Literals">
        In the view! macro, text content must be quoted. This is different from JSX
        where text can be unquoted.
      </Callout>

      <h2 id="elements">HTML Elements</h2>

      <h3>Standard Elements</h3>

      <CodeBlock
        code={`view! {
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
}`}
        language="rust"
      />

      <h3>Custom Components</h3>

      <CodeBlock
        code={`#[component]
fn Button(text: String, #[prop(optional)] disabled: bool) -> impl IntoView {
    view! {
        <button disabled=disabled>{text}</button>
    }
}

// Usage
view! {
    <Button text="Click me".to_string()/>
    <Button text="Disabled".to_string() disabled=true/>
}`}
        language="rust"
      />

      <h2 id="attributes">Attributes</h2>

      <h3>Static Attributes</h3>

      <CodeBlock
        code={`view! {
    <div class="container" id="main">
        <input type="text" placeholder="Enter text"/>
        <a href="https://example.com" target="_blank">
            "External Link"
        </a>
    </div>
}`}
        language="rust"
      />

      <h3>Dynamic Attributes</h3>

      <CodeBlock
        code={`let (class, _) = create_signal("active");
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
}`}
        language="rust"
      />

      <h3>Class Directives</h3>

      <CodeBlock
        code={`let (active, _) = create_signal(true);
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
}`}
        language="rust"
      />

      <h3>Style Directives</h3>

      <CodeBlock
        code={`let (color, _) = create_signal("red");
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
}`}
        language="rust"
      />

      <h2 id="properties">Properties</h2>

      <CodeBlock
        code={`let (value, set_value) = create_signal(String::new());
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
}`}
        language="rust"
      />

      <Callout type="warning" title="Attributes vs Properties">
        Use <code>prop:</code> for DOM properties like <code>value</code> and <code>checked</code>.
        Use regular attributes for HTML attributes like <code>class</code> and <code>id</code>.
      </Callout>

      <h2 id="events">Event Handlers</h2>

      <h3>Basic Events</h3>

      <CodeBlock
        code={`view! {
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
}`}
        language="rust"
      />

      <h3>Event Modifiers</h3>

      <CodeBlock
        code={`view! {
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
}`}
        language="rust"
      />

      <h3>Keyboard Events</h3>

      <CodeBlock
        code={`view! {
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
}`}
        language="rust"
      />

      <h2 id="refs">Element References</h2>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
      />

      <h2 id="control-flow">Control Flow</h2>

      <h3>Show/Hide</h3>

      <CodeBlock
        code={`let (visible, set_visible) = create_signal(true);

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
}`}
        language="rust"
      />

      <h3>For Loops</h3>

      <CodeBlock
        code={`let items = vec!["Apple", "Banana", "Cherry"];

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
}`}
        language="rust"
      />

      <h3>Match Expressions</h3>

      <CodeBlock
        code={`let (status, _) = create_signal("loading");

view! {
    {move || match status() {
        "loading" => view! { <Spinner/> }.into_view(),
        "error" => view! { <ErrorMessage/> }.into_view(),
        "success" => view! { <Content/> }.into_view(),
        _ => view! { <p>"Unknown"</p> }.into_view(),
    }}
}`}
        language="rust"
      />

      <h2 id="fragments">Fragments</h2>

      <CodeBlock
        code={`// Return multiple elements without a wrapper
view! {
    <>
        <h1>"Title"</h1>
        <p>"Paragraph 1"</p>
        <p>"Paragraph 2"</p>
    </>
}`}
        language="rust"
      />

      <h2 id="spreading">Spreading Props</h2>

      <CodeBlock
        code={`use philjs::prelude::*;

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
}`}
        language="rust"
      />

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/rust-guide/server-functions"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Server Functions</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Call server-side Rust from your components
          </p>
        </Link>

        <Link
          href="/docs/rust-guide/axum"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Axum Integration</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build full-stack apps with Axum
          </p>
        </Link>
      </div>
    </div>
  );
}
