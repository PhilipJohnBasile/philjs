# Schema Management

This guide covers schema validation, type safety utilities, and relationship definitions in @philjs/db.

## Schema Validation

The `SchemaValidator` class provides runtime validation for database entities.

### Creating a Validator

```typescript
import { validator, SchemaValidator } from '@philjs/db';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const userValidator = validator<User>({
  // Required fields
  required: ['name', 'email'],

  // Unique fields (checked during validation context)
  unique: ['email'],

  // Minimum values/lengths
  min: {
    name: 2,      // Minimum 2 characters
    age: 0,       // Minimum value 0
  },

  // Maximum values/lengths
  max: {
    name: 100,    // Maximum 100 characters
    age: 150,     // Maximum value 150
  },

  // Regex patterns
  pattern: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-Z\s]+$/,
  },

  // Custom validation functions
  custom: {
    name: (value) => {
      if (value.trim().length === 0) {
        return 'Name cannot be only whitespace';
      }
      return true;
    },
    age: (value) => {
      if (value < 13) {
        return 'Users must be at least 13 years old';
      }
      return true;
    },
  },
});
```

### Validating Data

```typescript
// Validate an object
const result = userValidator.validate({
  name: 'J',
  email: 'invalid-email',
  age: 10,
});

if (!result.valid) {
  console.log('Validation errors:', result.errors);
  // [
  //   { field: 'name', message: 'name must be at least 2 characters', type: 'minLength' },
  //   { field: 'email', message: 'email does not match required pattern', type: 'pattern' },
  //   { field: 'age', message: 'Users must be at least 13 years old', type: 'custom' },
  // ]
}
```

### Async Validation

```typescript
// Async validation (useful for database checks)
const result = await userValidator.validateAsync({
  name: 'John',
  email: 'john@example.com',
});

if (result.valid) {
  // Data is valid
  await saveToDatabase(data);
}
```

### Validation Constraints

#### Required Fields

```typescript
const validator = validator<User>({
  required: ['name', 'email', 'password'],
});

// Missing required field
const result = validator.validate({ name: 'John' });
// Error: { field: 'email', message: 'email is required', type: 'required' }
// Error: { field: 'password', message: 'password is required', type: 'required' }
```

#### Min/Max Values

For numbers, validates the value. For strings, validates the length:

```typescript
const validator = validator<User>({
  min: {
    age: 18,         // Number: value >= 18
    name: 2,         // String: length >= 2
    password: 8,     // String: length >= 8
  },
  max: {
    age: 120,        // Number: value <= 120
    name: 50,        // String: length <= 50
    bio: 500,        // String: length <= 500
  },
});
```

#### Pattern Matching

```typescript
const validator = validator<User>({
  pattern: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[1-9]\d{1,14}$/,
    username: /^[a-z0-9_]{3,20}$/,
    url: /^https?:\/\/.+/,
  },
});
```

#### Custom Validators

Custom validators can return `true` for valid, `false` for invalid, or a string error message:

```typescript
const validator = validator<User>({
  custom: {
    // Return true for valid
    age: (value) => value >= 0,

    // Return false for invalid (generic message)
    email: (value) => value.includes('@'),

    // Return string for custom error message
    password: (value) => {
      if (value.length < 8) {
        return 'Password must be at least 8 characters';
      }
      if (!/[A-Z]/.test(value)) {
        return 'Password must contain an uppercase letter';
      }
      if (!/[0-9]/.test(value)) {
        return 'Password must contain a number';
      }
      return true;
    },

    // Complex validation
    confirmPassword: (value, data) => {
      if (value !== data.password) {
        return 'Passwords do not match';
      }
      return true;
    },
  },
});
```

## Type Guards

### is() Function

Type guard that checks if a value matches the schema:

```typescript
import { is } from '@philjs/db';

function processUser(data: unknown) {
  if (is(data, userValidator)) {
    // data is typed as User
    console.log(data.name);   // OK
    console.log(data.email);  // OK
  } else {
    console.log('Invalid user data');
  }
}
```

### assert() Function

Throws an error if validation fails:

```typescript
import { assert } from '@philjs/db';

function createUser(data: unknown): User {
  // Throws if invalid
  assert(data, userValidator, 'Invalid user data');

  // data is typed as User after assertion
  return data;
}

// Usage
try {
  const user = createUser({ name: 'John' });
} catch (error) {
  console.error(error.message);
  // "Validation failed: email is required"
}
```

## Type Inference

### InferModel

Infer types from schema definitions:

```typescript
import type { InferModel } from '@philjs/db';

const userSchema = {
  id: { type: 'string', primaryKey: true },
  name: { type: 'string', notNull: true },
  email: { type: 'string', notNull: true, unique: true },
  age: { type: 'number' },
  createdAt: { type: 'date', defaultNow: true },
};

type User = InferModel<typeof userSchema>;
// {
//   id: string;
//   name: string;
//   email: string;
//   age: number | null;
//   createdAt: Date;
// }
```

