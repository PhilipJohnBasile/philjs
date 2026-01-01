# Optimistic Updates

Update the UI instantly before the server responds for a snappy user experience.

## What You'll Learn

- What are optimistic updates
- Basic optimistic patterns
- Rollback on error
- Complex optimistic updates
- Race conditions
- Best practices

## What are Optimistic Updates?

Optimistic updates immediately update the UI assuming the server request will succeed:

**Flow:**
1. User action (e.g., click "Like")
2. **Immediately** update UI (show liked state)
3. Send request to server
4. On success: keep UI as-is
5. On error: rollback UI

**Benefits:**
- Instant feedback
- Feels responsive
- Better UX on slow connections

## Basic Pattern

### Simple Optimistic Update

```typescript
import { signal } from '@philjs/core';

function LikeButton({ postId, initialLikes, initialIsLiked }: {
  postId: string;
  initialLikes: number;
  initialIsLiked: boolean;
}) {
  const likes = signal(initialLikes);
  const isLiked = signal(initialIsLiked);

  const toggleLike = async () => {
    // Save current state for rollback
    const previousLikes = likes();
    const previousIsLiked = isLiked();

    // Optimistically update UI
    isLiked.set(!previousIsLiked);
    likes.set(previousIsLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      // Send to server
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ liked: !previousIsLiked })
      });
    } catch (error) {
      // Rollback on error
      isLiked.set(previousIsLiked);
      likes.set(previousLikes);
      alert('Failed to update like');
    }
  };

  return (
    <button onClick={toggleLike} className={isLiked() ? 'liked' : ''}>
      ❤️ {likes()}
    </button>
  );
}
```

## With Mutations

### Mutation with Optimistic Update

```typescript
import { createMutation, setQueryData, getQueryData } from '@philjs/core';

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

    // Return context with snapshot
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

// Usage
function Post({ post }: { post: Post }) {
  const { mutate } = likePostMutation;

  return (
    <div>
      <h2>{post.title}</h2>
      <button onClick={() => mutate(post.id)}>
        ❤️ {post.likes}
      </button>
    </div>
  );
}
```

## List Updates

