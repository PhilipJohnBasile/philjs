//! Props derive macro tests

use philjs_macros::Props;

// Mock PhilJS Props trait
mod philjs {
    pub trait Props {
        type Builder;
        fn builder() -> Self::Builder;
    }
}

#[test]
fn test_simple_props() {
    #[derive(Props, Clone)]
    struct ButtonProps {
        text: String,
    }

    let props = ButtonProps::builder().text("Click me".to_string()).build();

    assert_eq!(props.text, "Click me");
}

#[test]
fn test_props_with_defaults() {
    #[derive(Props, Clone)]
    struct CardProps {
        title: String,
        #[prop(default = r#""primary".to_string()"#)]
        variant: String,
    }

    let props = CardProps::builder()
        .title("My Card".to_string())
        .build();

    assert_eq!(props.title, "My Card");
    assert_eq!(props.variant, "primary");
}

#[test]
fn test_props_with_optional() {
    #[derive(Props, Clone)]
    struct UserProps {
        name: String,
        #[prop(optional)]
        email: Option<String>,
    }

    let props1 = UserProps::builder().name("Alice".to_string()).build();
    assert_eq!(props1.name, "Alice");
    assert_eq!(props1.email, None);

    let props2 = UserProps::builder()
        .name("Bob".to_string())
        .email("bob@example.com".to_string())
        .build();
    assert_eq!(props2.name, "Bob");
    assert_eq!(props2.email, Some("bob@example.com".to_string()));
}

#[test]
fn test_props_with_into() {
    #[derive(Props, Clone)]
    struct TextProps {
        #[prop(into)]
        content: String,
    }

    let props = TextProps::builder().content("Hello").build();
    assert_eq!(props.content, "Hello");
}

#[test]
fn test_props_builder_pattern() {
    #[derive(Props, Clone)]
    struct ComplexProps {
        id: u32,
        name: String,
        #[prop(default = "true")]
        active: bool,
        #[prop(optional)]
        description: Option<String>,
    }

    let props = ComplexProps::builder()
        .id(1)
        .name("Test".to_string())
        .description("A test item".to_string())
        .build();

    assert_eq!(props.id, 1);
    assert_eq!(props.name, "Test");
    assert_eq!(props.active, true);
    assert_eq!(props.description, Some("A test item".to_string()));
}

#[test]
fn test_props_with_generics() {
    #[derive(Props, Clone)]
    struct GenericProps<T> {
        value: T,
    }

    let props = GenericProps::builder().value(42).build();
    assert_eq!(props.value, 42);

    let props = GenericProps::builder()
        .value("Hello".to_string())
        .build();
    assert_eq!(props.value, "Hello");
}

#[test]
fn test_props_multiple_defaults() {
    #[derive(Props, Clone)]
    struct StyledProps {
        content: String,
        #[prop(default = r#""16px".to_string()"#)]
        font_size: String,
        #[prop(default = r#""black".to_string()"#)]
        color: String,
        #[prop(default = "false")]
        bold: bool,
    }

    let props = StyledProps::builder()
        .content("Text".to_string())
        .bold(true)
        .build();

    assert_eq!(props.content, "Text");
    assert_eq!(props.font_size, "16px");
    assert_eq!(props.color, "black");
    assert_eq!(props.bold, true);
}

#[test]
#[should_panic(expected = "Missing required prop")]
fn test_missing_required_prop() {
    #[derive(Props, Clone)]
    struct RequiredProps {
        name: String,
        age: u32,
    }

    // This should panic because age is missing
    let _props = RequiredProps::builder().name("Alice".to_string()).build();
}

#[test]
fn test_props_default_builder() {
    #[derive(Props, Clone)]
    struct SimpleProps {
        value: i32,
    }

    let builder1 = SimpleProps::builder();
    let builder2 = SimplePropsBuilder::default();

    // Both should work
    let _props1 = builder1.value(10).build();
    let _props2 = builder2.value(20).build();
}
