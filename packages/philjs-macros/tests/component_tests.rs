//! Component macro tests

use philjs_macros::component;

// Mock PhilJS traits for testing
mod philjs {
    pub trait ComponentName {
        fn component_name() -> &'static str;
    }

    pub trait Component {
        type Output;
        fn render(self) -> Self::Output;
    }

    pub trait IntoView {
        type Output;
        fn into_view(self) -> Self::Output;
    }

    impl IntoView for String {
        type Output = String;
        fn into_view(self) -> Self::Output {
            self
        }
    }
}

#[test]
fn test_simple_component() {
    #[component]
    fn SimpleComponent(name: String) -> String {
        format!("Hello, {}", name)
    }

    let props = SimpleComponentProps {
        name: "World".to_string(),
    };

    let result = SimpleComponent(props);
    assert_eq!(result, "Hello, World");
}

#[test]
fn test_component_with_multiple_props() {
    #[component]
    fn UserCard(name: String, age: u32, email: String) -> String {
        format!("Name: {}, Age: {}, Email: {}", name, age, email)
    }

    let props = UserCardProps {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };

    let result = UserCard(props);
    assert_eq!(result, "Name: Alice, Age: 30, Email: alice@example.com");
}

#[test]
fn test_component_name_generation() {
    #[component]
    fn MyCustomComponent(value: i32) -> String {
        format!("Value: {}", value)
    }

    assert_eq!(
        MyCustomComponentProps::component_name(),
        "MyCustomComponent"
    );
}

#[test]
fn test_snake_case_to_pascal_case() {
    #[component]
    fn user_profile_card(username: String) -> String {
        format!("User: {}", username)
    }

    assert_eq!(
        user_profile_cardProps::component_name(),
        "UserProfileCard"
    );
}

#[test]
fn test_component_with_generics() {
    #[component]
    fn GenericComponent<T: std::fmt::Display>(value: T) -> String {
        format!("Value: {}", value)
    }

    let props = GenericComponentProps { value: 42 };
    let result = GenericComponent(props);
    assert_eq!(result, "Value: 42");

    let props = GenericComponentProps {
        value: "Hello".to_string(),
    };
    let result = GenericComponent(props);
    assert_eq!(result, "Value: Hello");
}

#[test]
fn test_transparent_component() {
    #[component(transparent)]
    fn TransparentComponent(text: String) -> String {
        text.to_uppercase()
    }

    let result = TransparentComponent("hello".to_string());
    assert_eq!(result, "HELLO");
}

#[cfg(test)]
mod async_tests {
    use super::*;

    #[tokio::test]
    async fn test_async_component() {
        #[component]
        async fn AsyncComponent(url: String) -> String {
            // Simulate async operation
            tokio::time::sleep(std::time::Duration::from_millis(10)).await;
            format!("Fetched: {}", url)
        }

        let props = AsyncComponentProps {
            url: "https://example.com".to_string(),
        };

        let result = AsyncComponent(props).await;
        assert_eq!(result, "Fetched: https://example.com");
    }
}
