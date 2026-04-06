import { useEffect, useCallback, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  FileText,
  ExternalLink,
  Users,
  BarChart3,
  Filter,
  CalendarDays,
  List,
} from 'lucide-react';
import { useMaintenanceStore } from '../../../shared/store/maintenanceStore';
import { useAdminStore } from '../../../shared/store/adminStore';
import {
  maintenanceScheduleService,
  machineInspectionService,
  machineInstallationService,
  machineMaintenanceService,
  machineProductionService,
} from '../../../shared/api/services';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import WeeklyCalendar, {
  getWeekStart,
  formatDateISO,
} from '../../../shared/ui/WeeklyCalendar/WeeklyCalendar';
import type { ApiMaintenanceTask, ApiMaintenanceSchedule, ApiTaskStatus, ApiServiceOrder } from '../../../shared/api/types';
import styles from './MaintenancePage.module.css';

const TASK_TYPE_LABEL: Record<string, string> = {
  inspection: 'فحص',
  maintenance: 'صيانة',
  installation: 'تنصيب',
  production: 'إنتاج',
};

const STATUS_MAP: Record<ApiTaskStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'قيد الانتظار', color: '#f59e0b', icon: Clock },
  assigned: { label: 'معيّنة', color: '#3b82f6', icon: Users },
  in_progress: { label: 'قيد التنفيذ', color: '#8b5cf6', icon: Wrench },
  paused: { label: 'متوقفة مؤقتاً', color: '#ef4444', icon: AlertTriangle },
  completed: { label: 'مكتملة', color: '#10b981', icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', color: '#6b7280', icon: XCircle },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: '#6b7280' },
  medium: { label: 'متوسطة', color: '#f59e0b' },
  high: { label: 'عالية', color: '#ef4444' },
  urgent: { label: 'عاجلة', color: '#dc2626' },
};

const EXTRA_MACHINE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  waiting: { label: 'بالانتظار', color: '#f59e0b' },
  in_maintenance: { label: 'قيد الصيانة', color: '#8b5cf6' },
  postponed: { label: 'مؤجلة', color: '#f59e0b' },
  ready: { label: 'جاهزة', color: '#10b981' },
  rejected: { label: 'مرفوضة', color: '#dc2626' },
};

type CalendarTaskView = ApiMaintenanceTask & { originalType?: string; originalId?: string };

function getTaskStatusMeta(status: string): { label: string; color: string } {
  return STATUS_MAP[status as ApiTaskStatus] || EXTRA_MACHINE_STATUS_MAP[status] || { label: status, color: '#6b7280' };
}

