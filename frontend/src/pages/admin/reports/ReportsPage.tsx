import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Cog,
  Users,
  User,
  FileText,
  Download,
  Upload,
  Wrench,
  Truck,
  Search,
  MonitorCog,
  Factory,
  Phone,
  ClipboardList,
  Boxes,
} from 'lucide-react';
import { serviceOrdersService } from '../../../shared/api/services';
import type {
  ApiServiceOrder,
  ApiServiceOrderStatus,
  ReportByTechnician,
} from '../../../shared/api/types';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import styles from './ReportsPage.module.css';

type TabKey = 'machine' | 'technician' | 'customer';

const TECH_STATUS_LABEL: Record<string, string> = {
  available: 'متاح',
  on_task: 'على مهمة',
  off_duty: 'خارج الدوام',
};

const ORDER_STATUS_LABEL: Record<ApiServiceOrderStatus, string> = {
  waiting: 'بانتظار الصيانة',
  in_maintenance: 'قيد الصيانة',
  postponed: 'مؤجل',
  ready: 'جاهز للتسليم',
  delivered: 'تم التسليم',
};

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getMachineName(order: ApiServiceOrder): string {
  if (order.machineType && typeof order.machineType === 'object') {
    return order.machineType.name || order.machineDetails || '—';
  }
  return order.machineDetails || '—';
}

