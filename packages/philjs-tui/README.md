# @philjs/tui

Terminal UI components for building CLI applications with Rust. Create rich, interactive terminal interfaces with a React-like component model.

## Installation

**Rust (Cargo.toml):**
```toml
[dependencies]
philjs-tui = "0.1"
```

## Basic Usage

```rust
use philjs_tui::prelude::*;

fn main() -> Result<()> {
    let app = App::new()
        .title("My TUI App")
        .component(Dashboard);

    app.run()
}

#[component]
fn Dashboard() -> Element {
    let (count, set_count) = use_state(0);

    column![
        text!("Counter: {}", count).bold(),
        row![
            button!("Increment", || set_count(count + 1)),
            button!("Decrement", || set_count(count - 1)),
        ],
        progress_bar!(count as f64 / 100.0),
    ]
}
```

## Features

- **Component Model** - React-like functional components
- **State Management** - Hooks for state and effects
- **Layout System** - Flexbox-inspired layouts
- **Widgets** - Pre-built UI components
- **Styling** - Colors, borders, and text styles
- **Input Handling** - Keyboard and mouse events
- **Async Support** - Tokio integration for async operations
- **Animations** - Smooth transitions and animations
- **Unicode** - Full Unicode and emoji support
- **Responsive** - Adapts to terminal size
- **Accessibility** - Screen reader friendly

## Components

| Component | Description |
|-----------|-------------|
| `text!` | Styled text display |
| `input!` | Text input field |
| `button!` | Clickable button |
| `select!` | Dropdown selection |
| `checkbox!` | Checkbox toggle |
| `progress_bar!` | Progress indicator |
| `table!` | Data table |
| `list!` | Scrollable list |
| `tabs!` | Tab navigation |
| `modal!` | Modal dialog |
| `chart!` | ASCII charts |

## Layout

```rust
// Vertical stack
column![
    text!("Header"),
    content,
    text!("Footer"),
]

// Horizontal row
row![
    sidebar,
    main_content,
]

// Grid layout
grid!(2, 2)[
    cell1, cell2,
    cell3, cell4,
]
```

## Hooks

| Hook | Description |
|------|-------------|
| `use_state` | Component state |
| `use_effect` | Side effects |
| `use_async` | Async operations |
| `use_input` | Input handling |
| `use_size` | Terminal dimensions |

## Styling

```rust
text!("Hello")
    .bold()
    .fg(Color::Green)
    .bg(Color::Black)
    .padding(1)
    .border(Border::Rounded)
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Source files: packages/philjs-tui/src/lib.rs

### Public API
- Public modules: app, components, event, layout, prelude, render, style, widgets
- Public items: TuiApp, TuiConfig, TuiError, draw, new, quit, run, run_with_config, should_quit, size
- Re-exports: crate::{
        run, run_with_config, TuiApp, TuiConfig, TuiError,
        components::*,
        layout::*,
        style::*,
        event::*,
        widgets::*,
    }, ratatui::style::{Color, Modifier, Style}
<!-- API_SNAPSHOT_END -->

## License

MIT
