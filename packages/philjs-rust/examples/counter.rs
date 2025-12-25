//! Counter Example
//!
//! Run with: cargo run --example counter

use philjs::prelude::*;

#[component]
fn Counter(initial: i32) -> impl IntoView {
    let count = Signal::new(initial);

    view! {
        <div class="counter">
            <h1>"Count: " {count}</h1>
            <div class="buttons">
                <button on:click=move |_| count.update(|n| *n -= 1)>
                    "-"
                </button>
                <button on:click=move |_| count.set(0)>
                    "Reset"
                </button>
                <button on:click=move |_| count.update(|n| *n += 1)>
                    "+"
                </button>
            </div>
        </div>
    }
}

#[component]
fn App() -> impl IntoView {
    view! {
        <main>
            <h1>"PhilJS Rust Counter"</h1>
            <Counter initial=0 />
            <Counter initial=10 />
        </main>
    }
}

fn main() {
    // For WASM, this mounts to the DOM
    // For SSR, use render_to_string instead
    #[cfg(feature = "wasm")]
    mount(|| view! { <App /> });

    #[cfg(not(feature = "wasm"))]
    {
        let html = render_to_string(|| view! { <App /> });
        println!("{}", html);
    }
}
