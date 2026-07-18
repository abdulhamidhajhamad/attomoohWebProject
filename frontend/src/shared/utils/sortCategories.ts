import type { Category } from '../types';

const MAX = Number.MAX_SAFE_INTEGER;

/**
 * Sorts categories by their admin-defined sortOrder (ascending).
 * Categories without a sortOrder value are pushed to the end.
 */
export function sortCategoriesByOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const orderA = a.sortOrder ?? MAX;
    const orderB = b.sortOrder ?? MAX;
    return orderA - orderB;
  });
}
