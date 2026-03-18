/**
 * ═════ Data Helpers ═════
 * 
 * وظائف مساعدة للبحث والفلترة في بيانات المنتجات والتصنيفات
 * البيانات تُجلب من الـ API عبر الـ hooks (useProducts, useCategories)
 * هذا الملف يحتوي فقط على وظائف مساعدة تعمل على المصفوفات الممررة
 */

import type { Product, Category } from '../../shared/types';

/* ═══ Helper Functions ═══ */

/** Filter products by category ID */
export function filterProductsByCategory(
  products: Product[],
  categoryId: string,
): Product[] {
  return products.filter((p) => p.categoryIds.includes(categoryId));
}

/** Find a product by its ID (slug = ID from API) */
export function getProductById(
  products: Product[],
  id: string,
): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Find a category by its ID (slug = ID from API) */
export function getCategoryById(
  categories: Category[],
  id: string,
): Category | undefined {
  return categories.find((c) => c.id === id);
}

/** Search products by query in the specified language */
export function searchProducts(
  products: Product[],
  query: string,
  lang: 'ar' | 'en',
): Product[] {
  const lowerQuery = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name[lang].toLowerCase().includes(lowerQuery) ||
      p.description[lang].toLowerCase().includes(lowerQuery),
  );
}
