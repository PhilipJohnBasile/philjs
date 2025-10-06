# Form Actions

Form actions in PhilJS allow you to handle form submissions declaratively, with automatic loading states and error handling.

## Basic Form Action

### Server Action

```tsx
import { serverFn } from 'philjs-ssr';

const createUser = serverFn(async (formData: FormData) => {
  const user = {
    name: formData.get('name') as string,
    email: formData.get('email') as string
  };

  const result = await db.users.create(user);
  return result;
});

export default function SignupForm() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### With State Management

```tsx
import { createMutation } from 'philjs-data';

export default function CommentForm({ postId }) {
  const addComment = createMutation(
    async (data: FormData) => {
      return await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: data
      });
    },
    {
      onSuccess: () => {
        showToast('Comment added!');
      }
    }
  );

  return (
    <form action={addComment}>
      <textarea name="content" required />
      <button type="submit" disabled={addComment.isLoading}>
        {addComment.isLoading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
```

## Progressive Enhancement

### Works Without JavaScript

```tsx
export default function NewsletterForm() {
  return (
    <form action="/api/newsletter" method="POST">
      <input name="email" type="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

## Next Steps

- [Validation](/docs/forms/validation.md) - Validate actions
- [Complex Forms](/docs/forms/complex-forms.md) - Advanced patterns
- [Server Functions](/docs/data-fetching/server-functions.md) - Server functions

---

💡 **Tip**: Form actions work without JavaScript for progressive enhancement.

⚠️ **Warning**: Always validate and sanitize form data on the server.

ℹ️ **Note**: PhilJS automatically handles FormData serialization and deserialization.
