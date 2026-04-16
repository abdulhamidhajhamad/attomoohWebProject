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
import { customersService, serviceOrdersService } from '../../../shared/api/services';
import type {
  ApiCustomer,
  ApiServiceOrder,
  ApiServiceOrderStatus,
  ApiTechnicianTaskDetails,
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

const TASK_TYPE_LABEL: Record<string, string> = {
  inspection: 'فحص',
  maintenance: 'صيانة',
  installation: 'تنصيب',
  production: 'إنتاج',
};

const TASK_STATUS_LABEL: Record<string, string> = {
  assigned: 'مُعيّن',
  waiting: 'بانتظار التنفيذ',
  in_progress: 'قيد التنفيذ',
  in_maintenance: 'قيد الصيانة',
  postponed: 'مؤجل',
  ready: 'جاهز',
  delivered: 'تم التسليم',
  rejected: 'مرفوض',
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

function getTechnicianTaskMachineName(task: ApiTechnicianTaskDetails): string {
  const name = (task.machineName || '').trim();
  const details = (task.machineDetails || '').trim();

  if (name && details && name !== details) {
    return `${name} - ${details}`;
  }

  return name || details || '—';
}

function getTechnicianTaskCustomerName(task: ApiTechnicianTaskDetails): string {
  const reception = task.machineReception;
  if (!reception || typeof reception !== 'object') return '—';

  const receptionCustomer = (reception as { customer?: unknown }).customer;
  if (
    receptionCustomer &&
    typeof receptionCustomer === 'object' &&
    'name' in receptionCustomer &&
    typeof (receptionCustomer as { name?: unknown }).name === 'string'
  ) {
    return ((receptionCustomer as { name: string }).name || '').trim() || '—';
  }

  const fallbackName =
    (reception as { customerName?: string }).customerName || '';
  return fallbackName.trim() || '—';
}

function formatMoney(value: number): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';

  return amount.toLocaleString('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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
    ApiTechnicianTaskDetails[]
  >([]);
  const [selectedTechnicianLoading, setSelectedTechnicianLoading] =
    useState(false);
  const [selectedTechnicianError, setSelectedTechnicianError] = useState<
    string | null
  >(null);
  const [systemCustomers, setSystemCustomers] = useState<ApiCustomer[]>([]);
  const [systemCustomersLoading, setSystemCustomersLoading] = useState(false);
  const [systemCustomersError, setSystemCustomersError] = useState<
    string | null
  >(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<
    ApiServiceOrder[]
  >([]);
  const [selectedCustomerLoading, setSelectedCustomerLoading] = useState(false);
  const [selectedCustomerError, setSelectedCustomerError] = useState<
    string | null
  >(null);

  const loadTechnicianDetails = useCallback(async (technician: ReportByTechnician) => {
    setSelectedTechnician(technician);
    setSelectedTechnicianError(null);
    setSelectedTechnicianLoading(true);

    try {
      const tasks = await serviceOrdersService.getTechnicianTasks(
        technician.technicianId,
      );

      const sortedTasks = [...tasks].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setSelectedTechnicianOrders(sortedTasks);
    } catch (e) {
      setSelectedTechnicianError(e instanceof Error ? e.message : String(e));
      setSelectedTechnicianOrders([]);
    } finally {
      setSelectedTechnicianLoading(false);
    }
  }, []);

  const loadSystemCustomers = useCallback(async () => {
    setSystemCustomersError(null);
    setSystemCustomersLoading(true);

    try {
      const customers = await customersService.getAll();
      const sorted = [...customers].sort((a, b) =>
        a.name.localeCompare(b.name, 'ar'),
      );
      setSystemCustomers(sorted);
    } catch (e) {
      setSystemCustomersError(e instanceof Error ? e.message : String(e));
      setSystemCustomers([]);
    } finally {
      setSystemCustomersLoading(false);
    }
  }, []);

  const loadCustomerDetails = useCallback(async (customer: ApiCustomer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerError(null);
    setSelectedCustomerLoading(true);

    try {
      const orders = await serviceOrdersService.getByCustomer(customer._id);
      const sortedOrders = [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setSelectedCustomerOrders(sortedOrders);
    } catch (e) {
      setSelectedCustomerError(e instanceof Error ? e.message : String(e));
      setSelectedCustomerOrders([]);
    } finally {
      setSelectedCustomerLoading(false);
    }
  }, []);
    
  useEffect(() => {
    fetchReportByMachine();
    fetchReportByTechnician();
    fetchReportByCustomer();
  }, [fetchReportByMachine, fetchReportByTechnician, fetchReportByCustomer]);

  useEffect(() => {
    void loadSystemCustomers();
  }, [loadSystemCustomers]);

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
      updated.technicianTotalCost !== selectedTechnician.technicianTotalCost ||
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

  useEffect(() => {
    if (tab !== 'customer') return;

    if (systemCustomers.length === 0) {
      setSelectedCustomer(null);
      setSelectedCustomerOrders([]);
      setSelectedCustomerError(null);
      return;
    }

    if (!selectedCustomer) {
      void loadCustomerDetails(systemCustomers[0]);
      return;
    }

    const updated = systemCustomers.find((item) => item._id === selectedCustomer._id);

    if (!updated) {
      void loadCustomerDetails(systemCustomers[0]);
      return;
    }

    if (updated !== selectedCustomer) {
      setSelectedCustomer(updated);
    }
  }, [
    tab,
    systemCustomers,
    selectedCustomer,
    loadCustomerDetails,
  ]);

  const maxMachine = Math.max(1, ...reportByMachine.map((r) => r.count));
  const maxTech = Math.max(1, ...reportByTechnician.map((r) => r.count));
  const totalSystemMachines = reportByMachine.reduce(
    (sum, row) => sum + row.count,
    0,
  );
  const totalTechniciansCost = reportByMachine.reduce(
    (sum, row) => sum + (row.technicianTotalCost ?? 0),
    0,
  );
  const totalCompanyCost = reportByMachine.reduce(
    (sum, row) => sum + (row.companyTotalCost ?? 0),
    0,
  );
  const customerCountById = new Map(
    reportByCustomer.map((row) => [row.customerId, row.count]),
  );

  const customerRows = systemCustomers
    .map((customer) => ({
      customer,
      count: customerCountById.get(customer._id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.customer.name.localeCompare(b.customer.name, 'ar'));

  const maxCustomer = Math.max(1, ...customerRows.map((row) => row.count));
  const totalTechnicianCostInReport = reportByTechnician.reduce(
    (sum, row) => sum + (row.technicianTotalCost ?? 0),
    0,
  );

  const selectedCustomerWarrantyCount = selectedCustomerOrders.filter(
    (order) => order.warranty,
  ).length;
  const selectedCustomerDeliveredCount = selectedCustomerOrders.filter(
    (order) => order.status === 'delivered',
  ).length;
  const selectedCustomerActiveCount = selectedCustomerOrders.filter((order) =>
    ['waiting', 'in_maintenance', 'postponed'].includes(order.status),
  ).length;
  const selectedTechnicianTasksCost = selectedTechnicianOrders.reduce(
    (sum, task) => sum + (task.technicianFee ?? 0),
    0,
  );
  const selectedTechnicianCompanyCost = selectedTechnicianOrders.reduce(
    (sum, task) => sum + (task.companyFee ?? 0),
    0,
  );

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
        <>
          <div className={styles.summaryRow}>
            <span className={styles.summaryBadge}>
              عدد الآلات المدخلة في النظام: {totalSystemMachines}
            </span>
            <span className={styles.summaryBadge}>
              تكلفة الفنيين الكلية: {formatMoney(totalTechniciansCost)}
            </span>
            <span className={styles.summaryBadge}>
              تكلفة الشركة الكلية: {formatMoney(totalCompanyCost)}
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>نوع الآلة</th>
                  <th>عدد الآلات</th>
                  <th>تكلفة الفنيين الكلية</th>
                  <th>تكلفة الشركة الكلية</th>
                  <th style={{ width: '24%' }}>نسبة</th>
                </tr>
              </thead>
              <tbody>
                {reportByMachine.map((r, i) => (
                  <tr key={r.machineTypeId || r._id || i}>
                    <td className={styles.tableNumber}>{i + 1}</td>
                    <td className={styles.tableName}>{r.machineTypeName || 'غير محدد'}</td>
                    <td className={styles.tableNumber}>{r.count}</td>
                    <td className={styles.tableNumber}>{formatMoney(r.technicianTotalCost ?? 0)}</td>
                    <td className={styles.tableNumber}>{formatMoney(r.companyTotalCost ?? 0)}</td>
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
                    <td colSpan={6}>
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
        </>
      )}

      {/* Technician Report */}
      {tab === 'technician' && !loading && (
        <>
          <div className={styles.summaryRow}>
            <span className={styles.summaryBadge}>
              تكلفة الفنيين الكلية: {formatMoney(totalTechnicianCostInReport)}
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الفني</th>
                  <th>حالة الفني</th>
                  <th>عدد المهام</th>
                  <th>منجز</th>
                  <th>تكلفة الفني الكلية</th>
                  <th style={{ width: '20%' }}>نسبة</th>
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
                      <td className={styles.tableNumber}>{formatMoney(r.technicianTotalCost ?? 0)}</td>
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
                    <td colSpan={8}>
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
                  إجمالي المهام: {selectedTechnician.count}
                </span>
                <span className={styles.summaryBadge}>
                  مهام منجزة: {selectedTechnician.completed}
                </span>
                <span className={styles.summaryBadge}>
                  مهام غير منجزة:{' '}
                  {Math.max(0, selectedTechnician.count - selectedTechnician.completed)}
                </span>
                <span className={styles.summaryBadge}>
                  تكلفة الفني الكلية: {formatMoney(selectedTechnicianTasksCost)}
                </span>
                <span className={styles.summaryBadge}>
                  تكلفة الشركة الكلية: {formatMoney(selectedTechnicianCompanyCost)}
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
                        <th>نوع العملية</th>
                        <th>الآلة</th>
                        <th>الزبون</th>
                        <th>الحالة</th>
                        <th>أجرة الفني</th>
                        <th>أجرة الشركة</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTechnicianOrders.map((task) => (
                        <tr key={task._id}>
                          <td>{TASK_TYPE_LABEL[task.taskType] || task.taskType}</td>
                          <td>{getTechnicianTaskMachineName(task)}</td>
                          <td>{getTechnicianTaskCustomerName(task)}</td>
                          <td>{TASK_STATUS_LABEL[task.status] || task.status}</td>
                          <td className={styles.tableNumber}>{formatMoney(task.technicianFee ?? 0)}</td>
                          <td className={styles.tableNumber}>{formatMoney(task.companyFee ?? 0)}</td>
                          <td>{formatShortDate(task.date || task.createdAt)}</td>
                        </tr>
                      ))}

                      {selectedTechnicianOrders.length === 0 && (
                        <tr>
                          <td colSpan={7}>
                            <div className={styles.emptyState}>
                              <FileText size={36} />
                              <p>لا توجد مهام لهذا الفني حالياً</p>
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
        <>
          {systemCustomersError && (
            <div className={styles.errorBanner}>⚠️ {systemCustomersError}</div>
          )}

          {systemCustomersLoading ? (
            <div className={styles.detailsLoading}>
              <LoadingSpinner />
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الزبون</th>
                    <th>الهاتف</th>
                    <th>عدد الأوامر</th>
                    <th style={{ width: '30%' }}>نسبة</th>
                    <th>التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {customerRows.map((row, i) => {
                    const isActive = selectedCustomer?._id === row.customer._id;

                    return (
                      <tr
                        key={row.customer._id}
                        className={isActive ? styles.techRowActive : styles.techRow}
                      >
                        <td className={styles.tableNumber}>{i + 1}</td>
                        <td className={styles.tableName}>{row.customer.name || 'غير محدد'}</td>
                        <td>{row.customer.phone || '—'}</td>
                        <td className={styles.tableNumber}>{row.count}</td>
                        <td>
                          <div className={styles.barCell}>
                            <div
                              className={styles.bar}
                              style={{
                                width: `${(row.count / maxCustomer) * 100}%`,
                                background: '#10b981',
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.detailsBtn}
                            onClick={() => void loadCustomerDetails(row.customer)}
                          >
                            عرض
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {customerRows.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyState}>
                          <FileText size={36} />
                          <p>لا يوجد زبائن في النظام</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedCustomer && !systemCustomersLoading && (
            <div className={styles.techDetailsCard}>
              <div className={styles.techDetailsHeader}>
                <div>
                  <h3 className={styles.techDetailsTitle}>
                    تفاصيل الزبون: {selectedCustomer.name}
                  </h3>
                  <p className={styles.techDetailsMeta}>
                    كود الزبون: {selectedCustomer.customId || '—'} | الهاتف:{' '}
                    {selectedCustomer.phone || '—'} | العنوان:{' '}
                    {selectedCustomer.address || '—'}
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.techReloadBtn}
                  onClick={() => void loadCustomerDetails(selectedCustomer)}
                >
                  تحديث
                </button>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.summaryBadge}>
                  إجمالي الآلات المسجلة: {selectedCustomerOrders.length}
                </span>
                <span className={styles.summaryBadge}>
                  ضمن الكفالة: {selectedCustomerWarrantyCount}
                </span>
                <span className={styles.summaryBadge}>
                  خارج الكفالة:{' '}
                  {Math.max(0, selectedCustomerOrders.length - selectedCustomerWarrantyCount)}
                </span>
                <span className={styles.summaryBadge}>
                  قيد المتابعة: {selectedCustomerActiveCount}
                </span>
                <span className={styles.summaryBadge}>
                  تم التسليم: {selectedCustomerDeliveredCount}
                </span>
              </div>

              {selectedCustomerError && (
                <div className={styles.errorBanner}>⚠️ {selectedCustomerError}</div>
              )}

              {selectedCustomerLoading ? (
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
                        <th>الكفالة</th>
                        <th>الحالة</th>
                        <th>تاريخ الاستلام</th>
                        <th>تفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomerOrders.map((order) => (
                        <tr key={order._id}>
                          <td className={styles.tableNumber}>#{order.formNumber}</td>
                          <td>{getMachineName(order)}</td>
                          <td>{order.warranty ? 'ضمن الكفالة' : 'خارج الكفالة'}</td>
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

                      {selectedCustomerOrders.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className={styles.emptyState}>
                              <FileText size={36} />
                              <p>لا توجد أوامر خدمة لهذا الزبون حالياً</p>
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
    </div>
  );
}
