import { useMemo, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../../shared/hooks/useProducts';
import { useCategories } from '../../shared/hooks/useCategories';
import { searchProducts, getCategoryById } from '../../entities/data';
import { ProductGrid } from '../../features/products/ProductGrid/ProductGrid';
import { useSEO } from '../../shared/hooks/useSEO';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import { ITEMS_PER_PAGE } from '../../shared/constants';
import styles from './ProductsPage.module.css';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const { currentLang } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';
  const searchQuery = searchParams.get('search') || '';
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data from API
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();

  const category = categorySlug
    ? getCategoryById(categories, categorySlug)
    : undefined;

  /** Get all descendant IDs of a category (for inclusive filtering) */
  const getDescendantIds = useCallback(
    (parentId: string): string[] => {
      const ids: string[] = [parentId];
      const children = categories.filter((c) => c.parentIds.includes(parentId));
      for (const child of children) {
        ids.push(...getDescendantIds(child.id));
      }
      return ids;
    },
    [categories],
  );

  const filteredProducts = useMemo(() => {
    if (searchQuery) {
      return searchProducts(products, searchQuery, lang);
    }
    if (categorySlug) {
      // Include products from this category AND all its descendants
      const validIds = new Set(getDescendantIds(categorySlug));
      return products.filter((p) => p.categoryIds.some((id) => validIds.has(id)));
    }
    return products;
  }, [searchQuery, categorySlug, lang, products, getDescendantIds]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const pageTitle = category
    ? lang === 'ar'
      ? category.name.ar
      : category.name.en
    : searchQuery
      ? `${t('nav.search')}: ${searchQuery}`
      : t('products.title');

  useSEO({
    title: pageTitle,
    description: `${pageTitle} - معدات مطاعم وتجهيزات مطابخ صناعية`,
  });

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>{pageTitle}</h1>
            <p>
              {t('products.showing')} {paginatedProducts.length} {t('products.of')}{' '}
              {filteredProducts.length} {t('products.items')}
            </p>
          </div>
        </header>

        {/* ═════ Products ═════ */}
        {productsLoading ? (
          <LoadingSpinner />
        ) : paginatedProducts.length > 0 ? (
          <>
            <ProductGrid products={paginatedProducts} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`${styles.pageBtn} ${page === currentPage ? styles.pageBtnActive : ''}`}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>{t('products.noProducts')}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
