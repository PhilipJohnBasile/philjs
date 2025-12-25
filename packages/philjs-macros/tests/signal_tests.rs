//! Signal macro tests

use philjs_macros::signal;
use std::cell::RefCell;
use std::rc::Rc;

// Mock PhilJS Signal type for testing
mod philjs {
    use std::cell::RefCell;
    use std::rc::Rc;

    #[derive(Clone)]
    pub struct Signal<T> {
        value: Rc<RefCell<T>>,
    }

    impl<T> Signal<T> {
        pub fn get(&self) -> T
        where
            T: Clone,
        {
            self.value.borrow().clone()
        }

        pub fn set(&self, new_value: T) {
            *self.value.borrow_mut() = new_value;
        }

        pub fn update(&self, f: impl FnOnce(&mut T)) {
            f(&mut self.value.borrow_mut());
        }
    }

    pub fn create_signal<T>(initial: T) -> Signal<T> {
        Signal {
            value: Rc::new(RefCell::new(initial)),
        }
    }
}

#[test]
fn test_signal_struct() {
    #[signal]
    struct Counter {
        count: i32,
    }

    let counter = Counter::new(0);
    assert_eq!(counter.count(), 0);

    counter.set_count(5);
    assert_eq!(counter.count(), 5);

    counter.update_count(|n| *n += 10);
    assert_eq!(counter.count(), 15);
}

#[test]
fn test_signal_with_multiple_fields() {
    #[signal]
    struct UserState {
        name: String,
        age: u32,
        is_active: bool,
    }

    let state = UserState::new("Alice".to_string(), 30, true);

    assert_eq!(state.name(), "Alice");
    assert_eq!(state.age(), 30);
    assert_eq!(state.is_active(), true);

    state.set_name("Bob".to_string());
    state.set_age(25);
    state.set_is_active(false);

    assert_eq!(state.name(), "Bob");
    assert_eq!(state.age(), 25);
    assert_eq!(state.is_active(), false);
}

#[test]
fn test_signal_update_method() {
    #[signal]
    struct TodoList {
        items: Vec<String>,
    }

    let todos = TodoList::new(vec!["Task 1".to_string()]);

    todos.update_items(|items| {
        items.push("Task 2".to_string());
        items.push("Task 3".to_string());
    });

    let items = todos.items();
    assert_eq!(items.len(), 3);
    assert_eq!(items[0], "Task 1");
    assert_eq!(items[1], "Task 2");
    assert_eq!(items[2], "Task 3");
}

#[test]
fn test_signal_clone() {
    #[signal]
    struct SharedCounter {
        value: i32,
    }

    let counter1 = SharedCounter::new(10);
    let counter2 = counter1.clone();

    counter1.set_value(20);

    // Both should see the same value since they share the signal
    assert_eq!(counter1.value(), 20);
    assert_eq!(counter2.value(), 20);
}

#[test]
fn test_signal_with_complex_types() {
    #[derive(Clone, Debug, PartialEq)]
    struct User {
        id: u32,
        name: String,
    }

    #[signal]
    struct AppState {
        current_user: Option<User>,
        users: Vec<User>,
    }

    let state = AppState::new(None, vec![]);

    state.set_current_user(Some(User {
        id: 1,
        name: "Alice".to_string(),
    }));

    let user = state.current_user();
    assert!(user.is_some());
    assert_eq!(user.unwrap().name, "Alice");

    state.update_users(|users| {
        users.push(User {
            id: 2,
            name: "Bob".to_string(),
        });
    });

    assert_eq!(state.users().len(), 1);
}

#[test]
fn test_signal_with_generics() {
    #[signal]
    struct GenericState<T> {
        value: T,
    }

    let int_state = GenericState::new(42);
    assert_eq!(int_state.value(), 42);

    let string_state = GenericState::new("Hello".to_string());
    assert_eq!(string_state.value(), "Hello");
}
