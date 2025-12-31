# Forms

Forms work with actions or custom handlers.

```tsx
export function NewPost() {
  return (
    <form method="post">
      <label>
        Title
        <input name="title" required />
      </label>
      <button type="submit">Create</button>
    </form>
  );
}
```

Use `defineAction` on the route to handle the POST request.
