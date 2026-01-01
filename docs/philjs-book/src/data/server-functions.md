# Server Functions

Build type-safe server functions that can be called directly from client components.

## What You'll Learn

- Creating server functions
- Type safety across client/server
- Authentication and authorization
- Error handling
- Validation
- Best practices

## What are Server Functions?

Server functions are functions that run on the server but can be called from the client as if they were local functions.

**Benefits:**
- Type-safe (full TypeScript inference)
- No API routes needed
- Automatic serialization
- Simple error handling
- Direct database access

## Basic Server Functions

### Creating a Server Function

```typescript
// src/server/users.ts
'use server';

import { db } from '@/lib/db';

export async function getUser(id: string) {
  const user = await db.users.findById(id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
```

### Calling from Client

```typescript
// src/pages/profile.tsx
import { getUser } from '@/server/users';
import { signal, effect } from '@philjs/core';

export default function Profile({ userId }: { userId: string }) {
  const user = signal(null);
  const loading = signal(true);

  effect(async () => {
    loading.set(true);
    try {
      const data = await getUser(userId);
      user.set(data);
    } catch (error) {
      console.error(error);
    } finally {
      loading.set(false);
    }
  });

  if (loading()) return <Spinner />;

  return (
    <div>
      <h1>{user()!.name}</h1>
      <p>{user()!.email}</p>
    </div>
  );
}
```

## Type Safety

### Full Type Inference

```typescript
// src/server/posts.ts
'use server';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

export async function getPost(id: string): Promise<Post> {
  const post = await db.posts.findById(id);
  return post;
}

export async function getPosts(limit = 10): Promise<Post[]> {
  const posts = await db.posts.findMany({ limit });
  return posts;
}
```

```typescript
// Client - Full TypeScript autocomplete and type checking
import { getPost, getPosts } from '@/server/posts';

const post = await getPost('123'); // post is typed as Post
const posts = await getPosts(20);  // posts is typed as Post[]
```

### Complex Return Types

```typescript
'use server';

interface UserWithPosts {
  id: string;
  name: string;
  email: string;
  posts: {
    id: string;
    title: string;
  }[];
}

export async function getUserWithPosts(userId: string): Promise<UserWithPosts> {
  const user = await db.users.findById(userId);
  const posts = await db.posts.findMany({ authorId: userId });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    posts: posts.map(p => ({ id: p.id, title: p.title }))
  };
}
```

## CRUD Operations

### Create

```typescript
'use server';

import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  authorId: z.string()
});

export async function createPost(data: z.infer<typeof CreatePostSchema>) {
  // Validate
  const validated = CreatePostSchema.parse(data);

  // Create
  const post = await db.posts.create({
    ...validated,
    createdAt: new Date()
  });

  return post;
}
```

### Read

```typescript
'use server';

export async function getPost(id: string) {
  const post = await db.posts.findById(id);

  if (!post) {
    throw new Error('Post not found');
  }

  return post;
}

export async function listPosts(options?: {
  limit?: number;
  offset?: number;
  authorId?: string;
}) {
  const posts = await db.posts.findMany({
    limit: options?.limit || 10,
    offset: options?.offset || 0,
    where: options?.authorId ? { authorId: options.authorId } : undefined
  });

  return posts;
}
```

### Update

```typescript
'use server';

export async function updatePost(
  id: string,
  data: Partial<{ title: string; content: string }>
) {
  const post = await db.posts.findById(id);

  if (!post) {
    throw new Error('Post not found');
  }

  const updated = await db.posts.update(id, {
    ...data,
    updatedAt: new Date()
  });

  return updated;
}
```

### Delete

```typescript
'use server';

export async function deletePost(id: string) {
  const post = await db.posts.findById(id);

  if (!post) {
    throw new Error('Post not found');
  }

  await db.posts.delete(id);

  return { success: true };
}
```

## Authentication

### Check Current User

```typescript
// src/server/auth.ts
'use server';

import { cookies } from '@philjs/core';
import { verifyToken } from '@/lib/jwt';

export async function getCurrentUser() {
  const token = cookies().get('auth_token');

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = await db.users.findById(payload.userId);
  return user;
}
```

### Protected Server Functions

```typescript
'use server';

import { getCurrentUser } from './auth';

export async function getMyPosts() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const posts = await db.posts.findMany({
    where: { authorId: user.id }
  });

  return posts;
}

export async function updateMyProfile(data: { name?: string; bio?: string }) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const updated = await db.users.update(user.id, data);
  return updated;
}
```

## Authorization

### Role-Based Access

```typescript
'use server';

import { getCurrentUser } from './auth';

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('Not authenticated');
  }

  if (currentUser.role !== 'admin') {
    throw new Error('Not authorized');
  }

  await db.users.delete(userId);

  return { success: true };
}
```

### Resource Ownership

```typescript
'use server';

import { getCurrentUser } from './auth';

export async function updatePost(postId: string, data: { title: string; content: string }) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const post = await db.posts.findById(postId);

  if (!post) {
    throw new Error('Post not found');
  }

  // Check ownership
  if (post.authorId !== user.id) {
    throw new Error('Not authorized to edit this post');
  }

  const updated = await db.posts.update(postId, data);
  return updated;
}
```

## Validation

### Zod Schemas

```typescript
'use server';

import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional()
});

export async function updateUser(
  userId: string,
  data: z.infer<typeof UpdateUserSchema>
) {
  // Validate input
  const validated = UpdateUserSchema.parse(data);

  // Update user
  const user = await db.users.update(userId, validated);

  return user;
}
```

### Custom Validation