function hasTaskReport(task: ApiMaintenanceTask): boolean {
  const report = task.report;
  const reportText = [
    report?.problemDescription,
    report?.solutionDescription,
    report?.notes,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  const hasParts = (report?.usedParts?.length || 0) > 0;
  const hasCost = (report?.laborCost || 0) > 0;
  const hasDuration = (task.totalDurationMs || 0) > 0;

  return hasDuration || hasParts || hasCost || reportText.length > 0;
}

function getCalendarTaskRoute(task: CalendarTaskView): string {
  if (task._id.startsWith('schedule-')) {
    return '/admin/maintenance/maintenance-schedule';
  }

  if (task.originalType && task.originalId) {
    const typeUrls: Record<string, string> = {
      inspection: '/admin/maintenance/machine-inspection',
      installation: '/admin/maintenance/machine-installation',
      maintenance: '/admin/maintenance/machine-maintenance',
      production: '/admin/maintenance/machine-production',
    };
    return typeUrls[task.originalType] || '/admin/maintenance';
  }

  return `/admin/maintenance/tasks/${task._id}`;
}

function formatDuration(ms: number): string {
  if (ms === 0) return '—';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}س ${m}د`;
  return `${m}د`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function addOneHour(time: string | null | undefined): string | null {
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = (h * 60 + m + 60) % (24 * 60);
  const nextH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const nextM = String(totalMinutes % 60).padStart(2, '0');
  return `${nextH}:${nextM}`;
}

function toValidDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function to24HourTime(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    const hh = String(value.getHours()).padStart(2, '0');
    const mm = String(value.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const raw = String(value).trim();
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) return raw;
  if (/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(raw)) return raw.slice(0, 5);

  const ampm = raw.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (ampm) {
    const hour12 = Number(ampm[1]);
    const minute = ampm[2];
    const meridiem = ampm[3].toUpperCase();
    const normalized = (hour12 % 12) + (meridiem === 'PM' ? 12 : 0);
    return `${String(normalized).padStart(2, '0')}:${minute}`;
  }

  const parsed = toValidDate(raw);
  if (!parsed) return null;
  const hh = String(parsed.getHours()).padStart(2, '0');
  const mm = String(parsed.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getScheduleTechId(item: ApiMaintenanceSchedule): string | null {
  if (item.status === 'rescheduled') {
    if (item.rescheduledTechnician && typeof item.rescheduledTechnician === 'object' && '_id' in item.rescheduledTechnician) {
      return item.rescheduledTechnician._id;
    }
    if (typeof item.rescheduledTechnician === 'string') return item.rescheduledTechnician;
  }

  if (item.technician && typeof item.technician === 'object' && '_id' in item.technician) {
    return item.technician._id;
  }
  if (typeof item.technician === 'string') return item.technician;
  return null;
}

function getScheduleTechName(item: ApiMaintenanceSchedule): string {
  if (item.status === 'rescheduled') {
    if (item.rescheduledTechnician && typeof item.rescheduledTechnician === 'object' && 'name' in item.rescheduledTechnician) {
      return item.rescheduledTechnician.name;
    }
    return item.rescheduledTechnicianName || '';
  }

  if (item.technician && typeof item.technician === 'object' && 'name' in item.technician) {
    return item.technician.name;
  }
  return item.technicianName || '';
}

function firstNonEmptyText(values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function getEntityName(entity: unknown): string {
  if (!entity || typeof entity !== 'object') return '';
  if ('name' in entity && typeof (entity as { name?: unknown }).name === 'string') {
    return ((entity as { name?: string }).name || '').trim();
  }
  return '';
}

function extractCustomerName(source: any): string {
  const reception = source?.machineReception && typeof source.machineReception === 'object'
    ? source.machineReception
    : null;

  return firstNonEmptyText([
    source?.customerName,
    getEntityName(source?.customer),
    reception?.customerName,
    getEntityName(reception?.customer),
  ]);
}

function buildMachineSpecs(source: any, fallbackName: string): string {
  const reception = source?.machineReception && typeof source.machineReception === 'object'
    ? source.machineReception
    : null;

  const details = firstNonEmptyText([
    source?.machineDetails,
    source?.machineNameAndDetails,
    reception?.machineDetails,
    fallbackName,
  ]);

  const serial = firstNonEmptyText([
    source?.serialNumber,
    reception?.serialNumber,
  ]);

  if (details && serial) return `${details} - SN: ${serial}`;
  if (details) return details;
  if (serial) return `SN: ${serial}`;
  return fallbackName;
}

function scheduleToCalendarTask(item: ApiMaintenanceSchedule): ApiMaintenanceTask {
  const date = item.status === 'rescheduled' ? (item.rescheduledDate || item.scheduledDate) : item.scheduledDate;
  const startTime = item.status === 'rescheduled' ? (item.rescheduledTime || item.scheduledTime) : item.scheduledTime;
  const endTime = addOneHour(startTime);
  const machineName = item.machineName || 'آلة';
  const machineSpecs = buildMachineSpecs(item, machineName);
  const customerName = extractCustomerName(item);

  return {
    _id: `schedule-${item._id}`,
    title: `جدولة صيانة - ${machineName}`,
    description: item.rescheduleReason || item.cancellationReason || '',
    machineInfo: machineSpecs,
    location: customerName,
    priority: 'medium',
    status: item.status === 'cancelled' ? 'cancelled' : 'assigned',
    createdBy: 'system',
    assignedTo: getScheduleTechName(item) || null,
    serviceOrder: null,
    timeLogs: [],
    totalDurationMs: 0,
    report: {
      problemDescription: '',
      solutionDescription: '',
      usedParts: [],
      laborCost: 0,
      notes: '',
    },
    scheduledDate: date,
    scheduledStartTime: startTime || null,
    scheduledEndTime: endTime,
    completedAt: null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export default function MaintenancePage() {
  const {
    tasks,
    calendarTasks,
    stats,
    technicians,
    loading,
    error,
    fetchAllTasks,
    fetchCalendarTasks,
    fetchStats,
    fetchTechnicians,
  } = useMaintenanceStore();
  const adminLogout = useAdminStore((s) => s.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('status') || '';

  // View mode: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [scheduleCalendarTasks, setScheduleCalendarTasks] = useState<ApiMaintenanceTask[]>([]);
  const [machineCalendarTasks, setMachineCalendarTasks] = useState<ApiMaintenanceTask[]>([]);
  const [selectedCalendarTask, setSelectedCalendarTask] = useState<CalendarTaskView | null>(null);
  const [showCalendarReport, setShowCalendarReport] = useState(false);

  // Fetch list tasks
  useEffect(() => {
    if (viewMode === 'list') {
      fetchAllTasks(activeFilter || undefined);
    }
  }, [fetchAllTasks, activeFilter, viewMode]);

  // Fetch calendar tasks when week/technician changes
  useEffect(() => {
    if (viewMode === 'calendar') {
      const from = formatDateISO(weekStart);
      const toDate = new Date(weekStart);
      toDate.setDate(toDate.getDate() + 6);
      const to = formatDateISO(toDate);
      fetchCalendarTasks(from, to, selectedTechnician || undefined);

      maintenanceScheduleService
        .getAll()
        .then((rows) => {
          const fromDate = new Date(from);
          const toDateRange = new Date(to);
          const mapped = rows
            .filter((row) => {
              const dateStr = row.status === 'rescheduled' ? (row.rescheduledDate || row.scheduledDate) : row.scheduledDate;
              if (!dateStr) return false;
              const d = new Date(dateStr);
              if (Number.isNaN(d.getTime())) return false;
              if (d < fromDate || d > toDateRange) return false;

              if (selectedTechnician) {
                return getScheduleTechId(row) === selectedTechnician;
              }
              return true;
            })
            .map(scheduleToCalendarTask);

          setScheduleCalendarTasks(mapped);
        })
        .catch(() => setScheduleCalendarTasks([]));

      // Fetch machine tasks (inspection, installation, maintenance, production)
      Promise.allSettled([
        machineInspectionService.getAll(),
        machineInstallationService.getAll(),
        machineMaintenanceService.getAll(),
        machineProductionService.getAll(),
      ]).then((results) => {
        const inspections = results[0].status === 'fulfilled' ? results[0].value : [];
        const installations = results[1].status === 'fulfilled' ? results[1].value : [];
        const maintenances = results[2].status === 'fulfilled' ? results[2].value : [];
        const productions = results[3].status === 'fulfilled' ? results[3].value : [];
        
        const mapMachineTask = (row: any, type: string): ApiMaintenanceTask | null => {
          const scheduledStartDate = toValidDate(row.scheduledStartTime);
          const scheduledEndDate = toValidDate(row.scheduledEndTime);
          const fallbackDate = toValidDate(row.date);
          const dateStr =
            (scheduledStartDate && formatDateISO(scheduledStartDate)) ||
            (fallbackDate && formatDateISO(fallbackDate)) ||
            '';

          if (!dateStr || dateStr < from || dateStr > to) return null;

          const techIdRaw = row.technician?._id || row.technician || '';
          const techId = typeof techIdRaw === 'string' ? techIdRaw : String(techIdRaw || '');
          if (selectedTechnician && techId !== selectedTechnician) return null;

          const techName = row.technician?.name || row.technicianName || 'فني';
          const machineName = row.machineName || row.machineType?.name || 'آلة';
          const machineSpecs = buildMachineSpecs(row, machineName);
          const customerName = extractCustomerName(row);
          const startTime =
            (scheduledStartDate && to24HourTime(scheduledStartDate)) ||
            to24HourTime(row.time);
          const endTime =
            (scheduledEndDate && to24HourTime(scheduledEndDate)) ||
            addOneHour(startTime);

          const usedPartsRaw = row.spareParts || row.materialsAndParts || [];
          const totalDuration =
            row.durationMs ||
            row.inspectionDurationMs ||
            row.maintenanceDurationMs ||
            row.installationDurationMs ||
            row.productionDurationMs ||
            0;

          return {
            _id: `machine-${type}-${row._id}`,
            title: `[${TASK_TYPE_LABEL[type] || 'آلة'}] ${machineName}`,
            description: row.pauseReason || row.rejectionReason || row.notes || '',
            machineInfo: machineSpecs,
            location: customerName,
            priority: 'medium',
            status: row.status as ApiTaskStatus,
            createdBy: 'system',
            assignedTo: techName,
            serviceOrder: null,
            timeLogs: [],
            totalDurationMs: totalDuration,
            report: {
              problemDescription: row.technicianReport || '',
              solutionDescription: '',
              usedParts: usedPartsRaw.map((sp: any) => ({
                name: sp.name,
                quantity: sp.quantity,
                cost: sp.cost || 0,
              })),
              laborCost: row.technicianFee || 0,
              notes: '',
            },
            scheduledDate: dateStr,
            scheduledStartTime: startTime || null,
            scheduledEndTime: endTime,
            completedAt: null,
            createdAt: row.createdAt || new Date().toISOString(),
            updatedAt: row.updatedAt || new Date().toISOString(),
            // Adding a small hack to be able to navigate to the correct page on click
            originalType: type,
            originalId: row._id,
          } as unknown as ApiMaintenanceTask;
        };

        const allMapped = [
          ...inspections.map(r => mapMachineTask(r, 'inspection')),
          ...installations.map(r => mapMachineTask(r, 'installation')),
          ...maintenances.map(r => mapMachineTask(r, 'maintenance')),
          ...productions.map(r => mapMachineTask(r, 'production'))
        ].filter(Boolean) as ApiMaintenanceTask[];

        setMachineCalendarTasks(allMapped);
      }).catch(() => setMachineCalendarTasks([]));

    } else {
      setScheduleCalendarTasks([]);
      setMachineCalendarTasks([]);
    }
  }, [fetchCalendarTasks, weekStart, selectedTechnician, viewMode]);

  const mergedCalendarTasks = [...calendarTasks, ...scheduleCalendarTasks, ...machineCalendarTasks];

  // Always fetch stats & technicians
  useEffect(() => {
    fetchStats();
    fetchTechnicians();
  }, [fetchStats, fetchTechnicians]);

  // Auto-redirect to login if 403 error (stale/wrong token)
  useEffect(() => {
    if (error && (error.includes('403') || error.includes('permission') || error.includes('Forbidden'))) {
      adminLogout();
      navigate('/admin/login');
    }
  }, [error, adminLogout, navigate]);

  const handleFilter = useCallback(
    (status: string) => {
      if (status) {
        setSearchParams({ status });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams],
  );

  const getAssigneeName = (task: ApiMaintenanceTask): string => {
    if (!task.assignedTo) return 'غير معيّن';
    if (typeof task.assignedTo === 'string') return task.assignedTo;
    return task.assignedTo.name;
  };

  const handleTaskClick = useCallback((task: CalendarTaskView) => {
    setSelectedCalendarTask(task);
    setShowCalendarReport(false);
  }, []);

  const handleOpenCalendarTask = useCallback(
    (task: CalendarTaskView) => {
      navigate(getCalendarTaskRoute(task));
      setSelectedCalendarTask(null);
      setShowCalendarReport(false);
    },
    [navigate],
  );

  if (loading && tasks.length === 0 && mergedCalendarTasks.length === 0) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Wrench size={24} />
            إدارة الصيانة
          </h1>
          <p className={styles.pageSubtitle}>
            إدارة مهام الصيانة وتتبع حالة الفنيين
          </p>
        </div>
        <div className={styles.headerActions}>
          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'calendar' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('calendar')}
              title="عرض التقويم"
            >
              <CalendarDays size={18} />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('list')}
              title="عرض القائمة"
            >
              <List size={18} />
            </button>
          </div>
          <Link to="/admin/maintenance/technicians" className={styles.btnSecondary}>
            <Users size={18} />
            الفنيين
          </Link>
          <Link to="/admin/maintenance/tasks/create" className={styles.btnPrimary}>
            <Plus size={18} />
            مهمة جديدة
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <BarChart3 size={22} className={styles.statIconBlue} />
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>إجمالي المهام</div>
          </div>
          <div className={styles.statCard}>
            <Clock size={22} className={styles.statIconYellow} />
            <div className={styles.statValue}>
              {(stats.byStatus['pending'] || 0) + (stats.byStatus['assigned'] || 0)}
            </div>
            <div className={styles.statLabel}>بانتظار التنفيذ</div>
          </div>
          <div className={styles.statCard}>
            <Wrench size={22} className={styles.statIconPurple} />
            <div className={styles.statValue}>
              {(stats.byStatus['in_progress'] || 0) + (stats.byStatus['paused'] || 0)}
            </div>
            <div className={styles.statLabel}>قيد التنفيذ</div>
          </div>
          <div className={styles.statCard}>
            <CheckCircle2 size={22} className={styles.statIconGreen} />
            <div className={styles.statValue}>{stats.byStatus['completed'] || 0}</div>
            <div className={styles.statLabel}>مكتملة</div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          color: '#dc2626',
          padding: '14px 20px',
          borderRadius: 12,
          marginBottom: 16,
          fontSize: '0.9rem',
          direction: 'rtl',
        }}>
          ⚠️ {error}
          <button
            onClick={() => {
              adminLogout();
              window.location.href = '/admin/login';
            }}
            style={{
              marginRight: 12,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
            }}
          >
            إعادة تسجيل الدخول
          </button>
        </div>
      )}

      {/* ── Calendar View ── */}
      {viewMode === 'calendar' && (
        <WeeklyCalendar
          tasks={mergedCalendarTasks}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          onTaskClick={handleTaskClick}
          technicians={technicians}
          selectedTechnician={selectedTechnician}
          onTechnicianChange={setSelectedTechnician}
          showAssignee
        />
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <>
          {/* Filters */}
          <div className={styles.filterBar}>
            <Filter size={16} />
            <button
              className={`${styles.filterChip} ${!activeFilter ? styles.filterActive : ''}`}
              onClick={() => handleFilter('')}
            >
              الكل
            </button>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <button
                key={key}
                className={`${styles.filterChip} ${activeFilter === key ? styles.filterActive : ''}`}
                onClick={() => handleFilter(key)}
                style={activeFilter === key ? { background: val.color, borderColor: val.color } : {}}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          {tasks.length === 0 ? (
            <div className={styles.emptyState}>
              <Wrench size={48} />
              <p>لا توجد مهام {activeFilter ? `بحالة "${STATUS_MAP[activeFilter as ApiTaskStatus]?.label}"` : ''}</p>
              <Link to="/admin/maintenance/tasks/create" className={styles.btnPrimary}>
                <Plus size={18} />
                إنشاء مهمة جديدة
              </Link>
            </div>
          ) : (
            <div className={styles.taskList}>
              {tasks.map((task) => {
                const statusInfo = STATUS_MAP[task.status];
                const priorityInfo = PRIORITY_MAP[task.priority];

                return (
                  <Link
                    key={task._id}
                    to={`/admin/maintenance/tasks/${task._id}`}
                    className={styles.taskCard}
                  >
                    <div className={styles.taskHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <h3 className={styles.taskTitle}>{task.title}</h3>
                        {task.serviceOrder && typeof task.serviceOrder !== 'string' && (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: '#eff6ff',
                            color: '#2563eb',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}>
                            أمر #{(task.serviceOrder as ApiServiceOrder).formNumber}
                          </span>
                        )}
                      </div>
                      <span
                        className={styles.statusBadge}
                        style={{ background: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className={styles.taskMeta}>
                      {task.machineInfo && (
                        <span className={styles.metaItem}>🔧 {task.machineInfo}</span>
                      )}
                      {task.location && (
                        <span className={styles.metaItem}>📍 {task.location}</span>
                      )}
                    </div>

                    <div className={styles.taskFooter}>
                      <span
                        className={styles.priorityBadge}
                        style={{ color: priorityInfo.color, borderColor: priorityInfo.color }}
                      >
                        {priorityInfo.label}
                      </span>
                      <span className={styles.assignee}>
                        <Users size={14} />
                        {getAssigneeName(task)}
                      </span>
                      {task.totalDurationMs > 0 && (
                        <span className={styles.duration}>
                          <Clock size={14} />
                          {formatDuration(task.totalDurationMs)}
                        </span>
                      )}
                      <span className={styles.date}>{formatDate(task.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedCalendarTask && (() => {
        const statusMeta = getTaskStatusMeta(selectedCalendarTask.status);
        const dateLabel = selectedCalendarTask.scheduledDate
          ? formatDate(selectedCalendarTask.scheduledDate)
          : '—';
        const timeLabel = selectedCalendarTask.scheduledStartTime
          ? `${selectedCalendarTask.scheduledStartTime}${selectedCalendarTask.scheduledEndTime ? ` - ${selectedCalendarTask.scheduledEndTime}` : ''}`
          : '—';
        const reportAvailable = hasTaskReport(selectedCalendarTask);

        return (
          <div
            className={styles.modalOverlay}
            onClick={() => {
              setSelectedCalendarTask(null);
              setShowCalendarReport(false);
            }}
          >
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className={styles.calendarModalHeader}>
                <h3 className={styles.modalTitle}>تفاصيل مهمة التقويم</h3>
                <button
                  className={styles.calendarCloseBtn}
                  onClick={() => {
                    setSelectedCalendarTask(null);
                    setShowCalendarReport(false);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.calendarTaskSummary}>
                <div>
                  <h4 className={styles.calendarTaskTitle}>{selectedCalendarTask.title}</h4>
                  {selectedCalendarTask.machineInfo && (
                    <p className={styles.calendarTaskSub}>🔧 {selectedCalendarTask.machineInfo}</p>
                  )}
                </div>
                <span className={styles.statusBadge} style={{ background: statusMeta.color }}>
                  {statusMeta.label}
                </span>
              </div>

              <div className={styles.calendarInfoGrid}>
                <div className={styles.calendarInfoItem}>
                  <span>الفني</span>
                  <strong>{getAssigneeName(selectedCalendarTask)}</strong>
                </div>
                <div className={styles.calendarInfoItem}>
                  <span>التاريخ المجدول</span>
                  <strong>{dateLabel}</strong>
                </div>
                <div className={styles.calendarInfoItem}>
                  <span>الوقت المجدول</span>
                  <strong>{timeLabel}</strong>
                </div>
                <div className={styles.calendarInfoItem}>
                  <span>الوقت المستغرق</span>
                  <strong>{formatDuration(selectedCalendarTask.totalDurationMs || 0)}</strong>
                </div>
              </div>

              {selectedCalendarTask.description && (
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>ملاحظات المهمة</div>
                  <div className={styles.reportFieldValue}>{selectedCalendarTask.description}</div>
                </div>
              )}

              <div className={styles.calendarActionRow}>
                {!selectedCalendarTask._id.startsWith('schedule-') && (
                  <button
                    className={styles.btnSecondary}
                    onClick={() => setShowCalendarReport((v) => !v)}
                  >
                    <FileText size={16} />
                    {showCalendarReport ? 'إخفاء التقرير' : 'عرض التقرير'}
                  </button>
                )}

                <button className={styles.btnPrimary} onClick={() => handleOpenCalendarTask(selectedCalendarTask)}>
                  <ExternalLink size={16} />
                  فتح المهمة
                </button>
              </div>

              {showCalendarReport && !selectedCalendarTask._id.startsWith('schedule-') && (
                <div className={styles.calendarReportBox}>
                  {reportAvailable ? (
                    <>
                      <div className={styles.reportField}>
                        <div className={styles.reportFieldLabel}>ملخص التقرير</div>
                        <div className={styles.reportFieldValue}>
                          {selectedCalendarTask.report.problemDescription || 'لا يوجد وصف للمشكلة'}
                        </div>
                      </div>

                      {selectedCalendarTask.report.solutionDescription && (
                        <div className={styles.reportField}>
                          <div className={styles.reportFieldLabel}>الحل المنفذ</div>
                          <div className={styles.reportFieldValue}>
                            {selectedCalendarTask.report.solutionDescription}
                          </div>
                        </div>
                      )}

                      {selectedCalendarTask.report.notes && (
                        <div className={styles.reportField}>
                          <div className={styles.reportFieldLabel}>ملاحظات الفني</div>
                          <div className={styles.reportFieldValue}>{selectedCalendarTask.report.notes}</div>
                        </div>
                      )}

                      {(selectedCalendarTask.report.laborCost || 0) > 0 && (
                        <div className={styles.reportField}>
                          <div className={styles.reportFieldLabel}>أجرة الفني</div>
                          <div className={styles.reportFieldValue}>
                            {selectedCalendarTask.report.laborCost.toLocaleString('ar-SA')} ل.س
                          </div>
                        </div>
                      )}

                      {(selectedCalendarTask.report.usedParts?.length || 0) > 0 && (
                        <div className={styles.reportField}>
                          <div className={styles.reportFieldLabel}>القطع المستخدمة</div>
                          <div className={styles.partsList}>
                            {selectedCalendarTask.report.usedParts.map((part, idx) => (
                              <div key={`${part.name}-${idx}`} className={styles.partItem}>
                                <span>{part.name} × {part.quantity}</span>
                                <span>{(part.cost || 0).toLocaleString('ar-SA')} ل.س</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.reportFieldValue}>لا يوجد تقرير مكتمل لهذه المهمة حتى الآن.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
