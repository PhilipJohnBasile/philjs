# Signals

Signals are the foundation of reactivity in PhilJS.

## Creating Signals

```rust
use philjs::prelude::*;

let count = signal!(0);
let name = signal!("World".to_string());
let user = signal!(User { name: "John".into(), age: 30 });
```

## Reading Values

```rust
let count = signal!(0);
let value = count.get();
println!("Count: {}", value);
```

## Updating Values

```rust
let count = signal!(0);

count.set(5);
count.update(|c| *c + 1);
```

## In Components

```rust
use philjs::prelude::*;

#[component]
fn Counter() -> impl IntoView {
    let count = signal!(0);

    view! {
        <div>
            <p>"Count: " {count}</p>
            <button on:click=move |_| count.update(|c| *c + 1)>
                "Increment"
            </button>
        </div>
    }
}
```

## Derived Signals (Memos)

```rust
let count = signal!(0);
let doubled = memo!(count.get() * 2);

count.set(5);
assert_eq!(doubled.get(), 10);
```

## Effects

```rust
let count = signal!(0);

let _effect = Effect::new(move || {
    println!("Count changed to: {}", count.get());
});

count.set(1);
```
