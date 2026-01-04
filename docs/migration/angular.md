# Migrating from Angular to PhilJS

## Conceptual Mapping

| Angular | PhilJS |
|:---|:---|
| `*ngIf` | `{condition && <Component />}` |
| `*ngFor` | `{list.map(item => ...)}` |
| Services | Classes with `@Injectable()` from `@philjs/di` |
| Pipes | Helper functions |
| Modules | ES Modules (no NgModule needed) |

## Strategy

1. Use `@philjs/di` to port your services 1:1.
2. Converting templates to JSX is the biggest task.
3. Use Signals instead of RxJS for local component state (though RxJS is supported via `@philjs/rxjs`).
