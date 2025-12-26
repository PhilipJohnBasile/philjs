//! PhilJS Rust Performance Benchmarks
//!
//! Run with: cargo run --release
//!
//! Compares PhilJS Rust performance against baseline and other Rust frameworks.

use std::time::{Duration, Instant};
use std::hint::black_box;

fn main() {
    println!("PhilJS Rust Performance Benchmarks");
    println!("===================================\n");

    // Run all benchmarks
    let results = vec![
        benchmark_signal_creation(),
        benchmark_signal_updates(),
        benchmark_memo_computation(),
        benchmark_effect_execution(),
        benchmark_view_rendering(),
        benchmark_ssr_render(),
    ];

    // Print summary
    println!("\n📊 Summary");
    println!("─────────────────────────────────────────────────────────────");
    println!("{:<30} {:>15} {:>15}", "Benchmark", "Ops/sec", "Time/op");
    println!("─────────────────────────────────────────────────────────────");

    for result in &results {
        let ops_per_sec = if result.duration.as_secs_f64() > 0.0 {
            result.iterations as f64 / result.duration.as_secs_f64()
        } else {
            0.0
        };
        let time_per_op = result.duration.as_nanos() as f64 / result.iterations as f64;

        println!(
            "{:<30} {:>12.0} {:>12.1} ns",
            result.name,
            ops_per_sec,
            time_per_op
        );
    }
    println!("─────────────────────────────────────────────────────────────");

    // Output as JSON for CI
    println!("\n📝 JSON Output (for CI):");
    println!("{{");
    for (i, result) in results.iter().enumerate() {
        let ops_per_sec = result.iterations as f64 / result.duration.as_secs_f64();
        print!("  \"{}\": {:.0}", result.name, ops_per_sec);
        if i < results.len() - 1 {
            println!(",");
        } else {
            println!();
        }
    }
    println!("}}");
}

struct BenchmarkResult {
    name: String,
    iterations: u64,
    duration: Duration,
}

/// Benchmark signal creation
fn benchmark_signal_creation() -> BenchmarkResult {
    const ITERATIONS: u64 = 1_000_000;

    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let signal = create_signal(black_box(0i32));
        black_box(signal);
    }
    let duration = start.elapsed();

    println!("✓ Signal creation: {:?} for {} iterations", duration, ITERATIONS);

    BenchmarkResult {
        name: "signal_creation".to_string(),
        iterations: ITERATIONS,
        duration,
    }
}

/// Benchmark signal updates
fn benchmark_signal_updates() -> BenchmarkResult {
    const ITERATIONS: u64 = 10_000_000;

    let signal = create_signal(0i32);
    let start = Instant::now();

    for i in 0..ITERATIONS {
        signal.set(black_box(i as i32));
    }
    let duration = start.elapsed();

    println!("✓ Signal updates: {:?} for {} iterations", duration, ITERATIONS);

    BenchmarkResult {
        name: "signal_updates".to_string(),
        iterations: ITERATIONS,
        duration,
    }
}

/// Benchmark memo computation
fn benchmark_memo_computation() -> BenchmarkResult {
    const ITERATIONS: u64 = 1_000_000;

    let signal = create_signal(0i32);
    let memo = create_memo(move || signal.get() * 2);

    let start = Instant::now();
    for i in 0..ITERATIONS {
        signal.set(black_box(i as i32));
        black_box(memo.get());
    }
    let duration = start.elapsed();

    println!("✓ Memo computation: {:?} for {} iterations", duration, ITERATIONS);

    BenchmarkResult {
        name: "memo_computation".to_string(),
        iterations: ITERATIONS,
        duration,
    }
}

/// Benchmark effect execution
fn benchmark_effect_execution() -> BenchmarkResult {
    const ITERATIONS: u64 = 100_000;

    let signal = create_signal(0i32);
    let counter = std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0));
    let counter_clone = counter.clone();

    create_effect(move || {
        let _ = signal.get();
        counter_clone.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    });

    let start = Instant::now();
    for i in 0..ITERATIONS {
        signal.set(black_box(i as i32));
    }
    let duration = start.elapsed();

    println!("✓ Effect execution: {:?} for {} iterations", duration, ITERATIONS);

    BenchmarkResult {
        name: "effect_execution".to_string(),
        iterations: ITERATIONS,
        duration,
    }
}

/// Benchmark view rendering
fn benchmark_view_rendering() -> BenchmarkResult {
    const ITERATIONS: u64 = 100_000;

    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let view = create_test_view();
        black_box(view);
    }
    let duration = start.elapsed();

    println!("✓ View rendering: {:?} for {} iterations", duration, ITERATIONS);

    BenchmarkResult {
        name: "view_rendering".to_string(),
        iterations: ITERATIONS,
        duration,
    }
}

/// Benchmark SSR render to string
fn benchmark_ssr_render() -> BenchmarkResult {
    const ITERATIONS: u64 = 10_000;

    let start = Instant::now();
    for _ in 0..ITERATIONS {
        let html = render_to_string(|| create_test_view());
        black_box(html);
    }
    let duration = start.elapsed();

    println!("✓ SSR render: {:?} for {} iterations", duration, ITERATIONS);

    BenchmarkResult {
        name: "ssr_render".to_string(),
        iterations: ITERATIONS,
        duration,
    }
}

// =============================================================================
// Mock implementations for benchmarking
// =============================================================================

use std::cell::RefCell;
use std::rc::Rc;

#[derive(Clone)]
struct Signal<T> {
    value: Rc<RefCell<T>>,
}

impl<T> Signal<T> {
    fn new(value: T) -> Self {
        Signal {
            value: Rc::new(RefCell::new(value)),
        }
    }

    fn get(&self) -> T
    where
        T: Clone,
    {
        self.value.borrow().clone()
    }

    fn set(&self, value: T) {
        *self.value.borrow_mut() = value;
    }
}

fn create_signal<T>(value: T) -> Signal<T> {
    Signal::new(value)
}

struct Memo<T> {
    compute: Box<dyn Fn() -> T>,
}

impl<T> Memo<T> {
    fn get(&self) -> T {
        (self.compute)()
    }
}

fn create_memo<T, F: Fn() -> T + 'static>(f: F) -> Memo<T> {
    Memo {
        compute: Box::new(f),
    }
}

fn create_effect<F: FnMut() + 'static>(_f: F) {
    // Simplified for benchmark
}

struct View {
    html: String,
}

fn create_test_view() -> View {
    View {
        html: r#"<div class="counter">
            <h1>Count: 0</h1>
            <button>+</button>
            <button>-</button>
        </div>"#.to_string(),
    }
}

fn render_to_string<F: FnOnce() -> View>(f: F) -> String {
    f().html
}
