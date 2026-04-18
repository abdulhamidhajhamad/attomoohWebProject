import { useState, useCallback, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  FolderTree,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useCategories,
  invalidateCategoriesCache,
} from '../../../shared/hooks/useCategories';
import { categoriesService } from '../../../shared/api/services';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { getLucideIcon, DefaultCategoryIcon } from '../../../shared/ui/IconResolver';
import type { Category } from '../../../shared/types';
import styles from './AdminCategories.module.css';

/* ═══════════════════════════════════
   Level labels and colors
   ═══════════════════════════════════ */
const LEVEL_LABELS = ['تصنيف رئيسي', 'تصنيف فرعي', 'تصنيف فرعي ثاني'];
const LEVEL_COLORS = ['#90297d', '#0ea5e9', '#22c55e'];

/* ═══════════════════════════════════
   Tree Row Component
   ═══════════════════════════════════ */
interface TreeRowProps {
  category: Category;
  allCategories: Category[];
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onDelete: (id: string, name: string, hasChildren: boolean) => void;
  deleting: string | null;
}

function TreeRow({
  category,
  allCategories,
  expandedIds,
  toggleExpand,
  onDelete,
  deleting,
}: TreeRowProps) {
  const children = allCategories.filter((c) => c.parentIds.includes(category.id));
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const Icon = getLucideIcon(category.icon);
  const levelColor = LEVEL_COLORS[category.level] ?? LEVEL_COLORS[0];

  return (
    <>
      <div
        className={styles.treeRow}
        style={{ paddingRight: `${24 + category.level * 32}px` }}
      >
        {/* Expand toggle */}
        <button
          className={styles.expandBtn}
          onClick={() => hasChildren && toggleExpand(category.id)}
          style={{ opacity: hasChildren ? 1 : 0, pointerEvents: hasChildren ? 'auto' : 'none' }}
        >
          {isExpanded ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>

        {/* Icon */}
        <div
          className={styles.rowIcon}
          style={{ background: `${levelColor}15`, color: levelColor }}
        >
          {Icon ? <Icon size={18} /> : <DefaultCategoryIcon size={18} />}
        </div>

        {/* Info */}
        <div className={styles.rowInfo}>
          <span className={styles.rowName}>{category.name.ar}</span>
          <span
            className={styles.levelBadge}
            style={{ background: `${levelColor}18`, color: levelColor }}
          >
            {LEVEL_LABELS[category.level]}
          </span>
          {hasChildren && (
            <span className={styles.childCount}>{children.length} فرعي</span>
          )}
        </div>

        {/* Actions */}
        <div className={styles.rowActions}>
          {/* Only show "Add sub" if level < 2 */}
          {category.level < 2 && (
            <Link
              to={`/admin/categories/add?parent=${category.id}`}
              className={styles.addSubBtn}
              title="إضافة تصنيف فرعي"
            >
              <Plus size={14} />
            </Link>
          )}
          <button
            className={styles.deleteRowBtn}
            title={hasChildren ? 'حذف التصنيف وجميع الأبناء' : 'حذف التصنيف'}
            disabled={deleting === category.id}
            onClick={() => onDelete(category.id, category.name.ar, hasChildren)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children (collapsible) */}
      {hasChildren && isExpanded && (
        <div className={styles.treeChildren}>
          {children.map((child) => (
            <TreeRow
              key={child.id}
              category={child}
              allCategories={allCategories}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onDelete={onDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════
   Main Page
   ═══════════════════════════════════ */

export default function AdminCategoriesPage() {
  const { categories, categoryTree, loading, error, refetch } = useCategories();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Expand all on first load
  useEffect(() => {
    if (categories.length === 0) return;
    setExpandedIds(new Set(categories.filter((c) => c.level < 2).map((c) => c.id)));
  }, [categories]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(categories.map((c) => c.id)));
  }, [categories]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleDelete = useCallback(
    async (id: string, name: string, hasChildren: boolean) => {
      const msg = hasChildren
        ? `هل أنت متأكد من حذف "${name}" وجميع التصنيفات الفرعية التابعة له؟`
        : `هل أنت متأكد من حذف التصنيف "${name}"؟`;

      if (!confirm(msg)) return;
      setDeleting(id);
      try {
        await categoriesService.deleteById(id);
        invalidateCategoriesCache();
        refetch();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'فشل في حذف التصنيف');
      } finally {
        setDeleting(null);
      }
    },
    [refetch],
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  // Stats
  const rootCount = categories.filter((c) => c.level === 0).length;
  const subCount = categories.filter((c) => c.level === 1).length;
  const leafCount = categories.filter((c) => c.level === 2).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة التصنيفات</h1>
          <p className={styles.pageSubtitle}>
            {rootCount} رئيسي · {subCount} فرعي · {leafCount} فرعي ثاني
          </p>
        </div>
        <Link to="/admin/categories/add" className={styles.addBtn}>
          <Plus size={18} />
          إضافة تصنيف
        </Link>
      </div>

      {error && (
        <div className={styles.errorMsg}>{error}</div>
      )}

      {/* Controls */}
      <div className={styles.treeControls}>
        <button onClick={expandAll} className={styles.controlBtn}>
          توسيع الكل
        </button>
        <button onClick={collapseAll} className={styles.controlBtn}>
          طي الكل
        </button>
      </div>

      {/* Tree */}
      {categoryTree.length > 0 ? (
        <div className={styles.treeContainer}>
          <div className={styles.treeHeader}>
            <FolderTree size={16} />
            <span>شجرة التصنيفات</span>
          </div>
          {categoryTree.map((root) => (
            <TreeRow
              key={root.id}
              category={root}
              allCategories={categories}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyTree}>
          <FolderTree size={48} />
          <p>لا توجد تصنيفات</p>
          <Link to="/admin/categories/add" className={styles.addBtn}>
            <Plus size={18} />
            إضافة تصنيف رئيسي
          </Link>
        </div>
      )}

      {/* Note */}
      <div className={styles.note}>
        <strong>ملاحظة:</strong> حذف تصنيف رئيسي سيحذف جميع التصنيفات الفرعية التابعة له تلقائياً.
      </div>
    </div>
  );
}