### Add Item to List

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

    // Create optimistic todo
    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      text,
      completed: false,
      createdAt: Date.now()
    };

    // Add to list
    setQueryData(['todos'], (old: Todo[]) => [optimisticTodo, ...old]);

    return { previousTodos };
  },
  onError: (err, text, context) => {
    // Rollback
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  },
  onSuccess: (newTodo) => {
    // Replace temporary todo with real one
    setQueryData(['todos'], (old: Todo[]) =>
      old.map(todo =>
        todo.id.startsWith('temp-') ? newTodo : todo
      )
    );
  }
});
```

### Update Item in List

```typescript
const updateTodoMutation = createMutation({
  mutationFn: async ({ id, text }: { id: string; text: string }) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  onMutate: async ({ id, text }) => {
    await cancelQueries(['todos']);

    const previousTodos = getQueryData(['todos']);

    // Optimistically update
    setQueryData(['todos'], (old: Todo[]) =>
      old.map(todo =>
        todo.id === id ? { ...todo, text } : todo
      )
    );

    return { previousTodos };
  },
  onError: (err, variables, context) => {
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  }
});
```

### Remove Item from List

```typescript
const deleteTodoMutation = createMutation({
  mutationFn: async (id: string) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  },
  onMutate: async (id) => {
    await cancelQueries(['todos']);

    const previousTodos = getQueryData(['todos']);

    // Optimistically remove
    setQueryData(['todos'], (old: Todo[]) =>
      old.filter(todo => todo.id !== id)
    );

    return { previousTodos };
  },
  onError: (err, id, context) => {
    // Restore on error
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  }
});
```

## Complex Updates

### Multi-Query Updates

```typescript
const followUserMutation = createMutation({
  mutationFn: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}/follow`, {
      method: 'POST'
    });
    return res.json();
  },
  onMutate: async (userId) => {
    // Update multiple related queries
    await cancelQueries(['user', userId]);
    await cancelQueries(['following']);

    const previousUser = getQueryData(['user', userId]);
    const previousFollowing = getQueryData(['following']);

    // Update user
    setQueryData(['user', userId], (old: User) => ({
      ...old,
      isFollowing: true,
      followers: old.followers + 1
    }));

    // Update following list
    setQueryData(['following'], (old: User[]) => [
      ...old,
      { id: userId, /* ... */ }
    ]);

    return { previousUser, previousFollowing };
  },
  onError: (err, userId, context) => {
    // Rollback all updates
    if (context?.previousUser) {
      setQueryData(['user', userId], context.previousUser);
    }
    if (context?.previousFollowing) {
      setQueryData(['following'], context.previousFollowing);
    }
  }
});
```

### Nested Data Updates

```typescript
const updateCommentMutation = createMutation({
  mutationFn: async ({ postId, commentId, text }: {
    postId: string;
    commentId: string;
    text: string;
  }) => {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  onMutate: async ({ postId, commentId, text }) => {
    await cancelQueries(['post', postId]);

    const previousPost = getQueryData(['post', postId]);

    // Update nested comment
    setQueryData(['post', postId], (old: Post) => ({
      ...old,
      comments: old.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, text, edited: true }
          : comment
      )
    }));

    return { previousPost };
  },
  onError: (err, variables, context) => {
    if (context?.previousPost) {
      setQueryData(['post', variables.postId], context.previousPost);
    }
  }
});
```

## Batch Operations

### Multiple Optimistic Updates

```typescript
const bulkUpdateTodosMutation = createMutation({
  mutationFn: async (updates: Array<{ id: string; completed: boolean }>) => {
    const res = await fetch('/api/todos/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ updates })
    });
    return res.json();
  },
  onMutate: async (updates) => {
    await cancelQueries(['todos']);

    const previousTodos = getQueryData(['todos']);

    // Apply all updates optimistically
    setQueryData(['todos'], (old: Todo[]) =>
      old.map(todo => {
        const update = updates.find(u => u.id === todo.id);
        return update ? { ...todo, completed: update.completed } : todo;
      })
    );

    return { previousTodos };
  },
  onError: (err, updates, context) => {
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  }
});
```

## Race Conditions

### Handle Concurrent Updates

```typescript
const updateProfileMutation = createMutation({
  mutationFn: async (data: Partial<User>) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },
  onMutate: async (data) => {
    // Cancel ALL ongoing profile updates
    await cancelQueries(['profile']);

    const previousProfile = getQueryData(['profile']);

    // Track this update
    const updateId = Date.now();

    setQueryData(['profile'], (old: User) => ({
      ...old,
      ...data,
      _updateId: updateId
    }));

    return { previousProfile, updateId };
  },
  onSuccess: (serverData, variables, context) => {
    // Only apply if this is still the latest update
    setQueryData(['profile'], (old: User) => {
      if (old._updateId === context.updateId) {
        return serverData;
      }
      return old; // Newer update exists, don't overwrite
    });
  },
  onError: (err, variables, context) => {
    if (context?.previousProfile) {
      setQueryData(['profile'], context.previousProfile);
    }
  }
});
```

## Partial Success

### Some Operations Succeed, Some Fail

```typescript
const bulkDeleteMutation = createMutation({
  mutationFn: async (ids: string[]) => {
    const results = await Promise.allSettled(
      ids.map(id => fetch(`/api/todos/${id}`, { method: 'DELETE' }))
    );

    const succeeded = ids.filter((_, i) => results[i].status === 'fulfilled');
    const failed = ids.filter((_, i) => results[i].status === 'rejected');

    return { succeeded, failed };
  },
  onMutate: async (ids) => {
    await cancelQueries(['todos']);

    const previousTodos = getQueryData(['todos']);

    // Optimistically remove all
    setQueryData(['todos'], (old: Todo[]) =>
      old.filter(todo => !ids.includes(todo.id))
    );

    return { previousTodos };
  },
  onSuccess: (result, ids, context) => {
    // Restore failed deletions
    if (result.failed.length > 0 && context?.previousTodos) {
      setQueryData(['todos'], (old: Todo[]) => {
        const failedTodos = context.previousTodos.filter(
          todo => result.failed.includes(todo.id)
        );
        return [...old, ...failedTodos];
      });
    }
  },
  onError: (err, ids, context) => {
    // Complete failure - restore all
    if (context?.previousTodos) {
      setQueryData(['todos'], context.previousTodos);
    }
  }
});
```

## Visual Feedback

### Show Optimistic State

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  _optimistic?: boolean; // Flag for optimistic state
}

