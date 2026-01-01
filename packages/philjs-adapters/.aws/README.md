# philjs-lambda (AWS adapter template)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![PhilJS Version](https://img.shields.io/badge/philjs-0.1.0-ff69b4)](https://github.com/yourusername/philjs)

Minimal AWS Lambda/SAM helper used by `philjs-adapters` to deploy PhilJS SSR handlers to API Gateway, Lambda@Edge, or ALB.

## What’s inside

- `template.yaml` – starter SAM template wired for PhilJS SSR output
- `index.mjs` – tiny Lambda bridge that imports `@philjs/core` + `@philjs/ssr`
- `package.json` – Node 24, ESM-only, PhilJS 0.1.0 dependencies

## Usage

1) Build your PhilJS app with SSR output (`dist/server/index.js`).
2) Copy this folder into your deployment workspace (or reference it with `sam build`).
3) Update `template.yaml` with your bucket/function names.
4) Deploy with SAM:

```bash
sam build
sam deploy --guided
```

## Requirements

- Node.js 24+
- TypeScript 6 for any custom TypeScript you add
- PhilJS 0.1.0 compatible server bundle

## Notes

- Keep the handler ESM (`type: "module"`).
- Adjust memory/timeout in `template.yaml` for heavy renders.
- If you need CloudFront, add a Lambda@Edge association in the template.
