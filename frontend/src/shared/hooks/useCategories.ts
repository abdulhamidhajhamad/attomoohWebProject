/**
 * useCategories — Custom hooks for category data fetching
 *
 * يستخدم cache بسيط في الذاكرة لتجنب طلبات مكررة
 * يدعم القائمة المسطحة والشجرة الهرمية
 *
 * Usage:
 *   const { categories, categoryTree, loading, error, refetch } = useCategories();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesService } from '../api/services';
import { buildCategoryTree } from '../api/mappers';
import type { Category } from '../types';

/* ═══════════════════════════════════
   In-memory Cache (module-level)
   ═══════════════════════════════════ */

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const categoriesCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = categoriesCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    categoriesCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  categoriesCache.set(key, { data, timestamp: Date.now() });
}

/** Invalidate all category caches */
export function invalidateCategoriesCache(): void {
  categoriesCache.clear();
}

/* ═══════════════════════════════════
   Hook: useCategories (flat + tree)
   ═══════════════════════════════════ */

interface UseCategoriesResult {
  /** Flat list of all categories (sorted by level then name) */
  categories: Category[];
  /** Hierarchical tree (roots with nested children) */
  categoryTree: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchCategories = useCallback(async (skipCache = false) => {
    const cacheKey = 'all-categories';
    const treeCacheKey = 'category-tree';

    if (!skipCache) {
      const cached = getCached<Category[]>(cacheKey);
      const cachedTree = getCached<Category[]>(treeCacheKey);
      if (cached && cachedTree) {
        setCategories(cached);
        setCategoryTree(cachedTree);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const data = await categoriesService.getAll();
      if (mounted.current) {
        setCategories(data);
        setCache(cacheKey, data);

        // Build tree client-side from flat list
        const tree = buildCategoryTree(data);
        setCategoryTree(tree);
        setCache(treeCacheKey, tree);
      }
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof Error ? err.message : 'فشل في تحميل التصنيفات',
        );
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchCategories();
    return () => {
      mounted.current = false;
    };
  }, [fetchCategories]);

  const refetch = useCallback(() => fetchCategories(true), [fetchCategories]);

  return { categories, categoryTree, loading, error, refetch };
}
