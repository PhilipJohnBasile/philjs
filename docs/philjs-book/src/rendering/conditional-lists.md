# Conditional and Lists

## Conditional Rendering

```tsx
return (
  <div>
    {isLoggedIn() ? <Profile /> : <Login />}
  </div>
);
```

## Lists

```tsx
const items = signal(["docs", "examples", "book"]);

<ul>
  {items().map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>
```
