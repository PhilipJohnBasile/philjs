/**
 * Resumability helpers for serializing state and handler refs.
 */

/**
 * Serialize state to base64 for embedding in data-* attributes.
 * @param {unknown} obj - Object to serialize
 * @returns {string}
 */
export function serializeState(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

/**
 * Deserialize state from base64.
 * @param {string} b64 - Base64 encoded state
 * @returns {unknown}
 */
export function deserializeState(b64) {
  return JSON.parse(Buffer.from(b64, "base64").toString());
}
