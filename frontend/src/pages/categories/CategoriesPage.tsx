import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Sparkles, Layers3, FolderOpen } from 'lucide-react';
import { useCategories } from '../../shared/hooks/useCategories';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSEO } from '../../shared/hooks/useSEO';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import { getLucideIcon, DefaultCategoryIcon } from '../../shared/ui/IconResolver';
import type { Category } from '../../shared/types';
import styles from './CategoriesPage.module.css';

const catName = (c: Category, lang: 'ar' | 'en') =>
  (lang === 'ar' ? c.name.ar : c.name.en) || c.name.ar;

const byLevelAndSort = (items: Category[]) =>
  [...items].sort((a, b) => a.level - b.level || a.name.ar.localeCompare(b.name.ar));

const directChildrenOf = (parentId: string, all: Category[]) =>
  byLevelAndSort(all.filter((c) => c.parentIds[0] === parentId));

const descendantsCount = (id: string, all: Category[]) => {
  const queue = [id];
  let count = 0;

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const children = all.filter((c) => c.parentIds[0] === current);
    count += children.length;
    queue.push(...children.map((c) => c.id));
  }

  return count;
};

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';
  const isRtl = lang === 'ar';
  const { categories, loading, error } = useCategories();

  const roots = useMemo(
    () => byLevelAndSort(categories.filter((c) => c.level === 0 && c.parentIds.length === 0)),
    [categories],
  );

  const [selectedRootId, setSelectedRootId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  useEffect(() => {
    if (roots.length === 0) {
      setSelectedRootId('');
      setSelectedSubId('');
      return;
    }

    if (!selectedRootId || !roots.some((r) => r.id === selectedRootId)) {
      setSelectedRootId(roots[0].id);
      setSelectedSubId('');
    }
  }, [roots, selectedRootId]);

  const selectedRoot = useMemo(
    () => roots.find((r) => r.id === selectedRootId) ?? null,
    [roots, selectedRootId],
  );

  const levelTwoItems = useMemo(() => {
    if (!selectedRootId) return [];
    return directChildrenOf(selectedRootId, categories);
  }, [selectedRootId, categories]);

  useEffect(() => {
    if (levelTwoItems.length === 0) {
      setSelectedSubId('');
      return;
    }

    if (!selectedSubId || !levelTwoItems.some((s) => s.id === selectedSubId)) {
      setSelectedSubId(levelTwoItems[0].id);
    }
  }, [levelTwoItems, selectedSubId]);

  const selectedSub = useMemo(
    () => levelTwoItems.find((s) => s.id === selectedSubId) ?? null,
    [levelTwoItems, selectedSubId],
  );

  const levelThreeItems = useMemo(() => {
    if (!selectedSubId) return [];
    return directChildrenOf(selectedSubId, categories);
  }, [selectedSubId, categories]);

  const chooseRoot = useCallback((rootId: string) => {
    setSelectedRootId(rootId);
    setSelectedSubId('');
  }, []);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const currentTitle = selectedRoot ? catName(selectedRoot, lang) : t('categories.title');

  useSEO({
    title: `${t('categories.title')} | ${currentTitle}`,
    description: 'تصفح شجرة تصنيفات من 3 مستويات للوصول السريع إلى معدات المطاعم والملاحم.',
  });

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.hero}>
          <span className={styles.kicker}>
            <Sparkles size={14} />
            دليل التصنيفات
          </span>
          <h1 className={styles.title}>{t('categories.title')}</h1>
          <p className={styles.subtitle}>
            اختر القطاع ثم القسم ثم الفئة النهائية للوصول السريع للمنتجات المناسبة.
          </p>
        </header>

        <div className={styles.pathBar}>
          <Layers3 size={16} />
          <span>{selectedRoot ? catName(selectedRoot, lang) : 'المستوى الأول'}</span>
          <Chevron size={13} />
          <span>{selectedSub ? catName(selectedSub, lang) : 'المستوى الثاني'}</span>
          <Chevron size={13} />
          <span>{levelThreeItems.length > 0 ? 'المستوى الثالث' : 'اختر قسماً'}</span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : roots.length === 0 ? (
          <div className={styles.empty}>
            <DefaultCategoryIcon size={40} />
            <p>{t('categories.empty', 'لا توجد تصنيفات')}</p>
          </div>
        ) : (
          <div className={styles.explorerGrid}>
            <section className={styles.column}>
              <div className={styles.columnHead}>
                <span className={styles.columnStep}>1</span>
                <div>
                  <h2>القطاع الرئيسي</h2>
                  <p>معدات مطاعم أو معدات ملاحم</p>
                </div>
              </div>

              <div className={styles.items}>
                {roots.map((root) => {
                  const Icon = getLucideIcon(root.icon) ?? DefaultCategoryIcon;
                  const selected = root.id === selectedRootId;
                  return (
                    <button
                      key={root.id}
                      type="button"
                      className={`${styles.itemCard} ${selected ? styles.itemCardActive : ''}`}
                      onClick={() => chooseRoot(root.id)}
                    >
                      <span className={styles.itemIcon}>
                        <Icon size={20} />
                      </span>
                      <span className={styles.itemName}>{catName(root, lang)}</span>
                      <span className={styles.itemMeta}>{directChildrenOf(root.id, categories).length} أقسام</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={styles.column}>
              <div className={styles.columnHead}>
                <span className={styles.columnStep}>2</span>
                <div>
                  <h2>القسم الفرعي</h2>
                  <p>اختيار النوع الداخلي ضمن القطاع</p>
                </div>
              </div>

              <div className={styles.items}>
                {selectedRoot && levelTwoItems.length > 0 ? (
                  levelTwoItems.map((sub) => {
                    const selected = sub.id === selectedSubId;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        className={`${styles.itemCard} ${selected ? styles.itemCardActive : ''}`}
                        onClick={() => setSelectedSubId(sub.id)}
                      >
                        <span className={styles.itemName}>{catName(sub, lang)}</span>
                        <span className={styles.itemMeta}>{directChildrenOf(sub.id, categories).length} فئات</span>
                      </button>
                    );
                  })
                ) : (
                  <div className={styles.columnEmpty}>لا توجد أقسام فرعية لهذا القطاع</div>
                )}
              </div>
            </section>

            <section className={styles.column}>
              <div className={styles.columnHead}>
                <span className={styles.columnStep}>3</span>
                <div>
                  <h2>الفئة النهائية</h2>
                  <p>الانتقال لصفحة المنتجات</p>
                </div>
              </div>

              <div className={styles.items}>
                {selectedSub && levelThreeItems.length > 0 ? (
                  levelThreeItems.map((leaf) => (
                    <Link key={leaf.id} to={`/categories/${leaf.id}`} className={styles.itemLinkCard}>
                      <span className={styles.itemName}>{catName(leaf, lang)}</span>
                      <span className={styles.itemMeta}>عرض المنتجات</span>
                      <Chevron size={15} className={styles.linkChevron} />
                    </Link>
                  ))
                ) : selectedSub ? (
                  <Link to={`/categories/${selectedSub.id}`} className={styles.fallbackLink}>
                    <FolderOpen size={18} />
                    لا توجد فئات أعمق. افتح منتجات {catName(selectedSub, lang)}
                  </Link>
                ) : (
                  <div className={styles.columnEmpty}>اختر قسماً من المستوى الثاني</div>
                )}
              </div>
            </section>

            <aside className={styles.summaryCard}>
              <h3>ملخص سريع</h3>
              <div className={styles.summaryLine}>
                <span>إجمالي القطاعات</span>
                <strong>{roots.length}</strong>
              </div>
              <div className={styles.summaryLine}>
                <span>إجمالي الأقسام</span>
                <strong>{categories.filter((c) => c.level === 1).length}</strong>
              </div>
              <div className={styles.summaryLine}>
                <span>إجمالي الفئات النهائية</span>
                <strong>{categories.filter((c) => c.level === 2).length}</strong>
              </div>
              {selectedRoot && (
                <div className={styles.summaryContext}>
                  <p>داخل {catName(selectedRoot, lang)}</p>
                  <strong>{descendantsCount(selectedRoot.id, categories)} تصنيفات فرعية</strong>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