```typescript
'use server';

export async function createPost(data: {
  title: string;
  content: string;
  tags: string[];
}) {
  // Validate
  if (!data.title || data.title.length > 200) {
    throw new Error('Invalid title');
  }

  if (!data.content || data.content.length < 10) {
    throw new Error('Content too short');
  }

  if (data.tags.length > 10) {
    throw new Error('Too many tags');
  }

  // Check for profanity
  if (containsProfanity(data.content)) {
    throw new Error('Content contains inappropriate language');
  }

  const post = await db.posts.create(data);
  return post;
}
```

## Error Handling

### Custom Error Types

```typescript
// src/lib/errors.ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

```typescript
'use server';

import { NotFoundError, UnauthorizedError } from '@/lib/errors';

export async function getPost(id: string) {
  const post = await db.posts.findById(id);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  return post;
}

export async function deletePost(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError('Not authenticated');
  }

  const post = await db.posts.findById(id);

  if (post.authorId !== user.id) {
    throw new UnauthorizedError('Not authorized');
  }

  await db.posts.delete(id);
}
```

### Client-Side Error Handling

```typescript
import { deletePost } from '@/server/posts';

async function handleDelete(postId: string) {
  try {
    await deletePost(postId);
    alert('Post deleted');
  } catch (error) {
    if (error.name === 'UnauthorizedError') {
      alert('You do not have permission to delete this post');
    } else if (error.name === 'NotFoundError') {
      alert('Post not found');
    } else {
      alert('Failed to delete post');
    }
  }
}
```

## Complex Operations

### Transactions

```typescript
'use server';

export async function transferFunds(
  fromUserId: string,
  toUserId: string,
  amount: number
) {
  const user = await getCurrentUser();

  if (!user || user.id !== fromUserId) {
    throw new Error('Not authorized');
  }

  // Use database transaction
  await db.transaction(async (tx) => {
    // Deduct from sender
    await tx.users.update(fromUserId, {
      balance: { decrement: amount }
    });

    // Add to recipient
    await tx.users.update(toUserId, {
      balance: { increment: amount }
    });

    // Create transaction record
    await tx.transactions.create({
      fromUserId,
      toUserId,
      amount,
      createdAt: new Date()
    });
  });

  return { success: true };
}
```

### Batch Operations

```typescript
'use server';

export async function bulkUpdatePosts(
  updates: Array<{ id: string; published: boolean }>
) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    throw new Error('Not authorized');
  }

  const results = await Promise.all(
    updates.map(({ id, published }) =>
      db.posts.update(id, { published })
    )
  );

  return results;
}
```

## File Operations

### File Upload

```typescript
'use server';

export async function uploadAvatar(file: File) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large (max 5MB)');
  }

  // Upload to storage
  const buffer = await file.arrayBuffer();
  const filename = `avatars/${user.id}-${Date.now()}.jpg`;

  await storage.upload(filename, buffer);

  // Update user
  const updated = await db.users.update(user.id, {
    avatarUrl: `/uploads/${filename}`
  });

  return updated;
}
```

## Caching

### Response Caching

```typescript
'use server';

import { cache } from '@philjs/core';

export const getPublicPosts = cache(
  async () => {
    const posts = await db.posts.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      limit: 10
    });

    return posts;
  },
  ['public-posts'],
  { revalidate: 60 } // Cache for 60 seconds
);
```

### Conditional Caching

```typescript
'use server';

export async function getPosts(userId?: string) {
  if (!userId) {
    // Public posts - cacheable
    return getPublicPosts();
  }

  // User-specific posts - don't cache
  const posts = await db.posts.findMany({
    where: { authorId: userId }
  });

  return posts;
}
```

## Background Jobs

### Queue Tasks

```typescript
'use server';

import { queue } from '@/lib/queue';

export async function sendWelcomeEmail(userId: string) {
  const user = await db.users.findById(userId);

  // Queue email sending
  await queue.add('send-email', {
    to: user.email,
    template: 'welcome',
    data: { name: user.name }
  });

  return { queued: true };
}
```

## Best Practices

### Keep Functions Small

```typescript
// ✅ Good - single responsibility
'use server';

export async function getUser(id: string) {
  return await db.users.findById(id);
}

export async function updateUser(id: string, data: any) {
  return await db.users.update(id, data);
}

// ❌ Bad - does too much
export async function handleUser(action: string, id: string, data?: any) {
  if (action === 'get') return await db.users.findById(id);
  if (action === 'update') return await db.users.update(id, data);
  if (action === 'delete') return await db.users.delete(id);
}
```

### Validate All Input

```typescript
// ✅ Always validate
'use server';

export async function createPost(data: unknown) {
  const validated = CreatePostSchema.parse(data);
  return await db.posts.create(validated);
}

// ❌ Trust client input
export async function createPost(data: any) {
  return await db.posts.create(data);
}
```

### Always Authenticate

```typescript
// ✅ Check auth for sensitive operations
'use server';

export async function deleteAccount() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  await db.users.delete(user.id);
}

// ❌ No auth check
export async function deleteAccount(userId: string) {
  await db.users.delete(userId);
}
```

### Use Descriptive Names

```typescript
// ✅ Clear intent
export async function getUserPosts(userId: string) { }
export async function createBlogPost(data: CreatePostData) { }
export async function publishPost(postId: string) { }

// ❌ Vague names
export async function get(id: string) { }
export async function doThing(data: any) { }
```

## Summary

You've learned:

✅ Creating server functions with 'use server'
✅ Full type safety across client/server
✅ CRUD operations
✅ Authentication and authorization
✅ Input validation with Zod
✅ Error handling
✅ Complex operations and transactions
✅ File uploads
✅ Caching strategies
✅ Best practices

Server functions provide type-safe backend without API routes!

---

**Next:** [Queries →](./queries.md) Declarative data fetching with automatic caching


