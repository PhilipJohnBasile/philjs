# Loaders and Actions

Loaders fetch data before a route renders. Actions handle mutations and form submissions.

```tsx
import { createAppRouter, Form } from "@philjs/router";
import type { RouteComponentProps } from "@philjs/router";
import { Err, Ok } from "@philjs/core";

type Project = { id: string; name: string };

type ProjectsProps = RouteComponentProps & { data?: Project[] };

export function ProjectsRoute({ data = [] }: ProjectsProps) {
  return (
    <main>
      <h1>Projects</h1>
      <ul>
        {data.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
      <Form method="post">
        <input name="name" placeholder="New project" />
        <button type="submit">Create</button>
      </Form>
    </main>
  );
}

const routes = [
  {
    path: "/projects",
    loader: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return Err(new Error("Failed to load projects"));
      return Ok(await res.json());
    },
    action: async ({ formData }) => {
      const name = String(formData.get("name") ?? "");
      if (!name.trim()) return;
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    },
    component: ProjectsRoute,
  },
];

createAppRouter({ target: "#app", routes });
```

## Loader data access

Route components receive `data` as a prop. Use the `RouteComponentProps` type for strong typing and consistent signatures.
