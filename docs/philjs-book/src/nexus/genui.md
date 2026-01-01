# Nexus, GenUI, and AI-assisted Flows

Nexus is PhilJS’s opinionated architecture for local-first, AI-assisted applications. GenUI sits on top, composing intent capture, guarded AI actions, and collaborative state. Lean on this plus `docs/nexus` and `docs/ai` to keep safety and UX aligned.

## Principles

- **Local-first**: optimistic updates with CRDT-friendly data shapes; sync later.
- **Intent over clicks**: capture user intent explicitly, feed it to AI safely.
- **Guardrails**: validate AI outputs against schemas and policies before applying.
- **Collaboration**: multi-user presence and conflict resolution baked in.
- **Cost-aware**: track token usage and cap spend per user/workflow.

## Capturing intent

Use `@philjs/intent` to declare intents with types and policies:

```typescript
import { defineIntent } from '@philjs/intent';

export const createDoc = defineIntent({
  name: 'create-doc',
  input: z.object({ title: z.string().min(1) }),
  policy: ({ user }) => user.role === 'editor'
});
```

Bind to UI:

```typescript
const intent = useIntent(createDoc);
intent.submit({ title });
```

Enrich intent with context (feature flags, locale, user role) to guide AI behavior and policy checks.

## AI actions with guardrails

- Call LLMs via `@philjs/ai` with typed prompts and expected JSON schemas.
- Validate outputs; reject or repair before mutating state.
- Log prompts/responses for audit (redact user secrets).
- Add safety filters (toxicity/PII) and enforce deterministic output with JSON modes where possible.
- Keep temperature low for deterministic workflows; higher for ideation surfaces only.

## Collaboration and presence

- Use `@philjs/collab` for presence, cursors, and live cursors in editors.
- Sync via WebSockets or SharedWorkers; merge changes with CRDTs where possible.
- Show conflict indicators; prefer intent replay over last-write-wins.
- For large docs, chunk state and sync per chunk to avoid bandwidth spikes.

## Offline/rehydration

- Persist draft intents locally; replay when back online.
- Use resumability in SSR to avoid redoing AI calls on hydration.
- Keep AI caches separate from user data; drop stale AI suggestions aggressively.
- Show “AI stale” indicators when cached suggestions exceed freshness windows.

## Testing and safety

- Unit-test intent policies and AI validators.
- Add integration tests that simulate AI failures and ensure UI degrades gracefully.
- Rate-limit AI calls; enforce spend budgets server-side.
- Fuzz-test prompt outputs against schemas to catch drift after model updates.
- Add red-team tests for prompt injection and ensure sanitization holds.

## Observability for AI flows

- Emit metrics: prompt latency, token usage, success/failure rates.
- Trace intent → AI call → state mutation to debug regressions.
- Add user-facing “why” strings for AI decisions to build trust.
- Log model version and feature flags to correlate changes with behavior.

## Try it now: guarded AI intent

```typescript
import { defineIntent, useIntent } from '@philjs/intent';
import { callAI } from '@philjs/ai';
import { z } from 'zod';

const summarize = defineIntent({
  name: 'summarize',
  input: z.object({ text: z.string().min(1) }),
  policy: ({ user }) => user.role !== 'banned'
});

const schema = z.object({ summary: z.string().max(500) });

function useSummarize() {
  const intent = useIntent(summarize);
  return async (text: string) => {
    const res = await callAI({
      prompt: `Summarize:\n${text}`,
      schema
    });
    schema.parse(res); // guardrail
    intent.submit({ text }); // log the intent
    return res.summary;
  };
}
```

Add tests that mock `callAI` to return invalid shapes and assert they are rejected, and track token usage per request to enforce budgets.
