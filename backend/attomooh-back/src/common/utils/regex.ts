/**
 * Escapes all regex-special characters in user-supplied strings
 * before using them in a `new RegExp(...)` search.
 * Prevents regex injection and ReDoS via crafted search input.
 */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
