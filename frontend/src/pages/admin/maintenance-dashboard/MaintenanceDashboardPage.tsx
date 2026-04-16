import {
  ClipboardList,
  Users,
  Download,
  Upload,
  Search,
  Wrench,
  MonitorCog,
  Factory,
  Truck,
  Phone,
  CalendarClock,
  Receipt,
  ShoppingCart,
  Cog,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './MaintenanceDashboard.module.css';

const quickActions = [
  { path: '/admin/maintenance/tasks', label: 'مهام الصيانة', desc: 'عرض وإدارة مهام الصيانة', icon: ClipboardList, color: '#3b82f6', bg: '#eff6ff' },
  { path: '/admin/maintenance/technicians', label: 'الفنيين', desc: 'إدارة فريق الفنيين', icon: Users, color: '#10b981', bg: '#ecfdf5' },
  { path: '/admin/maintenance/service-orders', label: 'أوامر الخدمة', desc: 'استلام وتتبع أوامر الخدمة', icon: ClipboardList, color: '#8b5cf6', bg: '#f5f3ff' },
  { path: '/admin/maintenance/machine-types', label: 'أنواع الآلات', desc: 'تعريف أنواع الآلات', icon: Cog, color: '#f59e0b', bg: '#fffbeb' },
];

const taskTypes = [
  { path: '/admin/maintenance/machine-reception', label: 'استلام آلة', icon: Download },
  { path: '/admin/maintenance/machine-delivery', label: 'تسليم آلة', icon: Upload },
  { path: '/admin/maintenance/machine-inspection', label: 'فحص آلة', icon: Search },
  { path: '/admin/maintenance/machine-maintenance', label: 'صيانة آلة', icon: Wrench },
  { path: '/admin/maintenance/machine-installation', label: 'تنصيب آلة', icon: MonitorCog },
  { path: '/admin/maintenance/machine-production', label: 'إنتاج آلة', icon: Factory },
  { path: '/admin/maintenance/transport', label: 'نقل', icon: Truck },
  { path: '/admin/maintenance/customer-calls', label: 'اتصال هاتفي', icon: Phone },
  { path: '/admin/maintenance/maintenance-schedule', label: 'جدولة صيانة', icon: CalendarClock },
];

const accountingItems = [
  { path: '/admin/maintenance/financial-documents', label: 'المستندات المالية', desc: 'إدارة المستندات المالية للصيانة', icon: Receipt, color: '#ef4444', bg: '#fef2f2' },
  { path: '/admin/maintenance/purchase-orders', label: 'طلبات المشتريات', desc: 'طلبات الشراء والتوريد', icon: ShoppingCart, color: '#06b6d4', bg: '#ecfeff' },
];

export default function MaintenanceDashboardPage() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>قسم الصيانة</h1>
          <p className={styles.pageSubtitle}>إدارة مهام الصيانة والفنيين والمحاسبة</p>
        </div>
        <Link to="/admin/maintenance/reports" className={styles.reportsCta}>
          <BarChart3 size={18} />
          التقارير
        </Link>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>إجراءات سريعة</h2>
        <div className={styles.quickActions}>
          {quickActions.map((item) => (
            <Link key={item.path} to={item.path} className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ background: item.bg, color: item.color }}>
                <item.icon size={24} />
              </div>
              <span>{item.label}</span>
              <p>{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Task Types */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>المهام</h2>
        <div className={styles.taskGrid}>
          {taskTypes.map((item) => (
            <Link key={item.path} to={item.path} className={styles.taskCard}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Accounting */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>المحاسبة</h2>
        <div className={styles.quickActions}>
          {accountingItems.map((item) => (
            <Link key={item.path} to={item.path} className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ background: item.bg, color: item.color }}>
                <item.icon size={24} />
              </div>
              <span>{item.label}</span>
              <p>{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
