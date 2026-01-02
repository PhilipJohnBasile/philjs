# Server-side rendering (SSR)

`@philjs/core` includes a lightweight SSR renderer plus hydration helpers.

## Render on the server

```ts
import { renderToString } from '@philjs/core/render-to-string';

const html = renderToString(<App />);
```

## Hydrate on the client

```ts
import { hydrate } from '@philjs/core/hydrate';

hydrate(<App />, document.getElementById('root')!);
```

## Client render (no SSR)

```ts
import { render } from '@philjs/core/hydrate';

render(<App />, document.getElementById('root')!);
```

## Notes

- Use `@philjs/ssr` for streaming and framework adapters.
- Keep server and client trees in sync to avoid hydration warnings.
