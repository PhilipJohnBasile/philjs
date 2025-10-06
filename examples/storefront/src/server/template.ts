/** Escape HTML entities to prevent XSS. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

class SafeHTML {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

/** Mark a string as pre-escaped HTML. */
export function unsafeHTML(value: string) {
  return new SafeHTML(value);
}

type TemplateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SafeHTML
  | TemplateValue[];

function coerce(value: TemplateValue): string {
  if (value == null || value === false) return "";
  if (Array.isArray(value)) {
    return value.map((item) => coerce(item as TemplateValue)).join("");
  }
  if (value instanceof SafeHTML) {
    return value.toString();
  }
  return escapeHtml(String(value));
}

/** Tagged template helper that escapes interpolated values by default. */
export function html(strings: TemplateStringsArray, ...values: TemplateValue[]) {
  let result = "";

  strings.forEach((chunk, index) => {
    result += chunk;
    if (index < values.length) {
      result += coerce(values[index]);
    }
  });

  return result;
}
