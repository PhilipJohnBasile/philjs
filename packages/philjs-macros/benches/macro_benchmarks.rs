//! Benchmarks for philjs-macros
//!
//! Run with: cargo bench

use philjs_macros::{component, view, Props, signal, server};

// Benchmark: Component macro expansion time
#[component]
fn BenchComponent(
    prop1: String,
    prop2: i32,
    prop3: bool,
    prop4: Vec<String>,
    prop5: Option<u32>,
) -> impl IntoView {
    view! {
        <div>
            {prop1} {prop2} {prop3}
        </div>
    }
}

// Benchmark: Signal macro with many fields
#[signal]
struct BenchState {
    field1: i32,
    field2: String,
    field3: bool,
    field4: Vec<i32>,
    field5: Option<String>,
    field6: u64,
    field7: f64,
    field8: Vec<String>,
}

// Benchmark: Props macro with many attributes
#[derive(Props, Clone)]
struct BenchProps {
    required1: String,
    required2: i32,

    #[prop(default = r#""default".to_string()"#)]
    with_default1: String,

    #[prop(default = "42")]
    with_default2: i32,

    #[prop(optional)]
    optional1: Option<String>,

    #[prop(optional)]
    optional2: Option<Vec<i32>>,

    #[prop(into)]
    with_into1: String,

    #[prop(into)]
    with_into2: String,
}

// Benchmark: Complex view macro
fn bench_view_macro() -> impl IntoView {
    let items = vec!["Item 1", "Item 2", "Item 3"];
    let show_header = true;
    let title = "Benchmark";

    view! {
        <div class="container">
            {show_header.then(|| view! {
                <header>
                    <h1>{title}</h1>
                    <nav>
                        <a href="/">"Home"</a>
                        <a href="/about">"About"</a>
                        <a href="/contact">"Contact"</a>
                    </nav>
                </header>
            })}

            <main>
                <section class="content">
                    <h2>"Items"</h2>
                    <ul>
                        {items.iter().enumerate().map(|(i, item)| view! {
                            <li class={format!("item-{}", i)}>
                                <span>{item}</span>
                                <button on:click={move |_| {}}>"Click"</button>
                            </li>
                        }).collect::<Vec<_>>()}
                    </ul>
                </section>

                <section class="sidebar">
                    <h3>"Sidebar"</h3>
                    <p>"Some sidebar content"</p>
                </section>
            </main>

            <footer>
                <p>"Copyright 2024"</p>
            </footer>
        </div>
    }
}

// Benchmark: Server function
#[server]
async fn bench_server_function(
    param1: String,
    param2: i32,
    param3: Vec<String>,
) -> Result<String, String> {
    Ok(format!("{} {} {:?}", param1, param2, param3))
}

// Benchmark: Nested components
#[component]
fn InnerComponent(value: i32) -> impl IntoView {
    view! {
        <div class="inner">
            {value}
        </div>
    }
}

#[component]
fn MiddleComponent(start: i32, end: i32) -> impl IntoView {
    view! {
        <div class="middle">
            {(start..end).map(|i| view! {
                <InnerComponent value={i} />
            }).collect::<Vec<_>>()}
        </div>
    }
}

#[component]
fn OuterComponent(count: i32) -> impl IntoView {
    view! {
        <div class="outer">
            <MiddleComponent start={0} end={count} />
        </div>
    }
}

// Benchmark: Generic components
#[component]
fn GenericList<T: Clone + std::fmt::Display>(items: Vec<T>) -> impl IntoView {
    view! {
        <ul>
            {items.iter().map(|item| view! {
                <li>{item.to_string()}</li>
            }).collect::<Vec<_>>()}
        </ul>
    }
}

// Compile-time benchmarks (these just verify compilation speed)
// The actual benchmarking would be done by measuring build times

#[cfg(test)]
mod bench_tests {
    use super::*;

    #[test]
    fn bench_component_creation() {
        let props = BenchComponentProps {
            prop1: "test".to_string(),
            prop2: 42,
            prop3: true,
            prop4: vec!["a".to_string()],
            prop5: Some(10),
        };

        let _component = BenchComponent(props);
    }

    #[test]
    fn bench_signal_creation() {
        let _state = BenchState::new(
            0,
            String::new(),
            false,
            vec![],
            None,
            0,
            0.0,
            vec![],
        );
    }

    #[test]
    fn bench_props_builder() {
        let _props = BenchProps::builder()
            .required1("test".to_string())
            .required2(42)
            .with_into1("test")
            .with_into2("test")
            .build();
    }

    #[test]
    fn bench_view_creation() {
        let _view = bench_view_macro();
    }

    #[test]
    fn bench_nested_components() {
        let _outer = OuterComponent(OuterComponentProps { count: 10 });
    }

    #[test]
    fn bench_generic_components() {
        let numbers = vec![1, 2, 3, 4, 5];
        let _list = GenericList(GenericListProps { items: numbers });

        let strings = vec!["a".to_string(), "b".to_string()];
        let _list = GenericList(GenericListProps { items: strings });
    }
}

// Performance measurement notes:
//
// To measure macro expansion time:
// 1. cargo clean
// 2. cargo build --timings
// 3. Check the HTML report for proc-macro compilation time
//
// To measure generated code efficiency:
// 1. cargo build --release
// 2. cargo bloat --release (for binary size)
// 3. Use cargo-llvm-lines for IR analysis
//
// To benchmark runtime performance:
// Use criterion with actual runtime tests (separate benchmark)
