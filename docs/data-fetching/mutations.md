# Mutations

Update server data with mutations, including optimistic updates and automatic cache invalidation.

## What You'll Learn

- Creating mutations
- Optimistic updates
- Cache invalidation
- Error handling
- Mutation state
- Best practices

## What are Mutations?

Mutations modify server data (create, update, delete):

**Benefits:**
- Automatic loading/error states
- Optimistic updates
- Cache invalidation
- Retry logic
- TypeScript safety

## Basic Mutations

### Creating a Mutation

```typescript
import { createMutation } from '@philjs/core';

interface UpdateUserData {
  id: string;
  name?: string;
  email?: string;
}

const updateUserMutation = createMutation({
  mutationFn: async ({ id, ...data }: UpdateUserData) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Failed to update user');

    return res.json();
  }
});
```

### Using a Mutation

```typescript
function EditProfile({ user }: { user: User }) {
  const name = signal(user.name);
  const { mutate, loading, error } = updateUserMutation;

  const handleSave = () => {
    mutate({ id: user.id, name: name() });
  };

  return (
    <div>
      <input
        value={name()}
        onInput={(e) => name.set(e.target.value)}
      />

      <button onClick={handleSave} disabled={loading()}>
        {loading() ? 'Saving...' : 'Save'}
      </button>

      {error() && <div className="error">{error()!.message}</div>}
    </div>
  );
}
```

## Mutation Callbacks

### onSuccess

```typescript
const createPostMutation = createMutation({
  mutationFn: async (data: CreatePostData) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  onSuccess: (newPost) => {
    console.log('Post created:', newPost);

    // Redirect to new post
    router.push(`/posts/${newPost.id}`);
  }
});
```

### onError

```typescript
const deletePostMutation = createMutation({
  mutationFn: async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete');
  },
  onError: (error) => {
    console.error('Delete failed:', error);
    alert('Failed to delete post. Please try again.');
  }
});
```

### onSettled

```typescript
const updatePostMutation = createMutation({
  mutationFn: updatePost,
  onSettled: (data, error) => {
    // Runs whether success or error
    console.log('Mutation completed');

    // Hide loading indicator
    setLoading(false);
  }
});
```

## Cache Invalidation

Automatically refresh queries after mutations:

```typescript
import { invalidateQueries } from '@philjs/core';

const createPostMutation = createMutation({
  mutationFn: async (data: CreatePostData) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  onSuccess: (newPost) => {
    // Invalidate and refetch posts list
    invalidateQueries(['posts']);

    // Invalidate user's posts
    invalidateQueries(['user', newPost.authorId, 'posts']);
  }
});
```

### Invalidate Multiple Queries

```typescript
const deleteUserMutation = createMutation({
  mutationFn: async (userId: string) => {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  },
  onSuccess: (_, userId) => {
    // Invalidate all related queries
    invalidateQueries(['user', userId]);
    invalidateQueries(['users']);
    invalidateQueries(['user', userId, 'posts']);
    invalidateQueries(['user', userId, 'comments']);
  }
});
```

## Optimistic Updates

Update UI immediately, before server responds:

```typescript
import { setQueryData, getQueryData, invalidateQueries } from '@philjs/core';

const likePostMutation = createMutation({
  mutationFn: async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST'
    });
    return res.json();
  },
  onMutate: async (postId) => {
    // Cancel outgoing refetches
    await cancelQueries(['post', postId]);

    // Snapshot current value
    const previousPost = getQueryData(['post', postId]);

    // Optimistically update
    setQueryData(['post', postId], (old: Post) => ({
      ...old,
      likes: old.likes + 1,
      isLiked: true
    }));

    // Return context for rollback
    return { previousPost };
  },
  onError: (err, postId, context) => {
    // Rollback on error
    if (context?.previousPost) {
      setQueryData(['post', postId], context.previousPost);
    }
  },
  onSettled: (data, error, postId) => {
    // Refetch to sync with server
    invalidateQueries(['post', postId]);
  }
});
```

### Optimistic List Update