### InferSelect

Infer the type returned from SELECT queries:

```typescript
import type { InferSelect } from '@philjs/db';

type UserSelect = InferSelect<typeof userSchema>;
// Handles nullability correctly based on notNull flags
```

### InferInsert

Infer the type for INSERT operations (excludes auto-generated fields):

```typescript
import type { InferInsert } from '@philjs/db';

type UserInsert = InferInsert<typeof userSchema>;
// Excludes fields with default values (id, createdAt)
// {
//   name: string;
//   email: string;
//   age?: number | null;
// }
```

### InferUpdate

Infer the type for UPDATE operations (all fields optional):

```typescript
import type { InferUpdate } from '@philjs/db';

type UserUpdate = InferUpdate<typeof userSchema>;
// Partial<UserInsert>
// {
//   name?: string;
//   email?: string;
//   age?: number | null;
// }
```

## Utility Types

### DeepPartial

Make all properties (including nested) optional:

```typescript
import type { DeepPartial } from '@philjs/db';

interface Settings {
  theme: {
    primary: string;
    secondary: string;
    fonts: {
      heading: string;
      body: string;
    };
  };
  notifications: {
    email: boolean;
    push: boolean;
  };
}

type PartialSettings = DeepPartial<Settings>;
// All nested properties are now optional
// {
//   theme?: {
//     primary?: string;
//     secondary?: string;
//     fonts?: {
//       heading?: string;
//       body?: string;
//     };
//   };
//   notifications?: {
//     email?: boolean;
//     push?: boolean;
//   };
// }
```

### DeepRequired

Make all properties (including nested) required:

```typescript
import type { DeepRequired } from '@philjs/db';

type RequiredSettings = DeepRequired<Partial<Settings>>;
// All properties are now required
```

### Exact

Ensure no extra properties are present:

```typescript
import type { Exact } from '@philjs/db';

interface CreateUser {
  name: string;
  email: string;
}

function createUser<T extends Exact<T, CreateUser>>(data: T): User {
  // TypeScript error if extra properties are passed
  return save(data);
}

// OK
createUser({ name: 'John', email: 'john@example.com' });

// Error: Object literal may only specify known properties
createUser({ name: 'John', email: 'john@example.com', extra: 'value' });
```

## Object Utilities

### pick()

Create a new object with only specified keys:

```typescript
import { pick } from '@philjs/db';

const user = {
  id: '123',
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
  createdAt: new Date(),
};

const publicUser = pick(user, 'id', 'name', 'email');
// { id: '123', name: 'John', email: 'john@example.com' }
// Type: Pick<User, 'id' | 'name' | 'email'>
```

### omit()

Create a new object without specified keys:

```typescript
import { omit } from '@philjs/db';

const safeUser = omit(user, 'password');
// { id: '123', name: 'John', email: 'john@example.com', createdAt: Date }
// Type: Omit<User, 'password'>

const publicData = omit(user, 'password', 'email');
// { id: '123', name: 'John', createdAt: Date }
```

## Relationship Builder

Define type-safe relationships between models:

### One-to-Many

```typescript
import { relationship } from '@philjs/db';

interface User {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  authorId: string;
}

const userPosts = relationship<User, Post>()
  .oneToMany()
  .foreignKey('authorId')    // FK column on Post
  .references('id')          // PK column on User
  .build();

// userPosts.type === 'one-to-many'
// userPosts.foreignKey === 'authorId'
// userPosts.references === 'id'
```

### One-to-One

```typescript
interface Profile {
  id: string;
  userId: string;
  bio: string;
}

const userProfile = relationship<User, Profile>()
  .oneToOne()
  .foreignKey('userId')
  .references('id')
  .build();
```

### Many-to-Many

```typescript
interface Role {
  id: string;
  name: string;
}

interface UserRole {
  userId: string;
  roleId: string;
}

const userRoles = relationship<User, Role>()
  .manyToMany(UserRole)  // Junction table
  .build();

// userRoles.type === 'many-to-many'
// userRoles.through === UserRole
```

### Using Relationships

```typescript
// Define all relationships for a model
const userRelationships = {
  posts: relationship<User, Post>()
    .oneToMany()
    .foreignKey('authorId')
    .references('id')
    .build(),

  profile: relationship<User, Profile>()
    .oneToOne()
    .foreignKey('userId')
    .references('id')
    .build(),

  roles: relationship<User, Role>()
    .manyToMany(UserRole)
    .build(),
};
```

## Migration Builder

Programmatically build migration operations:

### Creating Tables

```typescript
import { migration, MigrationBuilder } from '@philjs/db';

const operations = migration()
  .createTable('users', [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
    },
    {
      name: 'email',
      type: 'string',
      unique: true,
      nullable: false,
    },
    {
      name: 'name',
      type: 'string',
      nullable: false,
    },
    {
      name: 'age',
      type: 'number',
      nullable: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      default: 'NOW()',
    },
  ])
  .build();
```

