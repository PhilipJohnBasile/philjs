//! Query tests for PhilJS SQLx integration

#[cfg(test)]
mod tests {
    use sqlx::FromRow;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Clone, PartialEq, FromRow, Serialize, Deserialize)]
    struct TestUser {
        id: i64,
        name: String,
        email: String,
    }

    #[tokio::test]
    async fn test_reactive_query_builder() {
        use philjs_sqlx::reactive::ReactiveQueryBuilder;

        let builder = ReactiveQueryBuilder::new("users")
            .select(&["id", "name", "email"])
            .where_clause("active = true")
            .order_by("name ASC")
            .limit(10);

        let sql = builder.build();

        assert!(sql.contains("SELECT id, name, email"));
        assert!(sql.contains("FROM users"));
        assert!(sql.contains("WHERE active = true"));
        assert!(sql.contains("ORDER BY name ASC"));
        assert!(sql.contains("LIMIT 10"));
    }

    #[tokio::test]
    async fn test_query_builder_with_offset() {
        use philjs_sqlx::reactive::ReactiveQueryBuilder;

        let builder = ReactiveQueryBuilder::new("posts")
            .select(&["title", "content"])
            .where_clause("published = true")
            .order_by("created_at DESC")
            .limit(20)
            .offset(40);

        let sql = builder.build();

        assert!(sql.contains("LIMIT 20"));
        assert!(sql.contains("OFFSET 40"));
    }

    #[test]
    fn test_transaction_helper_creation() {
        // Placeholder for transaction helper tests
        // In real scenarios, use sqlx::test with a test database
    }

    #[test]
    fn test_migration_runner_creation() {
        // Placeholder for migration tests
        // In real scenarios, use a test database with migrations
    }
}
