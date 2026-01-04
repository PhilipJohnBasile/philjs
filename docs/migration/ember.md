# Migrating from Ember to PhilJS

## Conceptual Mapping

| Ember | PhilJS |
|:---|:---|
| Ember Data | `@philjs/query` or `@philjs/store` |
| Handlebars | JSX |
| Controllers | Signals/Hooks |
| Routes | File-system routing |

## Strategy

1. **Routes**: Map your `router.js` to the `src/routes` directory.
2. **Components**: Convert Glimmer components to PhilJS functional components.
3. **Data**: Move away from Ember Data's active record pattern towards simpler fetch + signals.
