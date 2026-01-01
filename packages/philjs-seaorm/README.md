# PhilJS SeaORM Integration

Entity-based database queries with active record pattern for PhilJS applications.

## Features

- **Reactive Entity Queries**: Integrate SeaORM with PhilJS's reactive system
- **Entity Lifecycle Hooks**: Automatic validation and auditing
- **Pagination Helpers**: Offset and cursor-based pagination
- **Type-safe ORM**: Compile-time checked entity relationships
- **Migration Support**: Database schema management

## Installation

```toml
[dependencies]
philjs-seaorm = { version = "2.0", features = ["sqlx-postgres"] }
```

## Quick Start

```rust
use philjs_seaorm::prelude::*;
use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub name: String,
    pub email: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

// Query users
let users = Entity::find()
    .filter(Column::Active.eq(true))
    .all(&db)
    .await?;
```

## Reactive Queries

```rust
use philjs_seaorm::reactive::ReactiveEntity;

let users = ReactiveEntity::<users::Entity>::new(&db)
    .filter(users::Column::Active.eq(true))
    .order_by_asc(users::Column::Name)
    .limit(10);

// Use with PhilJS resources
let data = create_resource(
    || (),
    move |_| async move {
        users.all().await
    }
);
```

## Lifecycle Hooks

```rust
use philjs_seaorm::hooks::{HookedEntity, BeforeHook, LoggingHook};
use std::sync::Arc;

let hooked = HookedEntity::<users::Entity>::new(&db)
    .with_before_hook(Arc::new(LoggingHook::new("users")))
    .with_after_hook(Arc::new(AuditHook));

let user = hooked.insert(user_model).await?;
```

## Pagination

### Offset Pagination

```rust
use philjs_seaorm::pagination::{Paginator, PaginationParams};

let params = PaginationParams::new(1, 20);
let result = Paginator::new(&db, users::Entity::find())
    .paginate(params)
    .await?;

println!("Total: {}, Pages: {}", result.pagination.total, result.pagination.total_pages);
```

### Cursor Pagination

```rust
use philjs_seaorm::pagination::{CursorPaginator, CursorParams};

let params = CursorParams { cursor: None, limit: 20 };
let result = CursorPaginator::new(&db, posts::Entity::find())
    .by_column(posts::Column::Id)
    .paginate(params)
    .await?;
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Source files: packages/philjs-seaorm/src/lib.rs

### Public API
- Public modules: context, entity, error, hooks, migration, pagination, prelude, query, reactive
- Public items: ConnectionBuilder, build_options, connect, connect_timeout_secs, connect_with_options, idle_timeout_secs, max_connections, min_connections, new, sqlx_logging
- Re-exports: context::{provide_db, use_db, DbProvider}, crate::context::{provide_db, use_db, DbProvider}, crate::entity::{EntityHelpers, Pagination, SortOrder}, crate::error::{OrmError, OrmResult}, crate::hooks::{HookedEntity, BeforeHook, AfterHook, ValidationHook, LoggingHook}, crate::pagination::{
        Paginator, PaginationParams, PaginationMeta, PaginatedResult,
        CursorPaginator, CursorParams, CursorResult, PaginateExt,
    }, crate::query::{QueryHelpers, FilterBuilder, RelationLoader}, crate::reactive::{ReactiveEntity, ReactiveQueryBuilder, EntityResource}, entity::{EntityHelpers, Pagination, SortOrder}, error::{OrmError, OrmResult}, migration::{Migrator, MigrationStatus}, philjs::prelude::*, query::{QueryHelpers, FilterBuilder, RelationLoader}, sea_orm::entity::prelude::*, sea_orm::{
        entity::*, query::*, ActiveModelTrait, ActiveValue,
        ColumnTrait, EntityTrait, ModelTrait, Set,
        DatabaseConnection, DatabaseTransaction,
        ConnectionTrait, TransactionTrait,
        FromQueryResult, IntoActiveModel,
        Related, RelationDef, RelationTrait,
        Condition, Order,
    }, sea_orm::{
    entity::*, query::*, ActiveModelTrait, ActiveValue,
    ColumnTrait, EntityTrait, ModelTrait, PrimaryKeyTrait,
    DatabaseConnection, DatabaseTransaction, ConnectOptions,
    ConnectionTrait, TransactionTrait, Statement,
    DbErr, DbBackend, ExecResult,
    FromQueryResult, IntoActiveModel, TryIntoModel,
    Related, RelationDef, RelationTrait,
    Condition, Order, Value,
}, sea_query::{Expr, Func, SimpleExpr}
<!-- API_SNAPSHOT_END -->

## License

MIT
