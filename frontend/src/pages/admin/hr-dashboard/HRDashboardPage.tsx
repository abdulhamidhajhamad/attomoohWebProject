import { Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './HRDashboard.module.css';

const quickActions = [
  { path: '/admin/hr/employees', label: 'إدارة الموظفين', desc: 'عرض وإدارة جميع الموظفين', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
  { path: '/admin/hr/employees', label: 'إضافة موظف جديد', desc: 'تسجيل موظف جديد في النظام', icon: UserPlus, color: '#10b981', bg: '#ecfdf5' },
];

export default function HRDashboardPage() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>الموارد البشرية</h1>
        <p className={styles.pageSubtitle}>إدارة الموظفين وصلاحيات الوصول للنظام</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>إجراءات سريعة</h2>
        <div className={styles.quickActions}>
          {quickActions.map((item) => (
            <Link key={item.label} to={item.path} className={styles.actionCard}>
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