const maintenanceReports = [
  {
    path: '/admin/maintenance/service-orders/receive',
    label: 'وصل استلام آلة للزبون',
    hint: 'طباعة وصل استلام من أوامر الخدمة',
    icon: Download,
  },
  {
    path: '/admin/maintenance/machine-delivery',
    label: 'وصل تسليم آلة للزبون',
    hint: 'سجل تسليم الآلات للزبائن',
    icon: Upload,
  },
  {
    path: '/admin/maintenance/service-orders?status=in_maintenance',
    label: 'الآلات بالصيانة',
    hint: 'الطلبات الموجودة قيد الصيانة',
    icon: Wrench,
  },
  {
    path: '/admin/customers',
    label: 'كشف حساب زبون',
    hint: 'بيانات الزبائن وحركاتهم',
    icon: Users,
  },
  {
    path: '/admin/suppliers',
    label: 'كشف حساب مورد',
    hint: 'متابعة الموردين والالتزامات',
    icon: Truck,
  },
  {
    path: '/admin/hr/employees',
    label: 'كشف حساب موظف',
    hint: 'بيانات الموظفين والفنيين',
    icon: User,
  },
  {
    path: '/admin/inventory',
    label: 'قائمة المخزون',
    hint: 'عرض حالة المواد والمستودع',
    icon: Boxes,
  },
  {
    path: '/admin/maintenance/machine-reception',
    label: 'استلام آلة',
    hint: 'مهام الاستلام اليومية',
    icon: Download,
  },
  {
    path: '/admin/maintenance/machine-delivery',
    label: 'تسليم آلة',
    hint: 'مهام التسليم اليومية',
    icon: Upload,
  },
  {
    path: '/admin/maintenance/machine-inspection',
    label: 'فحص الآلة',
    hint: 'تقارير فحص الآلات',
    icon: Search,
  },
  {
    path: '/admin/maintenance/machine-maintenance',
    label: 'صيانة الآلة',
    hint: 'متابعة أعمال الصيانة',
    icon: Wrench,
  },
  {
    path: '/admin/maintenance/machine-installation',
    label: 'تنصيب الآلة',
    hint: 'تقارير التنصيب بالموقع',
    icon: MonitorCog,
  },
  {
    path: '/admin/maintenance/transport',
    label: 'نقل الآلة',
    hint: 'سجلات النقل والحركة',
    icon: Truck,
  },
  {
    path: '/admin/maintenance/machine-production',
    label: 'انتاج آلة',
    hint: 'عمليات الإنتاج المرتبطة بالصيانة',
    icon: Factory,
  },
  {
    path: '/admin/maintenance/customer-calls',
    label: 'اتصال هاتفي من زبون',
    hint: 'متابعة اتصالات وملاحظات الزبائن',
    icon: Phone,
  },
  {
    path: '/admin/maintenance/tasks',
    label: 'جميع المهام',
    hint: 'عرض كل مهام الصيانة',
    icon: ClipboardList,
  },
];

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
  const [selectedTechnician, setSelectedTechnician] =
    useState<ReportByTechnician | null>(null);
  const [selectedTechnicianOrders, setSelectedTechnicianOrders] = useState<
    ApiServiceOrder[]
  >([]);
  const [selectedTechnicianLoading, setSelectedTechnicianLoading] =
    useState(false);
  const [selectedTechnicianError, setSelectedTechnicianError] = useState<
    string | null
  >(null);

  const loadTechnicianDetails = useCallback(async (technician: ReportByTechnician) => {
    setSelectedTechnician(technician);
    setSelectedTechnicianError(null);
    setSelectedTechnicianLoading(true);

    try {
      const orders = await serviceOrdersService.getByTechnician(
        technician.technicianId,
      );

      const sortedOrders = [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setSelectedTechnicianOrders(sortedOrders);
    } catch (e) {
      setSelectedTechnicianError(e instanceof Error ? e.message : String(e));
      setSelectedTechnicianOrders([]);
    } finally {
      setSelectedTechnicianLoading(false);
    }
  }, []);
    
  useEffect(() => {
    fetchReportByMachine();
    fetchReportByTechnician();
    fetchReportByCustomer();
  }, [fetchReportByMachine, fetchReportByTechnician, fetchReportByCustomer]);

  useEffect(() => {
    if (tab !== 'technician') return;

    if (reportByTechnician.length === 0) {
      setSelectedTechnician(null);
      setSelectedTechnicianOrders([]);
      setSelectedTechnicianError(null);
      return;
    }

    if (!selectedTechnician) {
      void loadTechnicianDetails(reportByTechnician[0]);
      return;
    }

    const updated = reportByTechnician.find(
      (item) => item.technicianId === selectedTechnician.technicianId,
    );

    if (!updated) {
      void loadTechnicianDetails(reportByTechnician[0]);
      return;
    }

    if (
      updated.count !== selectedTechnician.count ||
      updated.completed !== selectedTechnician.completed ||
      updated.technicianName !== selectedTechnician.technicianName ||
      updated.technicianStatus !== selectedTechnician.technicianStatus ||
      updated.phone !== selectedTechnician.phone ||
      updated.email !== selectedTechnician.email
    ) {
      setSelectedTechnician(updated);
    }
  }, [
    tab,
    reportByTechnician,
    selectedTechnician,
    loadTechnicianDetails,
  ]);

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
            تقارير الصيانة
          </h1>
          <p className={styles.pageSubtitle}>
            مركز التقارير داخل قسم الصيانة + تقارير أوامر الخدمة التحليلية
          </p>
        </div>
      </div>

      <div className={styles.shortcutsSection}>
        <h2 className={styles.sectionTitle}>التقارير المطلوبة</h2>
        <div className={styles.shortcutsGrid}>
          {maintenanceReports.map((item) => (
            <Link key={item.label} to={item.path} className={styles.shortcutCard}>
              <div className={styles.shortcutIcon}>
                <item.icon size={18} />
              </div>
              <div className={styles.shortcutContent}>
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </div>
            </Link>
          ))}
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
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الفني</th>
                  <th>حالة الفني</th>
                  <th>عدد الأوامر</th>
                  <th>منجز</th>
                  <th style={{ width: '30%' }}>نسبة</th>
                  <th>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {reportByTechnician.map((r, i) => {
                  const isActive =
                    selectedTechnician?.technicianId === r.technicianId;

                  return (
                    <tr
                      key={r.technicianId || r._id || i}
                      className={isActive ? styles.techRowActive : styles.techRow}
                    >
                      <td className={styles.tableNumber}>{i + 1}</td>
                      <td className={styles.tableName}>{r.technicianName || 'غير معيّن'}</td>
                      <td>{TECH_STATUS_LABEL[r.technicianStatus || ''] || 'غير محدد'}</td>
                      <td className={styles.tableNumber}>{r.count}</td>
                      <td className={styles.tableNumber}>{r.completed}</td>
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
                      <td>
                        <button
                          type="button"
                          className={styles.detailsBtn}
                          onClick={() => void loadTechnicianDetails(r)}
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {reportByTechnician.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className={styles.emptyState}>
                        <FileText size={36} />
                        <p>لا يوجد فنيين في النظام</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedTechnician && (
            <div className={styles.techDetailsCard}>
              <div className={styles.techDetailsHeader}>
                <div>
                  <h3 className={styles.techDetailsTitle}>
                    تفاصيل الفني: {selectedTechnician.technicianName}
                  </h3>
                  <p className={styles.techDetailsMeta}>
                    كود الموظف: {selectedTechnician.customId || '—'} | الحالة:{' '}
                    {TECH_STATUS_LABEL[selectedTechnician.technicianStatus || ''] ||
                      'غير محدد'}{' '}
                    | الهاتف: {selectedTechnician.phone || '—'} | البريد:{' '}
                    {selectedTechnician.email || '—'}
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.techReloadBtn}
                  onClick={() => void loadTechnicianDetails(selectedTechnician)}
                >
                  تحديث
                </button>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.summaryBadge}>
                  إجمالي الأوامر: {selectedTechnician.count}
                </span>
                <span className={styles.summaryBadge}>
                  أوامر منجزة: {selectedTechnician.completed}
                </span>
                <span className={styles.summaryBadge}>
                  أوامر غير منجزة:{' '}
                  {Math.max(0, selectedTechnician.count - selectedTechnician.completed)}
                </span>
              </div>

              {selectedTechnicianError && (
                <div className={styles.errorBanner}>⚠️ {selectedTechnicianError}</div>
              )}

              {selectedTechnicianLoading ? (
                <div className={styles.detailsLoading}>
                  <LoadingSpinner />
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>رقم الطلب</th>
                        <th>الآلة</th>
                        <th>الزبون</th>
                        <th>الحالة</th>
                        <th>تاريخ الاستلام</th>
                        <th>تفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTechnicianOrders.map((order) => (
                        <tr key={order._id}>
                          <td className={styles.tableNumber}>#{order.formNumber}</td>
                          <td>{getMachineName(order)}</td>
                          <td>{order.customerName || '—'}</td>
                          <td>{ORDER_STATUS_LABEL[order.status] || order.status}</td>
                          <td>{formatShortDate(order.receptionDate || order.createdAt)}</td>
                          <td>
                            <Link
                              to={`/admin/maintenance/service-orders/${order._id}`}
                              className={styles.orderLink}
                            >
                              فتح
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {selectedTechnicianOrders.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className={styles.emptyState}>
                              <FileText size={36} />
                              <p>لا توجد أوامر خدمة لهذا الفني حالياً</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
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