### Adding Columns

```typescript
const operations = migration()
  .addColumn('users', {
    name: 'phone',
    type: 'string',
    nullable: true,
  })
  .addColumn('users', {
    name: 'status',
    type: 'string',
    default: 'active',
    nullable: false,
  })
  .build();
```

### Creating Indexes

```typescript
const operations = migration()
  .createIndex('users', ['email'], true)      // Unique index
  .createIndex('users', ['status', 'createdAt'])  // Composite index
  .build();
```

### Dropping and Altering

```typescript
const operations = migration()
  .dropTable('old_table')
  .dropColumn('users', 'deprecated_field')
  .alterColumn('users', 'age', { nullable: true })
  .build();
```

### Full Migration Example

```typescript
const createUsersMigration = migration()
  .createTable('users', [
    { name: 'id', type: 'string', primaryKey: true },
    { name: 'email', type: 'string', unique: true, nullable: false },
    { name: 'name', type: 'string', nullable: false },
    { name: 'passwordHash', type: 'string', nullable: false },
    { name: 'createdAt', type: 'date', default: 'NOW()' },
    { name: 'updatedAt', type: 'date', default: 'NOW()' },
  ])
  .createIndex('users', ['email'], true)
  .createIndex('users', ['createdAt'])
  .createTable('profiles', [
    { name: 'id', type: 'string', primaryKey: true },
    { name: 'userId', type: 'string', nullable: false, references: { table: 'users', column: 'id' } },
    { name: 'bio', type: 'string', nullable: true },
    { name: 'avatar', type: 'string', nullable: true },
  ])
  .build();

console.log('Migration operations:', createUsersMigration);
```

## Column Definitions

Column definition interface:

```typescript
interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  nullable?: boolean;      // Default: true
  default?: any;           // Default value
  unique?: boolean;        // Unique constraint
  primaryKey?: boolean;    // Primary key
  references?: {           // Foreign key
    table: string;
    column: string;
  };
}
```

## Migration Operations

Operation types generated by MigrationBuilder:

```typescript
type MigrationOperation =
  | CreateTableOperation
  | DropTableOperation
  | AddColumnOperation
  | DropColumnOperation
  | AlterColumnOperation
  | CreateIndexOperation
  | DropIndexOperation;

interface CreateTableOperation {
  type: 'createTable';
  table: string;
  columns: ColumnDefinition[];
}

interface DropTableOperation {
  type: 'dropTable';
  table: string;
}

interface AddColumnOperation {
  type: 'addColumn';
  table: string;
  column: ColumnDefinition;
}

interface DropColumnOperation {
  type: 'dropColumn';
  table: string;
  column: string;
}

interface AlterColumnOperation {
  type: 'alterColumn';
  table: string;
  column: string;
  changes: Partial<ColumnDefinition>;
}

interface CreateIndexOperation {
  type: 'createIndex';
  table: string;
  columns: string[];
  unique?: boolean;
}

interface DropIndexOperation {
  type: 'dropIndex';
  table: string;
  name: string;
}
```

## Best Practices

### 1. Validate at Boundaries

Validate data when it enters your system:

```typescript
// API endpoint
async function handleCreateUser(req, res) {
  const result = userValidator.validate(req.body);

  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  const user = await createUser(req.body);
  return res.json(user);
}
```

### 2. Use Type Guards for Safety

```typescript
function processUnknownData(data: unknown) {
  if (is(data, userValidator)) {
    // TypeScript knows data is User
    await userRepository.save(data);
  } else {
    throw new Error('Invalid data format');
  }
}
```

### 3. Compose Validators

```typescript
const baseUserValidator = validator<Partial<User>>({
  required: ['name', 'email'],
  pattern: { email: emailRegex },
});

const createUserValidator = validator<User>({
  ...baseUserValidator.constraints,
  required: [...baseUserValidator.constraints.required, 'password'],
  min: { password: 8 },
});

const updateUserValidator = validator<Partial<User>>({
  // No required fields for updates
  min: baseUserValidator.constraints.min,
  max: baseUserValidator.constraints.max,
});
```

### 4. Define Relationships Explicitly

```typescript
// relationships.ts
export const relationships = {
  user: {
    posts: relationship<User, Post>().oneToMany().foreignKey('authorId').build(),
    profile: relationship<User, Profile>().oneToOne().foreignKey('userId').build(),
    roles: relationship<User, Role>().manyToMany(UserRole).build(),
  },
  post: {
    author: relationship<Post, User>().oneToOne().foreignKey('authorId').build(),
    comments: relationship<Post, Comment>().oneToMany().foreignKey('postId').build(),
  },
};
```

## Next Steps

- [Queries](./queries.md) - Database query guide
- [Migrations](./migrations.md) - Migration system
- [Supabase](./supabase.md) - Supabase integration
