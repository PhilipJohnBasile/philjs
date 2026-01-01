# AI Integration

Integrate LLMs and ML services into PhilJS apps safely and predictably.

## Principles

- Typed prompts and outputs; validate responses before applying.
- Guardrails first: schema validation, safety filters, and policy checks.
- Cost-aware: track tokens and latency; cap spend per user/workflow.
- User trust: transparency and undo for AI actions.

## Calling models

- Use `@philjs/ai` (if available) or direct HTTP calls to your provider.
- Pass context (locale, role, feature flags) explicitly.
- Prefer JSON outputs with strict schemas to reduce hallucinations.

```typescript
import { callAI } from '@philjs/ai';
import { z } from 'zod';

const schema = z.object({ summary: z.string().max(500) });

export async function summarize(text: string) {
  const res = await callAI({ prompt: `Summarize: ${text}`, schema });
  return schema.parse(res);
}
```

## Guardrails

- Validate against schemas; reject/repair invalid outputs.
- Add safety filters for toxicity/PII.
- Enforce policies per intent (see Nexus chapter); never let the model bypass auth.

## Caching and idempotency

- Cache deterministic prompts by hash to reduce cost.
- Use request ids to prevent duplicate actions on retries.
- Log prompt/response metadata for audit (redact sensitive user data).

## UI patterns

- Show spinners with cancel buttons; allow users to abort.
- Provide “why” explanations and let users edit/undo AI-applied changes.
- For streaming responses, render partial output with fallbacks.

## Testing

- Mock AI calls with fixtures; test happy/error/invalid outputs.
- Fuzz-test schema validation against malformed responses.
- Add rate-limit tests to ensure UI handles “quota exceeded” gracefully.

## Observability

- Metrics: latency, token usage, success/failure, safety-blocked counts.
- Traces: intent → prompt → validation → state mutation.
- Alerts: spike in failures/latency/costs.

## Checklist

- [ ] Typed prompts and schemas.
- [ ] Safety filters and policy checks.
- [ ] Cost limits and caching for deterministic prompts.
- [ ] Undo and transparency in UI.
- [ ] Tests for invalid outputs and rate limits.
