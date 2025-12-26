# Signals

Signals are the foundation of reactivity in PhilJS.

## Creating Signals

\`\`\`rust
use philjs_rust::prelude::*;

// Create a signal
let count = signal(0);
let name = signal("World".to_string());
let user = signal(User { name: "John".into(), age: 30 });
\`\`\`

## Reading Values

\`\`\`rust
let count = signal(0);

// Read the current value
let value = count.get();
println!("Count: {}", value);
\`\`\`

## Updating Values

\`\`\`rust
let count = signal(0);

// Set a new value
count.set(5);

// Update based on previous value
count.update(|c| c + 1);
\`\`\`

## In Components

\`\`\`rust
#[component]
fn Counter() -> impl IntoView {
    let count = signal(0);
    
    view! {
        <div>
            <p>"Count: " {count}</p>
            <button on:click=move |_| count.update(|c| c + 1)>
                "Increment"
            </button>
        </div>
    }
}
\`\`\`

## Derived Signals (Memos)

\`\`\`rust
let count = signal(0);
let doubled = memo(move || count.get() * 2);

count.set(5);
assert_eq!(doubled.get(), 10);
\`\`\`

## Effects

\`\`\`rust
let count = signal(0);

effect(move || {
    println!("Count changed to: {}", count.get());
});

count.set(1); // Prints: "Count changed to: 1"
\`\`\`