```typescript
const createTodoMutation = createMutation({
  mutationFn: async (text: string) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  onMutate: async (text) => {
    // Cancel refetches
    await cancelQueries(['todos']);

    // Snapshot
    const previousTodos = getQueryData(['todos']);

    // Optimistically add new todo
    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      text,
      completed: false
    };

    setQueryData(['todos'], (old: Todo[]) => [...old, optimisticTodo]);

    return { previousTodos };
  },
  onError: (err, text, context) => {
    // Rollback
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  },
  onSuccess: (newTodo) => {
    // Replace temp todo with real one
    setQueryData(['todos'], (old: Todo[]) =>
      old.map(todo =>
        todo.id.startsWith('temp-') ? newTodo : todo
      )
    );
  }
});
```

## Mutation State

Track mutation progress:

```typescript
function CreatePostForm() {
  const {
    mutate,
    mutateAsync,
    loading,
    error,
    data,
    reset
  } = createPostMutation;

  const handleSubmit = async () => {
    try {
      const post = await mutateAsync({ title: 'New Post', content: '...' });
      console.log('Created:', post);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading()}>
        {loading() ? 'Creating...' : 'Create Post'}
      </button>

      {error() && (
        <div>
          Error: {error()!.message}
          <button onClick={reset}>Dismiss</button>
        </div>
      )}

      {data() && <div>Created post: {data()!.title}</div>}
    </div>
  );
}
```

## Sequential Mutations

Run mutations in sequence:

```typescript
async function createAndPublishPost(data: CreatePostData) {
  const { mutateAsync: create } = createPostMutation;
  const { mutateAsync: publish } = publishPostMutation;

  // Create post
  const post = await create(data);

  // Then publish it
  await publish(post.id);

  return post;
}
```

## Parallel Mutations

Run multiple mutations simultaneously:

```typescript
async function bulkDeletePosts(postIds: string[]) {
  const { mutateAsync: deletePost } = deletePostMutation;

  await Promise.all(
    postIds.map(id => deletePost(id))
  );

  // Invalidate after all complete
  invalidateQueries(['posts']);
}
```

## Form Mutations

Integrate with forms:

```typescript
function CreatePostForm() {
  const title = signal('');
  const content = signal('');

  const { mutate, loading, error, reset } = createPostMutation;

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    mutate(
      { title: title(), content: content() },
      {
        onSuccess: () => {
          // Clear form
          title.set('');
          content.set('');
          alert('Post created!');
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title()}
        onInput={(e) => title.set(e.target.value)}
        placeholder="Title"
        required
      />

      <textarea
        value={content()}
        onInput={(e) => content.set(e.target.value)}
        placeholder="Content"
        required
      />

      <button type="submit" disabled={loading()}>
        {loading() ? 'Creating...' : 'Create Post'}
      </button>

      {error() && (
        <div className="error">
          {error()!.message}
          <button onClick={reset}>×</button>
        </div>
      )}
    </form>
  );
}
```

## Retry Logic

Automatically retry failed mutations:

```typescript
const updatePostMutation = createMutation({
  mutationFn: updatePost,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
});
```

## Mutation Context

Pass additional data through mutation lifecycle:

```typescript
interface MutationContext {
  previousPosts?: Post[];
  timestamp: number;
}

const updatePostMutation = createMutation<
  Post,           // Return type
  UpdatePostData, // Variables type
  MutationContext // Context type
>({
  mutationFn: async (data) => {
    const res = await fetch(`/api/posts/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  onMutate: async (data) => {
    const previousPosts = getQueryData(['posts']);

    return {
      previousPosts,
      timestamp: Date.now()
    };
  },
  onError: (err, data, context) => {
    console.log('Mutation started at:', context?.timestamp);

    if (context?.previousPosts) {
      setQueryData(['posts'], context.previousPosts);
    }
  }
});
```

## Global Mutation Defaults

Set defaults for all mutations:

```typescript
import { setMutationDefaults } from '@philjs/core';

