# Routing Basics

PhilJS routes are defined with `createAppRouter`. Routes can include loaders and actions.

```tsx
import { createAppRouter, Link } from "@philjs/router";

export function HomeRoute() {
  return (
    <main>
      <h1>Home</h1>
      <Link to="/about">About</Link>
    </main>
  );
}

export function AboutRoute() {
  return <main>About PhilJS</main>;
}

createAppRouter({
  target: "#app",
  routes: [
    { path: "/", component: HomeRoute },
    { path: "/about", component: AboutRoute },
  ],
});
```

## Navigation in code

```tsx
import { useRouter } from "@philjs/router";

export function SaveButton() {
  const { navigate } = useRouter();
  return <button onClick={() => navigate("/dashboard")}>Go</button>;
}
```
