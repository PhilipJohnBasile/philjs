//! Basic usage examples for philjs-macros

use philjs_macros::{component, view, Props, signal, server};

// Example 1: Simple Component
#[component]
fn Greeting(name: String) -> impl IntoView {
    view! {
        <div class="greeting">
            <h1>"Hello, " {name} "!"</h1>
        </div>
    }
}

// Example 2: Component with Props trait
#[derive(Props, Clone)]
struct ButtonProps {
    text: String,
    #[prop(default = r#""primary".to_string()"#)]
    variant: String,
    #[prop(optional)]
    on_click: Option<Callback<()>>,
}

#[component]
fn Button(props: ButtonProps) -> impl IntoView {
    view! {
        <button
            class={format!("btn btn-{}", props.variant)}
            on:click={props.on_click}
        >
            {props.text}
        </button>
    }
}

// Example 3: Reactive State with Signals
#[signal]
struct Counter {
    count: i32,
    step: i32,
}

#[component]
fn CounterComponent(initial: i32) -> impl IntoView {
    let counter = Counter::new(initial, 1);

    let increment = move || {
        counter.update_count(|c| *c += counter.step());
    };

    let decrement = move || {
        counter.update_count(|c| *c -= counter.step());
    };

    view! {
        <div class="counter">
            <h2>"Counter: " {counter.count()}</h2>
            <button on:click={increment}>"+"</button>
            <button on:click={decrement}>"-"</button>
            <input
                type="number"
                value={counter.step()}
                on:input={move |e| counter.set_step(e.target.value.parse().unwrap_or(1))}
                placeholder="Step"
            />
        </div>
    }
}

// Example 4: Server Functions
#[derive(serde::Serialize, serde::Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[server]
async fn get_user(id: u32) -> Result<User, ServerError> {
    // This code only runs on the server
    let db = get_database_connection().await?;
    let user = db.query_user(id).await?;
    Ok(user)
}

#[server]
async fn create_user(name: String, email: String) -> Result<u32, ServerError> {
    let db = get_database_connection().await?;
    let id = db.insert_user(&name, &email).await?;
    Ok(id)
}

// Example 5: Complex View with Conditionals and Loops
#[derive(Props, Clone)]
struct TodoListProps {
    #[prop(into)]
    title: String,
    items: Vec<String>,
    show_completed: bool,
}

#[component]
fn TodoList(props: TodoListProps) -> impl IntoView {
    view! {
        <div class="todo-list">
            <h2>{props.title}</h2>

            {(!props.items.is_empty()).then(|| view! {
                <ul>
                    {props.items.iter().map(|item| view! {
                        <li class="todo-item">
                            <input type="checkbox" />
                            <span>{item}</span>
                        </li>
                    }).collect::<Vec<_>>()}
                </ul>
            }).unwrap_or_else(|| view! {
                <p class="empty">"No items to display"</p>
            })}

            {props.show_completed.then(|| view! {
                <div class="completed">
                    <h3>"Completed Tasks"</h3>
                </div>
            })}
        </div>
    }
}

// Example 6: Generic Component
#[derive(Props, Clone)]
struct ListProps<T: Clone> {
    items: Vec<T>,
    #[prop(into)]
    empty_message: String,
}

#[component]
fn List<T: std::fmt::Display + Clone>(props: ListProps<T>) -> impl IntoView {
    view! {
        <div class="list">
            {if props.items.is_empty() {
                view! { <p>{props.empty_message}</p> }
            } else {
                view! {
                    <ul>
                        {props.items.iter().map(|item| view! {
                            <li>{item.to_string()}</li>
                        }).collect::<Vec<_>>()}
                    </ul>
                }
            }}
        </div>
    }
}

// Example 7: Nested Components
#[component]
fn Card(title: String, children: Children) -> impl IntoView {
    view! {
        <div class="card">
            <div class="card-header">
                <h3>{title}</h3>
            </div>
            <div class="card-body">
                {children}
            </div>
        </div>
    }
}

#[component]
fn App() -> impl IntoView {
    let user_name = "Alice";
    let todos = vec![
        "Learn PhilJS".to_string(),
        "Build an app".to_string(),
        "Deploy to production".to_string(),
    ];

    view! {
        <div class="app">
            <header>
                <Greeting name={user_name.to_string()} />
            </header>

            <main>
                <Card title="My Todos".to_string()>
                    <TodoList
                        title="Things to Do"
                        items={todos}
                        show_completed={false}
                    />
                </Card>

                <Card title="Counter Example".to_string()>
                    <CounterComponent initial={0} />
                </Card>
            </main>
        </div>
    }
}

fn main() {
    // Initialize the app
    philjs::mount(App, "#app");
}
