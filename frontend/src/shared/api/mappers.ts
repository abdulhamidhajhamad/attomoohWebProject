/**
 * Data Mappers — Adapter Pattern
 *
 * يحوّل بيانات الـ API (لغة واحدة) إلى الأنواع المستخدمة في الواجهة (عربي + إنجليزي)
 * الباك اند يرجع حقول نص عادية — المابر يعبّئ نفس القيمة في الحقلين ar و en
 *
 * هذه الطبقة تفصل الباك اند عن الواجهة — لو تغيّر شكل البيانات من الباك
 * عدّل هنا فقط وباقي الواجهة ما بتتأثر
 */

import type { ApiProduct, ApiCategory, ApiCategoryTreeNode } from './types';
import type { Product, Category } from '../types';

/**
 * Maps backend Product → frontend Product (bilingual adapter)
 */
export function mapApiProduct(p: ApiProduct): Product {
  const categoryIds = (p.categories ?? []).map((cat) =>
    typeof cat === 'object' && cat !== null ? cat._id : (cat as string),
  );

  return {
    id: p._id,
    slug: p._id,
    name: { ar: p.name.ar, en: p.name.en },
    brand: p.brand ?? '',
    model: p.model ?? '',
    description: { ar: '', en: '' },
    price: p.price ?? 0,
    currency: '₪',
    categoryIds,
    images: p.images?.map((img) => img.secureUrl) ?? [],
    inStock: p.isActive,
    specifications: p.specifications
      ? Object.fromEntries(
          Object.entries(p.specifications).map(([key, val]) => [
            key,
            { ar: String(val), en: String(val) },
          ]),
        )
      : undefined,
  };
}

/**
 * Maps backend Category → frontend Category (bilingual adapter)
 */
export function mapApiCategory(c: ApiCategory): Category {
  return {
    id: c._id,
    slug: c._id,
    name: { ar: c.name.ar, en: c.name.en },
    description: {
      ar: typeof c.description === 'object' ? c.description.ar : (c.description || ''),
      en: typeof c.description === 'object' ? c.description.en : (c.description || ''),
    },
    icon: c.icon,
    image: c.image || undefined,
    isActive: c.isActive,
    parentIds: c.parents ?? [],
    level: c.level ?? 0,
    productCount: 0,
  };
}

/** Maps a tree node (from GET /categories/tree) recursively */
export function mapApiCategoryTree(node: ApiCategoryTreeNode): Category {
  return {
    ...mapApiCategory(node),
    children: node.children?.map(mapApiCategoryTree) ?? [],
  };
}

/** Maps array of tree nodes */
export function mapApiCategoryForest(nodes: ApiCategoryTreeNode[]): Category[] {
  return nodes.map(mapApiCategoryTree);
}

/** Build tree from flat category list (multi-parent hierarchy) */
export function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();

  // Clone each category with empty children
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  const roots: Category[] = [];
  for (const cat of map.values()) {
    if (cat.parentIds.length === 0) {
      roots.push(cat);
    } else {
      for (const parentId of cat.parentIds) {
        const parent = parentId ? map.get(parentId) : undefined;
        if (!parent) continue;

        const alreadyLinked = parent.children!.some((child) => child.id === cat.id);
        if (!alreadyLinked) {
          parent.children!.push(cat);
        }
      }
    }
  }

  return roots;
}

/** Maps array of API products */
export function mapApiProducts(products: ApiProduct[]): Product[] {
  return products.map(mapApiProduct);
}

/** Maps array of API categories */
export function mapApiCategories(categories: ApiCategory[]): Category[] {
  return categories.map(mapApiCategory);
}
