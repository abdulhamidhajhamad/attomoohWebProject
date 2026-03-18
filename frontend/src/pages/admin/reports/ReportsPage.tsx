import { useEffect, useState } from 'react';
import { BarChart3, Cog, Users, User, FileText } from 'lucide-react';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import styles from './ReportsPage.module.css';

type TabKey = 'machine' | 'technician' | 'customer';

export default function ReportsPage() {
  const {
    reportByMachine,
    reportByTechnician,
    reportByCustomer,
    loading,
    error,
    fetchReportByMachine,
    fetchReportByTechnician,
    fetchReportByCustomer,
  } = useServiceOrdersStore();

  const [tab, setTab] = useState<TabKey>('machine');
    
  useEffect(() => {
    fetchReportByMachine();
    fetchReportByTechnician();
    fetchReportByCustomer();
  }, [fetchReportByMachine, fetchReportByTechnician, fetchReportByCustomer]);

  const maxMachine = Math.max(1, ...reportByMachine.map((r) => r.count));
  const maxTech = Math.max(1, ...reportByTechnician.map((r) => r.count));
  const maxCustomer = Math.max(1, ...reportByCustomer.map((r) => r.count));

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <BarChart3 size={24} />
            التقارير
          </h1>
          <p className={styles.pageSubtitle}>
            تقارير أوامر الخدمة حسب الآلة والفني والزبون
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'machine' ? styles.tabActive : ''}`}
          onClick={() => setTab('machine')}
        >
          <Cog size={18} />
          حسب نوع الآلة
        </button>
        <button
          className={`${styles.tab} ${tab === 'technician' ? styles.tabActive : ''}`}
          onClick={() => setTab('technician')}
        >
          <User size={18} />
          حسب الفني
        </button>
        <button
          className={`${styles.tab} ${tab === 'customer' ? styles.tabActive : ''}`}
          onClick={() => setTab('customer')}
        >
          <Users size={18} />
          حسب الزبون
        </button>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <LoadingSpinner />
        </div>
      )}

      {/* Machine Type Report */}
      {tab === 'machine' && !loading && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>نوع الآلة</th>
                <th>عدد الأوامر</th>
                <th style={{ width: '40%' }}>نسبة</th>
              </tr>
            </thead>
            <tbody>
              {reportByMachine.map((r, i) => (
                <tr key={r._id || i}>
                  <td className={styles.tableNumber}>{i + 1}</td>
                  <td className={styles.tableName}>{r.machineTypeName || 'غير محدد'}</td>
                  <td className={styles.tableNumber}>{r.count}</td>
                  <td>
                    <div className={styles.barCell}>
                      <div
                        className={styles.bar}
                        style={{ width: `${(r.count / maxMachine) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {reportByMachine.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <FileText size={36} />
                      <p>لا توجد بيانات</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Technician Report */}
      {tab === 'technician' && !loading && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>الفني</th>
                <th>عدد الأوامر</th>
                <th style={{ width: '40%' }}>نسبة</th>
              </tr>
            </thead>
            <tbody>
              {reportByTechnician.map((r, i) => (
                <tr key={r._id || i}>
                  <td className={styles.tableNumber}>{i + 1}</td>
                  <td className={styles.tableName}>{r.technicianName || 'غير معيّن'}</td>
                  <td className={styles.tableNumber}>{r.count}</td>
                  <td>
                    <div className={styles.barCell}>
                      <div
                        className={styles.bar}
                        style={{
                          width: `${(r.count / maxTech) * 100}%`,
                          background: '#3b82f6',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {reportByTechnician.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <FileText size={36} />
                      <p>لا توجد بيانات</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Report */}
      {tab === 'customer' && !loading && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>الزبون</th>
                <th>عدد الأوامر</th>
                <th style={{ width: '40%' }}>نسبة</th>
              </tr>
            </thead>
            <tbody>
              {reportByCustomer.map((r, i) => (
                <tr key={r._id || i}>
                  <td className={styles.tableNumber}>{i + 1}</td>
                  <td className={styles.tableName}>{r.customerName || 'غير محدد'}</td>
                  <td className={styles.tableNumber}>{r.count}</td>
                  <td>
                    <div className={styles.barCell}>
                      <div
                        className={styles.bar}
                        style={{
                          width: `${(r.count / maxCustomer) * 100}%`,
                          background: '#10b981',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {reportByCustomer.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className={styles.emptyState}>
                      <FileText size={36} />
                      <p>لا توجد بيانات</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