const createTodoMutation = createMutation({
  mutationFn: createTodo,
  onMutate: async (text) => {
    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      text,
      completed: false,
      _optimistic: true // Mark as optimistic
    };

    setQueryData(['todos'], (old: Todo[]) => [optimisticTodo, ...old]);
  },
  onSuccess: (newTodo) => {
    // Remove optimistic flag
    setQueryData(['todos'], (old: Todo[]) =>
      old.map(todo =>
        todo.id.startsWith('temp-') ? { ...newTodo, _optimistic: false } : todo
      )
    );
  }
});

// Render with visual indicator
function TodoItem({ todo }: { todo: Todo }) {
  return (
    <div className={todo._optimistic ? 'optimistic' : ''}>
      {todo.text}
      {todo._optimistic && <span className="saving">Saving...</span>}
    </div>
  );
}
```

```css
.optimistic {
  opacity: 0.6;
}

.saving {
  font-size: 12px;
  color: #888;
  margin-left: 8px;
}
```

## Error Handling

### User-Friendly Rollback

```typescript
const deleteMutation = createMutation({
  mutationFn: deleteItem,
  onMutate: async (id) => {
    const previous = getQueryData(['items']);

    setQueryData(['items'], (old: Item[]) =>
      old.filter(item => item.id !== id)
    );

    return { previous };
  },
  onError: (err, id, context) => {
    // Rollback
    if (context?.previous) {
      setQueryData(['items'], context.previous);
    }

    // Show user-friendly message
    toast.error('Failed to delete item. Please try again.');
  }
});
```

## Best Practices

### Use for Simple Operations

```typescript
// ✅ Good - simple, predictable
const likeMutation = createMutation({
  onMutate: () => incrementLikes()
});

// ❌ Bad - complex, error-prone
const checkoutMutation = createMutation({
  onMutate: () => processComplexCheckout()
});
```

### Always Save Previous State

```typescript
// ✅ Always snapshot for rollback
onMutate: async (id) => {
  const previous = getQueryData(['item', id]);
  // ... optimistic update
  return { previous };
}

// ❌ No way to rollback
onMutate: async (id) => {
  // ... optimistic update
  // No snapshot!
}
```

### Provide Visual Feedback

```typescript
// ✅ Show optimistic state
<div className={item._optimistic ? 'pending' : ''}>
  {item.text}
</div>

// ❌ No indication
<div>{item.text}</div>
```

### Cancel Ongoing Requests

```typescript
// ✅ Cancel to avoid race conditions
onMutate: async (id) => {
  await cancelQueries(['item', id]);
  // ... update
}

// ❌ Race condition possible
onMutate: async (id) => {
  // ... update
}
```

### Sync with Server

```typescript
// ✅ Refetch to ensure sync
onSettled: (data, error, id) => {
  invalidateQueries(['item', id]);
}

// ❌ UI may diverge from server
```

## Summary

You've learned:

✅ Basic optimistic update patterns
✅ Rollback on error
✅ List updates (add, update, remove)
✅ Complex multi-query updates
✅ Handling race conditions
✅ Partial success scenarios
✅ Visual feedback for optimistic state
✅ Error handling
✅ Best practices

Optimistic updates make apps feel instant and responsive!

---

**Next:** [Pagination →](./pagination.md) Load large datasets efficiently


