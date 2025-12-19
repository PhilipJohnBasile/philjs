/**
 * Lightweight HTML templating utilities for PhilJS SSR.
 */

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += escapeHTML(values[i]);
    }
  }
  return result;
}

export function unsafeHTML(value: unknown): string {
  return String(value ?? "");
}

function escapeHTML(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((item) => escapeHTML(item)).join("");
  }
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
