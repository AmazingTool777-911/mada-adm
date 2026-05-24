/**
 * Encodes a JavaScript object into a Base64 string by first converting it to JSON.
 *
 * @param obj - The JavaScript object or value to encode.
 * @returns The Base64 string representation of the JSON stringified object.
 */
export function encodeToBase64(obj: unknown): string {
  return btoa(JSON.stringify(obj));
}

/**
 * Decodes a Base64 string back into a JavaScript object.
 *
 * @param base64 - The Base64 encoded JSON string to decode.
 * @returns The parsed JavaScript object, cast to the specified type `T`.
 */
export function decodeToJsonObject<T = unknown>(base64: string): T {
  return JSON.parse(atob(base64)) as T;
}
