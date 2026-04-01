import { useEffect, useCallback, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  BarChart3,
  Filter,
  CalendarDays,
  List,
} from 'lucide-react';
import { useMaintenanceStore } from '../../../shared/store/maintenanceStore';
import { useAdminStore } from '../../../shared/store/adminStore';
import { maintenanceScheduleService } from '../../../shared/api/services';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import WeeklyCalendar, {
  getWeekStart,
  formatDateISO,
} from '../../../shared/ui/WeeklyCalendar/WeeklyCalendar';
import type { ApiMaintenanceTask, ApiMaintenanceSchedule, ApiTaskStatus, ApiServiceOrder } from '../../../shared/api/types';
import styles from './MaintenancePage.module.css';

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

function scheduleToCalendarTask(item: ApiMaintenanceSchedule): ApiMaintenanceTask {
  const date = item.status === 'rescheduled' ? (item.rescheduledDate || item.scheduledDate) : item.scheduledDate;
  const startTime = item.status === 'rescheduled' ? (item.rescheduledTime || item.scheduledTime) : item.scheduledTime;
  const endTime = addOneHour(startTime);

  return {
    _id: `schedule-${item._id}`,
    title: `جدولة صيانة - ${item.machineName || 'آلة'}`,
    description: item.rescheduleReason || item.cancellationReason || '',
    machineInfo: [item.machineName, item.machineDetails].filter(Boolean).join(' - '),
    location: '',
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
    } else {
      setScheduleCalendarTasks([]);
    }
  }, [fetchCalendarTasks, weekStart, selectedTechnician, viewMode]);

  const mergedCalendarTasks = [...calendarTasks, ...scheduleCalendarTasks];

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

  const handleTaskClick = useCallback(
    (task: ApiMaintenanceTask) => {
      if (task._id.startsWith('schedule-')) {
        navigate('/admin/maintenance/maintenance-schedule');
        return;
      }
      navigate(`/admin/maintenance/tasks/${task._id}`);
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
    </div>
  );
}
