import { Package, Grid3X3, TrendingUp, Eye, ShoppingCart, Wrench, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../../shared/hooks/useProducts';
import { useCategories } from '../../../shared/hooks/useCategories';
import { useCartStore } from '../../../shared/store/cartStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories(true);
  const totalCartItems = useCartStore((s) => s.totalItems());

  const loading = productsLoading || categoriesLoading;

  const stats = [
    {
      label: 'المنتجات',
      value: products.length,
      icon: Package,
      color: '#3b82f6',
      bg: '#eff6ff',
      link: '/admin/products',
    },
    {
      label: 'التصنيفات',
      value: categories.length,
      icon: Grid3X3,
      color: '#10b981',
      bg: '#ecfdf5',
      link: '/admin/categories',
    },
    {
      label: 'طلبات السلة',
      value: totalCartItems,
      icon: ShoppingCart,
      color: '#8b5cf6',
      bg: '#f5f3ff',
      link: '/admin/products',
    },
  ];

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>لوحة التحكم</h1>
        <p className={styles.pageSubtitle}>مرحباً بك! هنا نظرة عامة على موقعك</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <Link to={stat.link} key={stat.label} className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: stat.bg, color: stat.color }}
            >
              <stat.icon size={24} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Module Cards — Sections */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>الأقسام</h2>
        <div className={styles.modulesGrid}>
          <Link to="/admin/maintenance" className={styles.moduleCard}>
            <div className={styles.moduleIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>
              <Wrench size={32} />
            </div>
            <div className={styles.moduleInfo}>
              <span>الصيانة</span>
              <p>إدارة مهام الصيانة، الفنيين، أوامر الخدمة، والمحاسبة</p>
            </div>
          </Link>
          <Link to="/admin/hr" className={styles.moduleCard}>
            <div className={styles.moduleIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Users size={32} />
            </div>
            <div className={styles.moduleInfo}>
              <span>الموارد البشرية</span>
              <p>إدارة الموظفين وصلاحيات الوصول للنظام</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>إجراءات سريعة</h2>
        <div className={styles.quickActions}>
          <Link to="/admin/products" className={styles.actionCard}>
            <Package size={24} />
            <span>إدارة المنتجات</span>
            <p>إضافة، تعديل أو حذف المنتجات</p>
          </Link>
          <Link to="/admin/categories" className={styles.actionCard}>
            <Grid3X3 size={24} />
            <span>إدارة التصنيفات</span>
            <p>ترتيب وإدارة تصنيفات المنتجات</p>
          </Link>
          <Link to="/admin/settings" className={styles.actionCard}>
            <TrendingUp size={24} />
            <span>الإعدادات</span>
            <p>إعدادات الموقع ومعلومات التواصل</p>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className={styles.actionCard}>
            <Eye size={24} />
            <span>عرض الموقع</span>
            <p>افتح الموقع في تبويب جديد</p>
          </a>
        </div>
      </div>

      {/* Recent Products */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>أحدث المنتجات</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>التصنيف</th>
                <th>السعر</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 6).map((product) => {
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
                          <div className={styles.productSlug}>{product.description.ar}</div>
                        </div>
                      </div>
                    </td>
                    <td>{cats.length > 0 ? cats.map((c) => c!.name.ar).join('، ') : '—'}</td>
                    <td className={styles.priceCell}>
                      {product.price.toLocaleString()} {product.currency}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          product.inStock ? styles.statusInStock : styles.statusOutOfStock
                        }`}
                      >
                        {product.inStock ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
