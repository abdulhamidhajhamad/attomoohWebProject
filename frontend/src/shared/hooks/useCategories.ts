import { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesService } from '../api/services';
import { buildCategoryTree } from '../api/mappers';
import { sortCategoriesByOrder } from '../utils/sortCategories';
import type { Category } from '../types';

interface UseCategoriesResult {
  categories: Category[];
  categoryTree: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCategories(showInactive = false): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await categoriesService.getAll(showInactive);
      if (mounted.current) {
        const sorted = sortCategoriesByOrder(data);
        setCategories(sorted);
        const tree = buildCategoryTree(sorted);
        setCategoryTree(tree);
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
  }, [showInactive]);

  useEffect(() => {
    mounted.current = true;
    fetchCategories();
    return () => {
      mounted.current = false;
    };
  }, [fetchCategories]);

  const refetch = useCallback(() => fetchCategories(), [fetchCategories]);

  return { categories, categoryTree, loading, error, refetch };
}
