export function buildLinkHeader(hints = []) {
    const parts = hints
        .filter((hint) => Boolean(hint?.href))
        .map((hint) => serializeHint(hint));
    return parts.length ? parts.join(", ") : "";
}
export function writeEarlyHints(response, hints = []) {
    if (typeof response.writeEarlyHints !== "function") {
        return false;
    }
    const header = buildLinkHeader(hints);
    if (!header)
        return false;
    response.writeEarlyHints({ Link: header });
    return true;
}
function serializeHint(hint) {
    const attrs = [];
    const rel = hint.rel ?? "preload";
    attrs.push(`rel=${rel}`);
    if (hint.as)
        attrs.push(`as=${hint.as}`);
    if (hint.crossorigin)
        attrs.push(`crossorigin=${hint.crossorigin}`);
    if (hint.priority && hint.priority !== "auto")
        attrs.push(`importance=${hint.priority}`);
    if (hint.type)
        attrs.push(`type="${hint.type}"`);
    return `<${hint.href}>; ${attrs.join("; ")}`;
}
//# sourceMappingURL=hints.js.map