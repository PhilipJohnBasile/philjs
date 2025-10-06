import type { ServerResponse } from "node:http";

export type HintPriority = "high" | "low" | "auto";
export type HintAs =
  | "script"
  | "style"
  | "font"
  | "fetch"
  | "image"
  | "document"
  | "worker"
  | "module";

export type EarlyHint = {
  href: string;
  rel?: "preload" | "preconnect" | "modulepreload" | "prefetch";
  as?: HintAs;
  crossorigin?: "anonymous" | "use-credentials";
  priority?: HintPriority;
  type?: string;
};

export function buildLinkHeader(hints: EarlyHint[] = []) {
  const parts = hints
    .filter((hint) => Boolean(hint?.href))
    .map((hint) => serializeHint(hint as Required<EarlyHint>));
  return parts.length ? parts.join(", ") : "";
}

export function writeEarlyHints(response: ServerResponse, hints: EarlyHint[] = []) {
  if (typeof response.writeEarlyHints !== "function") {
    return false;
  }
  const header = buildLinkHeader(hints);
  if (!header) return false;
  response.writeEarlyHints({ Link: header });
  return true;
}

function serializeHint(hint: EarlyHint) {
  const attrs: string[] = [];
  const rel = hint.rel ?? "preload";
  attrs.push(`rel=${rel}`);
  if (hint.as) attrs.push(`as=${hint.as}`);
  if (hint.crossorigin) attrs.push(`crossorigin=${hint.crossorigin}`);
  if (hint.priority && hint.priority !== "auto") attrs.push(`importance=${hint.priority}`);
  if (hint.type) attrs.push(`type="${hint.type}"`);
  return `<${hint.href}>; ${attrs.join("; ")}`;
}
