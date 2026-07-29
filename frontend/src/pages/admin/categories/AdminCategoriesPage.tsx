import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  FolderTree,
  Edit2,
  ListOrdered,
  Save,
  X,
  Wrench,
  UtensilsCrossed,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../../shared/hooks/useCategories';
import { categoriesService, productsService } from '../../../shared/api/services';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { Modal } from '../../../shared/ui/Modal';
import { getLucideIcon, DefaultCategoryIcon } from '../../../shared/ui/IconResolver';
import type { Category, Product } from '../../../shared/types';
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
  isReorderMode: boolean;
  reorderParentId: string | null;
  reorderValues: Record<string, number>;
  onStartReorder: (parentId: string | null) => void;
  onStartProductReorder: (categoryId: string) => void;
  onReorderValueChange: (childId: string, value: number) => void;
  onSaveReorder: (parentId: string) => Promise<void>;
  onCancelReorder: () => void;
  reorderSaving: boolean;
}

function TreeRow({
  category,
  allCategories,
  expandedIds,
  toggleExpand,
  onDelete,
  deleting,
  isReorderMode,
  reorderParentId,
  reorderValues,
  onStartReorder,
  onStartProductReorder,
  onReorderValueChange,
  onSaveReorder,
  onCancelReorder,
  reorderSaving,
}: TreeRowProps) {
  const children = allCategories.filter((c) => c.parentIds.includes(category.id));
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(category.id);

  // Sort children by childrenOrder for display
  const sortedChildren = (() => {
    if (!hasChildren) return children;
    if (!category.childrenOrder) return children;
    const orderMap = new Map(
      category.childrenOrder.map((co) => [co.subCategoryId, co.sortOrder]),
    );
    return [...children].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  })();

  const isEditingReorder = isReorderMode && reorderParentId === category.id;
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
          {isReorderMode && hasChildren && !isEditingReorder && (
            <button
              className={styles.reorderBtn}
              title="ترتيب الأبناء"
              onClick={() => onStartReorder(category.id)}
            >
              <ListOrdered size={14} />
            </button>
          )}
          {isReorderMode && !isEditingReorder && (
            <button
              className={styles.reorderBtn}
              title="ترتيب المنتجات"
              onClick={() => onStartProductReorder(category.id)}
            >
              <Package size={14} />
            </button>
          )}
          <Link
            to={`/admin/categories/${category.id}/edit`}
            className={styles.editBtn}
            title="تعديل التصنيف"
          >
            <Edit2 size={14} />
          </Link>
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
            title={hasChildren ? 'حذف التصنيف وفك/حذف الأبناء التابعة له حسب الارتباطات' : 'حذف التصنيف'}
            disabled={deleting === category.id}
            onClick={() => onDelete(category.id, category.name.ar, hasChildren)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children (collapsible) */}
      {hasChildren && isExpanded && !isEditingReorder && (
        <div className={styles.treeChildren}>
          {sortedChildren.map((child) => (
            <TreeRow
              key={child.id}
              category={child}
              allCategories={allCategories}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onDelete={onDelete}
              deleting={deleting}
              isReorderMode={isReorderMode}
              reorderParentId={reorderParentId}
              reorderValues={reorderValues}
              onStartReorder={onStartReorder}
              onStartProductReorder={onStartProductReorder}
              onReorderValueChange={onReorderValueChange}
              onSaveReorder={onSaveReorder}
              onCancelReorder={onCancelReorder}
              reorderSaving={reorderSaving}
            />
          ))}
        </div>
      )}

      {/* Reorder editor */}
      {isEditingReorder && (
        <ReorderEditor
          parent={category}
          childrenList={sortedChildren}
          reorderValues={reorderValues}
          onValueChange={onReorderValueChange}
          onSave={() => onSaveReorder(category.id)}
          onCancel={onCancelReorder}
          saving={reorderSaving}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════
   Reorder Editor Sub-Component
   ═══════════════════════════════════ */

/** Minimal parent info required for reorder display */
interface ReorderParentInfo {
  id: string;
  name: { ar: string; en: string };
  level: number;
}

interface ReorderEditorProps {
  parent: ReorderParentInfo;
  childrenList: Category[];
  reorderValues: Record<string, number>;
  onValueChange: (childId: string, value: number) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function ReorderEditor({
  parent,
  childrenList,
  reorderValues,
  onValueChange,
  onSave,
  onCancel,
  saving,
}: ReorderEditorProps) {
  return (
    <div
      className={styles.reorderEditor}
      style={{ marginRight: `${24 + (parent.level + 1) * 32}px` }}
    >
      <div className={styles.reorderHeader}>
        <ListOrdered size={16} />
        <span>ترتيب أبناء: {parent.name.ar}</span>
      </div>

      <div className={styles.reorderList}>
        {childrenList.map((child) => {
          const childLevelColor = LEVEL_COLORS[child.level] ?? LEVEL_COLORS[0];
          return (
            <div key={child.id} className={styles.reorderItem}>
              <div className={styles.reorderItemInfo}>
                <span className={styles.reorderItemName}>{child.name.ar}</span>
                <span
                  className={styles.reorderItemBadge}
                  style={{ background: `${childLevelColor}18`, color: childLevelColor }}
                >
                  {LEVEL_LABELS[child.level]}
                </span>
              </div>
              <div className={styles.reorderInputGroup}>
                <label className={styles.reorderInputLabel}>الترتيب</label>
                <input
                  type="number"
                  min={0}
                  max={999}
                  className={styles.reorderOrderInput}
                  value={reorderValues[child.id] ?? 0}
                  onChange={(e) =>
                    onValueChange(child.id, Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.reorderActions}>
        <button
          className={styles.reorderSaveBtn}
          onClick={onSave}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'جاري الحفظ...' : 'حفظ الترتيب'}
        </button>
        <button
          className={styles.reorderCancelBtn}
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} />
          إلغاء
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   Product Reorder Editor Sub-Component
   ═══════════════════════════════════ */

interface ProductReorderEditorProps {
  products: Product[];
  reorderValues: Record<string, number>;
  onValueChange: (productId: string, value: number) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function ProductReorderEditor({
  products,
  reorderValues,
  onValueChange,
  onSave,
  onCancel,
  saving,
}: ProductReorderEditorProps) {
  return (
    <div className={styles.reorderEditor}>
      <div className={styles.reorderHeader}>
        <Package size={16} />
        <span>ترتيب منتجات التصنيف</span>
      </div>

      {products.length === 0 ? (
        <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
          لا توجد منتجات في هذا التصنيف
        </div>
      ) : (
        <div className={styles.reorderList}>
          {products.map((product) => {
            const isOrdered = reorderValues[product.id] !== undefined;
            return (
              <div key={product.id} className={styles.reorderItem}>
                <div className={styles.reorderItemInfo}>
                  <span className={styles.reorderItemName}>
                    {product.name.ar}
                  </span>
                  {!isOrdered && (
                    <span
                      className={styles.reorderItemBadge}
                      style={{ background: '#f3f4f6', color: '#9ca3af' }}
                    >
                      بدون ترتيب
                    </span>
                  )}
                </div>
                <div className={styles.reorderInputGroup}>
                  <label className={styles.reorderInputLabel}>الترتيب</label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    className={styles.reorderOrderInput}
                    value={reorderValues[product.id] ?? 0}
                    onChange={(e) =>
                      onValueChange(product.id, Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.reorderActions}>
        <button
          className={styles.reorderSaveBtn}
          onClick={onSave}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'جاري الحفظ...' : 'حفظ الترتيب'}
        </button>
        <button
          className={styles.reorderCancelBtn}
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} />
          إلغاء
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   Main Page
   ═══════════════════════════════════ */

export default function AdminCategoriesPage() {
  const { categories, categoryTree, loading, error, refetch } = useCategories(true);
  const [adminType, setAdminType] = useState<'machine' | 'restaurant'>('machine');
  const [modalType, setModalType] = useState<'machine' | 'restaurant'>('machine');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const typeFilteredTree = useMemo(
    () => categoryTree.filter((root) => root.categoryType === adminType),
    [categoryTree, adminType],
  );

  // Reorder state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderParentId, setReorderParentId] = useState<string | null>(null);
  const [reorderValues, setReorderValues] = useState<Record<string, number>>({});
  const [reorderSaving, setReorderSaving] = useState(false);

  // Product reorder state
  const [productReorderCategoryId, setProductReorderCategoryId] = useState<string | null>(null);
  const [productReorderProducts, setProductReorderProducts] = useState<Product[]>([]);
  const [productReorderValues, setProductReorderValues] = useState<Record<string, number>>({});
  const [productReorderLoading, setProductReorderLoading] = useState(false);
  const [productReorderSaving, setProductReorderSaving] = useState(false);

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
        ? `هل أنت متأكد من حذف "${name}"؟ سيتم الإبقاء على التصنيفات الفرعية المرتبطة بآباء آخرين.`
        : `هل أنت متأكد من حذف التصنيف "${name}"؟`;

      if (!confirm(msg)) return;
      setDeleting(id);
      try {
        await categoriesService.deleteById(id);
        refetch();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'فشل في حذف التصنيف');
      } finally {
        setDeleting(null);
      }
    },
    [refetch],
  );

  /* ── Reorder handlers ── */

  const toggleReorderMode = useCallback(() => {
    setIsReorderMode((prev) => {
      if (prev) {
        // Exiting reorder mode — clean up
        setReorderParentId(null);
        setReorderValues({});
      }
      return !prev;
    });
  }, []);

  const switchAdminType = useCallback((type: 'machine' | 'restaurant') => {
    setAdminType(type);
    if (reorderParentId === '__roots__') {
      handleCancelReorder();
    }
  }, [reorderParentId]);

  const handleModalTypeToggle = useCallback((type: 'machine' | 'restaurant') => {
    setModalType(type);
    const roots = categories.filter((c) => c.level === 0 && c.categoryType === type);
    const initial: Record<string, number> = {};
    roots.forEach((root) => {
      initial[root.id] = root.sortOrder ?? 0;
    });
    setReorderValues(initial);
  }, [categories]);

  const handleStartReorder = useCallback(
    (parentId: string | null) => {
      if (parentId === null) {
        setModalType(adminType);
        const roots = categories.filter((c) => c.level === 0 && c.categoryType === adminType);
        const initial: Record<string, number> = {};
        roots.forEach((root) => {
          initial[root.id] = root.sortOrder ?? 0;
        });
        setReorderParentId('__roots__');
        setReorderValues(initial);
        return;
      }

      const parent = categories.find((c) => c.id === parentId);
      if (!parent) return;

      const children = categories.filter((c) => c.parentIds.includes(parentId));
      const orderMap = new Map(
        (parent.childrenOrder ?? []).map((co) => [co.subCategoryId, co.sortOrder]),
      );

      // Initialize values: prefer childrenOrder, else auto-assign 0,1,2,…
      const initial: Record<string, number> = {};
      children.forEach((child, index) => {
        initial[child.id] = orderMap.get(child.id) ?? index;
      });

      setReorderParentId(parentId);
      setReorderValues(initial);
    },
    [categories],
  );

  const handleReorderValueChange = useCallback(
    (childId: string, value: number) => {
      setReorderValues((prev) => ({ ...prev, [childId]: value }));
    },
    [],
  );

  const handleSaveReorder = useCallback(
    async (parentId: string) => {
      setReorderSaving(true);
      try {
        if (parentId === '__roots__') {
          // Update each root's sortOrder in parallel
          const updates = Object.entries(reorderValues).map(
            ([categoryId, sortOrder]) =>
              categoriesService.update(categoryId, { sortOrder }),
          );
          await Promise.all(updates);
        } else {
          const children = Object.entries(reorderValues).map(([subCategoryId, sortOrder]) => ({
            subCategoryId,
            sortOrder,
          }));
          await categoriesService.updateChildrenOrder(parentId, children);
        }
        refetch();
        setReorderParentId(null);
        setReorderValues({});
      } catch (err) {
        alert(err instanceof Error ? err.message : 'فشل في حفظ الترتيب');
      } finally {
        setReorderSaving(false);
      }
    },
    [reorderValues, refetch],
  );

  const handleCancelReorder = useCallback(() => {
    setReorderParentId(null);
    setReorderValues({});
  }, []);

  /* ── Product reorder handlers ── */

  const handleStartProductReorder = useCallback(async (categoryId: string) => {
    setProductReorderCategoryId(categoryId);
    setProductReorderLoading(true);
    try {
      const products = await productsService.getByCategory(categoryId);
      setProductReorderProducts(products);

      const category = categories.find((c) => c.id === categoryId);
      const orderMap = new Map(
        (category?.productOrder ?? []).map((po) => [po.productId, po.sortOrder]),
      );

      const initial: Record<string, number> = {};
      products.forEach((p, index) => {
        initial[p.id] = orderMap.get(p.id) ?? index;
      });
      setProductReorderValues(initial);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في تحميل المنتجات');
      setProductReorderCategoryId(null);
    } finally {
      setProductReorderLoading(false);
    }
  }, [categories]);

  const handleProductReorderValueChange = useCallback((childId: string, value: number) => {
    setProductReorderValues((prev) => ({ ...prev, [childId]: value }));
  }, []);

  const handleSaveProductReorder = useCallback(async () => {
    if (!productReorderCategoryId) return;
    setProductReorderSaving(true);
    try {
      const products = Object.entries(productReorderValues).map(([productId, sortOrder]) => ({
        productId,
        sortOrder,
      }));
      await categoriesService.updateProductOrder(productReorderCategoryId, products);
      setProductReorderCategoryId(null);
      setProductReorderProducts([]);
      setProductReorderValues({});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في حفظ ترتيب المنتجات');
    } finally {
      setProductReorderSaving(false);
    }
  }, [productReorderCategoryId, productReorderValues]);

  const handleCancelProductReorder = useCallback(() => {
    setProductReorderCategoryId(null);
    setProductReorderProducts([]);
    setProductReorderValues({});
  }, []);

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

      {/* Type filter */}
      <div className={styles.typeFilterRow}>
        <button
          type="button"
          className={`${styles.controlBtn} ${adminType === 'machine' ? styles.controlBtnActive : ''}`}
          onClick={() => switchAdminType('machine')}
        >
          <Wrench size={14} />
          حسب الآلة
        </button>
        <button
          type="button"
          className={`${styles.controlBtn} ${adminType === 'restaurant' ? styles.controlBtnActive : ''}`}
          onClick={() => switchAdminType('restaurant')}
        >
          <UtensilsCrossed size={14} />
          حسب المطعم
        </button>
      </div>

      {/* Controls */}
      <div className={styles.treeControls}>
        <button onClick={expandAll} className={styles.controlBtn}>
          توسيع الكل
        </button>
        <button onClick={collapseAll} className={styles.controlBtn}>
          طي الكل
        </button>
        <button
          onClick={toggleReorderMode}
          className={`${styles.controlBtn} ${isReorderMode ? styles.controlBtnActive : ''}`}
        >
          <ListOrdered size={14} />
          {isReorderMode ? 'إنهاء الترتيب' : 'ترتيب الأبناء'}
        </button>
        <button
          onClick={() => handleStartReorder(null)}
          className={`${styles.controlBtn} ${reorderParentId === '__roots__' ? styles.controlBtnActive : ''}`}
        >
          <ListOrdered size={14} />
          ترتيب التصنيفات الرئيسية
        </button>
      </div>

      {/* Tree */}
      {typeFilteredTree.length > 0 ? (
        <div className={styles.treeContainer}>
          <div className={styles.treeHeader}>
            <FolderTree size={16} />
            <span>شجرة التصنيفات — {adminType === 'machine' ? 'حسب الآلة' : 'حسب المطعم'}</span>
            {isReorderMode && (
              <span className={styles.reorderHint}>
                انقر على أيقونة الترتيب بجانب التصنيف الأب لترتيب أبنائه
              </span>
            )}
          </div>
          {typeFilteredTree.map((root) => (
            <TreeRow
              key={root.id}
              category={root}
              allCategories={categories}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onDelete={handleDelete}
              deleting={deleting}
              isReorderMode={isReorderMode}
              reorderParentId={reorderParentId}
              reorderValues={reorderValues}
              onStartReorder={handleStartReorder}
              onStartProductReorder={handleStartProductReorder}
              onReorderValueChange={handleReorderValueChange}
              onSaveReorder={handleSaveReorder}
              onCancelReorder={handleCancelReorder}
              reorderSaving={reorderSaving}
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

      {/* Root reorder modal */}
      <Modal
        open={reorderParentId === '__roots__'}
        onClose={handleCancelReorder}
      >
        <div style={{ padding: '16px 0', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`${styles.controlBtn} ${modalType === 'machine' ? styles.controlBtnActive : ''}`}
            onClick={() => handleModalTypeToggle('machine')}
          >
            <Wrench size={14} />
            حسب الآلة
          </button>
          <button
            type="button"
            className={`${styles.controlBtn} ${modalType === 'restaurant' ? styles.controlBtnActive : ''}`}
            onClick={() => handleModalTypeToggle('restaurant')}
          >
            <UtensilsCrossed size={14} />
            حسب المطعم
          </button>
        </div>
        <ReorderEditor
          parent={{
            id: '__roots__',
            name: { ar: 'التصنيفات الرئيسية', en: 'Main Categories' },
            level: 0,
          }}
          childrenList={categories.filter((c) => c.level === 0 && c.categoryType === modalType)}
          reorderValues={reorderValues}
          onValueChange={handleReorderValueChange}
          onSave={() => handleSaveReorder('__roots__')}
          onCancel={handleCancelReorder}
          saving={reorderSaving}
        />
      </Modal>

      {/* Product reorder modal */}
      <Modal
        open={productReorderCategoryId !== null && !productReorderLoading}
        onClose={handleCancelProductReorder}
      >
        {productReorderLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <ProductReorderEditor
            products={productReorderProducts}
            reorderValues={productReorderValues}
            onValueChange={handleProductReorderValueChange}
            onSave={handleSaveProductReorder}
            onCancel={handleCancelProductReorder}
            saving={productReorderSaving}
          />
        )}
      </Modal>

      {/* Note */}
      <div className={styles.note}>
        <strong>ملاحظة:</strong> عند حذف تصنيف أب، تبقى التصنيفات الفرعية المرتبطة بآباء آخرين كما هي.
      </div>
    </div>
  );
}
