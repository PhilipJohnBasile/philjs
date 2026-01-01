//! Counter Example
//!
//! Run with: cargo run --example counter

use philjs::prelude::*;

#[component]
fn Counter(initial: i32) -> impl IntoView {
    let count = Signal::new(initial);

    let decrement = {
        let count = count.clone();
        move |_| count.update(|n| *n -= 1)
    };
    let reset = {
        let count = count.clone();
        move |_| count.set(0)
    };
    let increment = {
        let count = count.clone();
        move |_| count.update(|n| *n += 1)
    };

    let heading = Element::new("h1")
        .child(Text::new("Count: "))
        .child(count.clone().into_view());

    let buttons = Element::new("div")
        .attr("class", "buttons")
        .child(Element::new("button").on("click", decrement).child(Text::new("-")))
        .child(Element::new("button").on("click", reset).child(Text::new("Reset")))
        .child(Element::new("button").on("click", increment).child(Text::new("+")));

    Element::new("div")
        .attr("class", "counter")
        .child(heading)
        .child(buttons)
}

#[component]
fn App() -> impl IntoView {
    let heading = Element::new("h1").child(Text::new("PhilJS Rust Counter"));
    let counter_one = Counter(CounterProps { initial: 0 });
    let counter_two = Counter(CounterProps { initial: 10 });

    Element::new("main")
        .child(heading)
        .child(counter_one.into_view())
        .child(counter_two.into_view())
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
