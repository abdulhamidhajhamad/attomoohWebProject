import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Package, Eye } from 'lucide-react';
import { useProducts, invalidateProductsCache } from '../../../shared/hooks/useProducts';
import { useCategories } from '../../../shared/hooks/useCategories';
import { productsService } from '../../../shared/api/services';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import styles from './AdminProducts.module.css';

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const { products, loading, error, refetch } = useProducts();
  const { categories } = useCategories();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.ar.includes(debouncedSearchQuery) ||
        p.name.en.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.categoryIds.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearchQuery, selectedCategory]);

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    setDeleting(productId);
    try {
      await productsService.delete(productId);
      invalidateProductsCache();
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل في حذف المنتج');
    } finally {
      setDeleting(null);
    }
  }, [refetch]);

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة المنتجات</h1>
          <p className={styles.pageSubtitle}>{products.length} منتج</p>
        </div>
        <Link to="/admin/products/add" className={styles.addBtn}>
          <Plus size={18} />
          إضافة منتج
        </Link>
      </div>

      {error && (
        <div style={{ padding: 16, color: '#ef4444', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">جميع التصنيفات</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name.ar}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>البراند</th>
              <th>التصنيف</th>
              <th>السعر</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const cats = product.categoryIds.map((cId) => categories.find((c) => c.id === cId)).filter(Boolean);
              return (
                <tr key={product.id}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.productThumb}>
                        {product.images[0] ? (
                          <img src={product.images[0]} alt="" />
                        ) : (
                          <Package size={18} />
                        )}
                      </div>
                      <div>
                        <div className={styles.productName}>{product.name.ar}</div>
                        <div className={styles.productNameEn}>{product.name.en}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>{product.brand || '—'}</span>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>
                      {cats.length > 0 ? cats.map((c) => c!.name.ar).join('، ') : '—'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.priceInfo}>
                      <span className={styles.price}>
                        {product.price.toLocaleString()} {product.currency}
                      </span>
                      {product.originalPrice && (
                        <span className={styles.oldPrice}>
                          {product.originalPrice.toLocaleString()} {product.currency}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        product.inStock ? styles.inStock : styles.outOfStock
                      }`}
                    >
                      {product.inStock ? 'متوفر' : 'غير متوفر'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <a
                        href={`/products/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        title="عرض"
                      >
                        <Eye size={16} />
                      </a>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        title="تعديل"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        title="حذف"
                        disabled={deleting === product.id}
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>
            <Package size={40} />
            <p>لا توجد منتجات مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.note}>
        <strong>ملاحظة:</strong> البيانات تُجلب مباشرة من قاعدة البيانات عبر الـ API.
      </div>
    </div>
  );
}