setMutationDefaults({
  retry: 1,
  onError: (error) => {
    console.error('Mutation error:', error);
    // Show global error toast
    showErrorToast(error.message);
  }
});
```

## Mutation Middleware

Wrap mutations with common logic:

```typescript
function withAuth<T, V>(
  mutation: Mutation<T, V>
): Mutation<T, V> {
  return createMutation({
    ...mutation,
    mutationFn: async (variables) => {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      return mutation.mutationFn(variables);
    }
  });
}

// Usage
const updateProfileMutation = withAuth(
  createMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return res.json();
    }
  })
);
```

## Complete Examples

### Todo App

```typescript
// Create todo
const createTodoMutation = createMutation({
  mutationFn: async (text: string) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  onSuccess: () => {
    invalidateQueries(['todos']);
  }
});

// Toggle todo
const toggleTodoMutation = createMutation({
  mutationFn: async (id: string) => {
    const res = await fetch(`/api/todos/${id}/toggle`, {
      method: 'PUT'
    });
    return res.json();
  },
  onMutate: async (id) => {
    const previousTodos = getQueryData(['todos']);

    setQueryData(['todos'], (old: Todo[]) =>
      old.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );

    return { previousTodos };
  },
  onError: (err, id, context) => {
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  }
});

// Delete todo
const deleteTodoMutation = createMutation({
  mutationFn: async (id: string) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  },
  onMutate: async (id) => {
    const previousTodos = getQueryData(['todos']);

    setQueryData(['todos'], (old: Todo[]) =>
      old.filter(todo => todo.id !== id)
    );

    return { previousTodos };
  },
  onError: (err, id, context) => {
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  }
});
```

### E-commerce Cart

```typescript
const addToCartMutation = createMutation({
  mutationFn: async ({ productId, quantity }: {
    productId: string;
    quantity: number;
  }) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
    return res.json();
  },
  onMutate: async ({ productId, quantity }) => {
    const previousCart = getQueryData(['cart']);

    // Optimistically update cart
    setQueryData(['cart'], (old: Cart) => ({
      ...old,
      items: [
        ...old.items,
        { productId, quantity, addedAt: Date.now() }
      ],
      total: old.total + (getProductPrice(productId) * quantity)
    }));

    return { previousCart };
  },
  onError: (err, variables, context) => {
    if (context?.previousCart) {
      setQueryData(['cart'], context.previousCart);
    }
    alert('Failed to add to cart');
  },
  onSuccess: () => {
    // Show success message
    showToast('Added to cart!');
  }
});
```

## Best Practices

### Always Invalidate Queries

```typescript
// ✅ Invalidate related queries
const createPostMutation = createMutation({
  mutationFn: createPost,
  onSuccess: (post) => {
    invalidateQueries(['posts']);
    invalidateQueries(['user', post.authorId, 'posts']);
  }
});

// ❌ Forget to invalidate
const createPostMutation = createMutation({
  mutationFn: createPost
});
```

### Use Optimistic Updates Wisely

```typescript
// ✅ Use for simple, predictable updates
const likeMutation = createMutation({
  mutationFn: likePost,
  onMutate: optimisticallyIncrementLikes
});

// ❌ Don't use for complex operations
const checkoutMutation = createMutation({
  mutationFn: checkout,
  // Don't optimistically update - too complex
});
```

### Handle Errors

```typescript
// ✅ Show user-friendly error messages
const { mutate, error } = updateMutation;

{error() && (
  <div className="error">
    {getUserFriendlyMessage(error()!)}
  </div>
)}

// ❌ Ignore errors
const { mutate } = updateMutation;
```

### Provide Loading States

```typescript
// ✅ Disable button while mutating
<button disabled={loading()}>
  {loading() ? 'Saving...' : 'Save'}
</button>

// ❌ No loading indicator
<button onClick={mutate}>Save</button>
```

## Summary

You've learned:

✅ Creating mutations with createMutation
✅ Mutation callbacks (onSuccess, onError, onSettled)
✅ Cache invalidation after mutations
✅ Optimistic updates for instant feedback
✅ Mutation state tracking
✅ Sequential and parallel mutations
✅ Form integration
✅ Retry logic
✅ Best practices

Mutations make data updates smooth and reliable!

---

**Next:** [Caching →](./caching.md) Advanced caching strategies and patterns
