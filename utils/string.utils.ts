/**
 * Prefixes a base string using the snake_case convention.
 *
 * @param prefix - The optional prefix string.
 * @param baseName - The base string.
 * @returns The formed snake_case prefixed string.
 */
export function prefixWithSnakeCase(
  prefix: string | null | undefined,
  baseName: string,
): string {
  const p = prefix?.trim();
  if (!p) return baseName;

  const snakePrefix = p
    .replace(/\W+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase();

  return snakePrefix.endsWith("_")
    ? `${snakePrefix}${baseName}`
    : `${snakePrefix}_${baseName}`;
}

/**
 * Prefixes a base string using the camelCase convention.
 *
 * @param prefix - The optional prefix string.
 * @param baseName - The base string.
 * @returns The formed camelCase prefixed string.
 */
export function prefixWithCamelCase(
  prefix: string | null | undefined,
  baseName: string,
): string {
  const p = prefix?.trim();
  if (!p) return baseName;

  const parsed = p
    .replace(/\W+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase();

  const parts = parsed.split("_").filter(Boolean);
  if (parts.length === 0) return baseName;

  const camelPrefix = parts.reduce((acc, part, index) => {
    if (index === 0) return part.toLowerCase();
    return acc + part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }, "");

  const camelBase = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  return `${camelPrefix}${camelBase}`;
}
/**
 * Transforms a camelCase string into snake_case.
 *
 * @param str - The camelCase string to transform.
 * @returns The transformed snake_case string.
 */
export function camelToSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

/**
 * Increments the Unicode code point of the final character in a string.
 *
 * This utility handles standard characters, precomposed accents (via NFC normalization),
 * and supplementary plane characters (like emojis or symbols) safely without corrupting
 * surrogate pairs. It is commonly used to generate exclusive upper bounds for lexical
 * range queries.
 *
 * @param {string} text - The input string whose final character will be incremented.
 * @returns {string} A new string with the final character advanced to the next Unicode code point.
 *
 * @example
 * incrementLastCharacterCodePoint("café"); // Returns "cafè"
 * incrementLastCharacterCodePoint("abc");  // Returns "abd"
 */
export function incrementLastCharacterCodePoint(text: string): string {
  if (!text) return text;

  // 1. Normalize the text so characters (like é) are unified
  const normalized: string = text.normalize("NFC");

  // 2. Convert to an array of true characters (handles emojis/surrogates safely)
  const chars: string[] = Array.from(normalized);

  // 3. Isolate the last character and its code point
  const lastChar: string = chars[chars.length - 1];
  const nextCodePoint: number = (lastChar.codePointAt(0) ?? 0) + 1;

  // 4. Replace the last character with the incremented one
  chars[chars.length - 1] = String.fromCodePoint(nextCodePoint);

  // 5. Re-join into a single string
  return chars.join("");
}
