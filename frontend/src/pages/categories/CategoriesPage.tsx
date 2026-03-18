import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useCategories } from '../../shared/hooks/useCategories';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSEO } from '../../shared/hooks/useSEO';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import { getLucideIcon, DefaultCategoryIcon } from '../../shared/ui/IconResolver';
import type { Category } from '../../shared/types';
import styles from './CategoriesPage.module.css';

/* ── helpers ── */
const catName = (c: Category, lang: 'ar' | 'en') =>
  lang === 'ar' ? c.name.ar : c.name.en;

const childrenOf = (parentId: string, all: Category[]) =>
  all.filter((c) => c.parentIds.includes(parentId));

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';
  const isRtl = lang === 'ar';
  const { categories, categoryTree, loading, error } = useCategories();

  const [breadcrumbIds, setBreadcrumbIds] = useState<string[]>([]);

  const breadcrumbs = useMemo(
    () =>
      breadcrumbIds
        .map((id) => categories.find((c) => c.id === id))
        .filter(Boolean) as Category[],
    [breadcrumbIds, categories],
  );

  const currentItems = useMemo(() => {
    if (!breadcrumbIds.length) return categoryTree;
    return childrenOf(breadcrumbIds[breadcrumbIds.length - 1], categories);
  }, [breadcrumbIds, categoryTree, categories]);

  const hasChildren = useCallback(
    (id: string) => categories.some((c) => c.parentIds.includes(id)),
    [categories],
  );

  const drillInto = useCallback(
    (cat: Category) => hasChildren(cat.id) && setBreadcrumbIds((p) => [...p, cat.id]),
    [hasChildren],
  );

  const goToLevel = useCallback(
    (i: number) => setBreadcrumbIds((p) => p.slice(0, i + 1)),
    [],
  );

  const goToRoot = useCallback(() => setBreadcrumbIds([]), []);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const currentTitle =
    breadcrumbs.length > 0
      ? catName(breadcrumbs[breadcrumbs.length - 1], lang)
      : t('categories.title');

  useSEO({
    title: currentTitle,
    description:
      'تصفح جميع تصنيفات معدات المطابخ الصناعية - أفران، قلايات، مفارم لحوم، تبريد والمزيد',
  });

  /* ── Shared row renderer (DRY) ── */
  const renderRow = (cat: Category) => {
    const isLeaf = !hasChildren(cat.id);
    const Icon = getLucideIcon(cat.icon) ?? DefaultCategoryIcon;
    const name = catName(cat, lang);
    const count = childrenOf(cat.id, categories).length;

    const inner = (
      <>
        <span className={styles.rowIcon}>
          <Icon size={24} />
        </span>
        <span className={styles.rowLabel}>{name}</span>
        {!isLeaf && <span className={styles.badge}>{count}</span>}
        <Chevron size={16} className={styles.rowChevron} />
      </>
    );

    return isLeaf ? (
      <Link key={cat.id} to={`/categories/${cat.id}`} className={styles.row}>
        {inner}
      </Link>
    ) : (
      <button key={cat.id} className={styles.row} onClick={() => drillInto(cat)}>
        {inner}
      </button>
    );
  };

  return (
    <div className="container">
      <div className={styles.page}>
        {/* ── Breadcrumb ── */}
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumb} aria-label="navigation">
            <button className={styles.crumb} onClick={goToRoot}>
              <Home size={14} />
              <span>{t('categories.title')}</span>
            </button>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className={styles.crumbSep}>
                <Chevron size={12} />
                {i < breadcrumbs.length - 1 ? (
                  <button className={styles.crumb} onClick={() => goToLevel(i)}>
                    {catName(crumb, lang)}
                  </button>
                ) : (
                  <span className={styles.crumbActive}>{catName(crumb, lang)}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* ── Title bar ── */}
        <div className={styles.titleBar}>
          <h1 className={styles.title}>{currentTitle}</h1>
          {currentItems.length > 0 && (
            <span className={styles.count}>{currentItems.length}</span>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : currentItems.length > 0 ? (
          <ul className={styles.list}>{currentItems.map(renderRow)}</ul>
        ) : (
          <div className={styles.empty}>
            <DefaultCategoryIcon size={40} />
            <p>{t('categories.empty', 'لا توجد تصنيفات')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
