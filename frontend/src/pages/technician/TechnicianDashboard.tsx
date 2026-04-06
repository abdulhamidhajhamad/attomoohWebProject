import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  LogOut,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  ClipboardList,
  FileText,
  Plus,
  X,
  Circle,
  CalendarDays,
  List,
  XCircle,
  Trash2,
} from 'lucide-react';
import { useMaintenanceStore } from '../../shared/store/maintenanceStore';
import { useTechnicianTasksStore } from '../../shared/store/technicianTasksStore';
import { useTechnicianAuthStore } from '../../shared/store/technicianAuthStore';
import { maintenanceScheduleService } from '../../shared/api/services';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner/LoadingSpinner';
import WeeklyCalendar, {
  getWeekStart,
  formatDateISO,
} from '../../shared/ui/WeeklyCalendar/WeeklyCalendar';
import { TECH_TOKEN_KEY } from '../../shared/api/httpClient';
import type {
  ApiMaintenanceTask,
  ApiMaintenanceSchedule,
  ApiTaskStatus,
  ApiTechnicianStatus,
  TaskReportRequest,
} from '../../shared/api/types';
import type { UnifiedTask, TaskType, TaskReportPayload } from '../../shared/api/services';
import styles from './TechnicianPages.module.css';

/* ═══════════════════════════════════
   Helpers
   ═══════════════════════════════════ */

const STATUS_MAP: Record<ApiTaskStatus, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: '#f59e0b' },
  assigned: { label: 'معيّنة', color: '#3b82f6' },
  in_progress: { label: 'قيد التنفيذ', color: '#8b5cf6' },
  paused: { label: 'متوقفة', color: '#ef4444' },
  completed: { label: 'مكتملة', color: '#10b981' },
  cancelled: { label: 'ملغاة', color: '#6b7280' },
};

const MACHINE_TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  assigned: { label: 'معيّنة', color: '#3b82f6' },
  in_progress: { label: 'قيد التنفيذ', color: '#8b5cf6' },
  in_maintenance: { label: 'قيد الصيانة', color: '#8b5cf6' },
  postponed: { label: 'مؤجلة', color: '#f59e0b' },
  ready: { label: 'جاهزة', color: '#10b981' },
  rejected: { label: 'مرفوضة', color: '#dc2626' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: '#6b7280' },
  medium: { label: 'متوسطة', color: '#f59e0b' },
  high: { label: 'عالية', color: '#ef4444' },
  urgent: { label: 'عاجلة', color: '#dc2626' },
};

const TECH_STATUS_MAP: Record<
  ApiTechnicianStatus,
  { label: string; color: string; icon: string }
> = {
  available: { label: 'متاح', color: '#10b981', icon: '🟢' },
  on_task: { label: 'مشغول بمهمة', color: '#f59e0b', icon: '🟡' },
  off_duty: { label: 'غير متواجد', color: '#6b7280', icon: '🔴' },
};

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  inspection: 'فحص',
  maintenance: 'صيانة',
  installation: 'تنصيب',
  production: 'إنتاج',
};

type TaskSource = 'legacy' | 'machine' | 'schedule';

type ReportTaskState = {
  source: TaskSource;
  task: ApiMaintenanceTask | UnifiedTask;
};

function calcLiveDuration(task: ApiMaintenanceTask): number {
  const active = task.status === 'in_progress';
  const fromLogs = calcDurationFromLogs(task.timeLogs, active);
  return fromLogs > 0 ? fromLogs : (task.totalDurationMs || 0);
}

function calcUnifiedLiveDuration(task: UnifiedTask): number {
  const active = task.status === 'in_progress' || task.status === 'in_maintenance';
  const fromLogs = calcDurationFromLogs(task.timeLogs, active);
  return fromLogs > 0 ? fromLogs : (task.durationMs || 0);
}

function calcDurationFromLogs(
  logs: Array<{ action: string; timestamp: string | Date; pauseReason?: string }> | undefined,
  includeRunning: boolean,
): number {
  if (!logs || logs.length === 0) return 0;

  let total = 0;
  let startAt: Date | null = null;

  for (const log of logs) {
    const ts = toValidDate(log.timestamp);
    if (!ts) continue;

    if (log.action === 'start' || log.action === 'resume') {
      startAt = ts;
      continue;
    }

    if ((log.action === 'pause' || log.action === 'finish') && startAt) {
      total += ts.getTime() - startAt.getTime();
      startAt = null;
    }
  }

  if (includeRunning && startAt) {
    total += Date.now() - startAt.getTime();
  }

  return Math.max(total, 0);
}

function formatTimer(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

function parseTimeParts(time: string | null): [number, number] | null {
  if (!time) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return [h, m];
}

function getTaskScheduleMeta(task: ApiMaintenanceTask | UnifiedTask, isMachine: boolean): {
  dateLabel: string;
  timeLabel: string;
  hasSchedule: boolean;
} {
  let dateValue: Date | null = null;
  let startTime: string | null = null;
  let endTime: string | null = null;

  if (isMachine) {
    const machineTask = task as UnifiedTask;
    const startDate = toValidDate(machineTask.scheduledStartTime);
    const endDate = toValidDate(machineTask.scheduledEndTime);

    dateValue = startDate ?? toValidDate(machineTask.date);
    startTime = (startDate && to24HourTime(startDate)) || to24HourTime(machineTask.time);
    endTime = (endDate && to24HourTime(endDate)) || addOneHour(startTime);
  } else {
    const legacyTask = task as ApiMaintenanceTask;
    dateValue = toValidDate(legacyTask.scheduledDate);
    startTime = to24HourTime(legacyTask.scheduledStartTime);
    endTime = to24HourTime(legacyTask.scheduledEndTime) || addOneHour(startTime);
  }

  const dateLabel = dateValue
    ? dateValue.toLocaleDateString('ar-SA', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'غير محدد';
  const timeLabel = startTime ? `${startTime}${endTime ? ` - ${endTime}` : ''}` : 'غير محدد';

  return {
    dateLabel,
    timeLabel,
    hasSchedule: Boolean(dateValue || startTime),
  };
}

function getTaskSortTimestamp(task: (ApiMaintenanceTask | UnifiedTask) & { source: TaskSource }): number {
  if (task.source === 'machine') {
    const machineTask = task as UnifiedTask;
    const scheduled = toValidDate(machineTask.scheduledStartTime);
    if (scheduled) return scheduled.getTime();

    const base = toValidDate(machineTask.date);
    if (base) {
      const t = parseTimeParts(to24HourTime(machineTask.time));
      if (t) base.setHours(t[0], t[1], 0, 0);
      return base.getTime();
    }

    return toValidDate(machineTask.createdAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  }

  const maintenanceTask = task as ApiMaintenanceTask;
  const base = toValidDate(maintenanceTask.scheduledDate) || toValidDate(maintenanceTask.createdAt);
  if (!base) return Number.MAX_SAFE_INTEGER;

  const t = parseTimeParts(to24HourTime(maintenanceTask.scheduledStartTime));
  if (t) base.setHours(t[0], t[1], 0, 0);

  return base.getTime();
}

function extractTimeline(logs: Array<{ action: string; timestamp: string | Date }> | undefined): {
  startedAt: Date | null;
  finishedAt: Date | null;
} {
  let startedAt: Date | null = null;
  let finishedAt: Date | null = null;

  for (const log of logs || []) {
    const ts = toValidDate(log.timestamp);
    if (!ts) continue;

    if ((log.action === 'start' || log.action === 'resume') && !startedAt) {
      startedAt = ts;
    }

    if (log.action === 'finish') {
      finishedAt = ts;
    }
  }

  return { startedAt, finishedAt };
}

function formatDateTimeAr(value: Date | null): string {
  if (!value) return '—';
  return value.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toTechScheduleTask(item: ApiMaintenanceSchedule): ApiMaintenanceTask {
  const scheduleDate = item.status === 'rescheduled' ? (item.rescheduledDate || item.scheduledDate) : item.scheduledDate;
  const scheduleTime = item.status === 'rescheduled' ? (item.rescheduledTime || item.scheduledTime) : item.scheduledTime;

  return {
    _id: `tech-schedule-${item._id}`,
    title: `جدولة صيانة - ${item.machineName || 'آلة'}`,
    description: item.rescheduleReason || item.cancellationReason || '',
    machineInfo: [item.machineName, item.machineDetails].filter(Boolean).join(' - '),
    location: '',
    priority: 'medium',
    status: item.status === 'cancelled' ? 'cancelled' : 'assigned',
    createdBy: 'system',
    assignedTo: 'مجدولة لك',
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
    scheduledDate: scheduleDate,
    scheduledStartTime: scheduleTime || null,
    scheduledEndTime: addOneHour(scheduleTime),
    completedAt: null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/* ═══════════════════════════════════
   Component
   ═══════════════════════════════════ */

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const logout = useTechnicianAuthStore((s) => s.logout);

  // Legacy maintenance store
  const {
    myTasks: legacyTasks,
    calendarTasks,
    myStatus,
    loading: legacyLoading,
    fetchMyTasks: fetchLegacyTasks,
    fetchCalendarTasks,
    fetchMyStatus,
    updateMyStatus,
    startTask: startLegacyTask,
    pauseTask: pauseLegacyTask,
    resumeTask: resumeLegacyTask,
    finishTask: finishLegacyTask,
  } = useMaintenanceStore();

  // New unified machine tasks store
  const {
    tasks: machineTasks,
    loading: machineLoading,
    fetchMyTasks: fetchMachineTasks,
    startTask: startMachineTask,
    pauseTask: pauseMachineTask,
    resumeTask: resumeMachineTask,
    finishTask: finishMachineTask,
    rejectTask: rejectMachineTask,
  } = useTechnicianTasksStore();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // View mode: 'tasks' (original) or 'calendar'
  const [viewMode, setViewMode] = useState<'tasks' | 'calendar'>('tasks');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [scheduleTasks, setScheduleTasks] = useState<ApiMaintenanceTask[]>([]);
  const [selectedCalendarTask, setSelectedCalendarTask] = useState<any | null>(null);
  const [reportTask, setReportTask] = useState<ReportTaskState | null>(null);

  // Finish form state (for legacy and machine tasks)
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishTaskId, setFinishTaskId] = useState('');
  const [finishTaskType, setFinishTaskType] = useState<'legacy' | TaskType | null>(null);

  // Legacy task fields
  const [problemDesc, setProblemDesc] = useState('');
  const [solutionDesc, setSolutionDesc] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [notes, setNotes] = useState('');
  const [usedParts, setUsedParts] = useState<{ name: string; quantity: number; cost: number }[]>([]);

  // Machine task fields
  const [pauseReason, setPauseReason] = useState('');
  const [spareParts, setSpareParts] = useState<{ name: string; quantity: number; cost?: number }[]>([]);
  const [technicianReport, setTechnicianReport] = useState('');
  const [technicianFee, setTechnicianFee] = useState('');
  const [companyFee, setCompanyFee] = useState('');

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTaskId, setRejectTaskId] = useState('');
  const [rejectTaskType, setRejectTaskType] = useState<TaskType | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchLegacyTasks();
    fetchMachineTasks();
    fetchMyStatus();
  }, [fetchLegacyTasks, fetchMachineTasks, fetchMyStatus]);

  // Fetch calendar tasks when in calendar mode
  useEffect(() => {
    if (viewMode === 'calendar') {
      const from = formatDateISO(weekStart);
      const toDate = new Date(weekStart);
      toDate.setDate(toDate.getDate() + 6);
      const to = formatDateISO(toDate);
      fetchCalendarTasks(from, to, undefined, TECH_TOKEN_KEY);

      maintenanceScheduleService
        .getAll(undefined, TECH_TOKEN_KEY, from, to)
        .then((rows) => setScheduleTasks(rows.map(toTechScheduleTask)))
        .catch(() => setScheduleTasks([]));
    } else {
      setScheduleTasks([]);
    }
  }, [fetchCalendarTasks, weekStart, viewMode]);

  const mergedCalendarTasks = useMemo(() => {
    const leg = calendarTasks.map(t => ({ ...t, source: 'legacy' as const, originalTask: t }));
    const sched = scheduleTasks.map(t => ({ ...t, source: 'schedule' as const, originalTask: t }));
    const mach = machineTasks.map(task => {
      const scheduledStartDate = toValidDate(task.scheduledStartTime);
      const scheduledEndDate = toValidDate(task.scheduledEndTime);
      const fallbackDate = toValidDate(task.date);

      const tDate =
        (scheduledStartDate && formatDateISO(scheduledStartDate)) ||
        (fallbackDate && formatDateISO(fallbackDate)) ||
        '';
      const tTime =
        (scheduledStartDate && to24HourTime(scheduledStartDate)) ||
        to24HourTime(task.time);
      const tEndTime =
        (scheduledEndDate && to24HourTime(scheduledEndDate)) ||
        addOneHour(tTime);

      return {
        _id: task._id,
        title: `[${TASK_TYPE_LABEL[task.taskType]}] ${task.machineName}`,
        description: task.pauseReason || task.rejectionReason || '',
        machineInfo: task.machineDetails || '',
        location: '',
        priority: 'medium',
        status: task.status as ApiTaskStatus,
        createdBy: 'system',
        assignedTo: task.technicianName,
        serviceOrder: null,
        timeLogs: [],
        totalDurationMs: task.durationMs,
        report: {
          problemDescription: task.technicianReport,
          solutionDescription: '',
          usedParts: task.spareParts?.map(sp => ({ name: sp.name, quantity: sp.quantity, cost: sp.cost || 0 })) || [],
          laborCost: task.technicianFee,
          notes: '',
        },
        scheduledDate: tDate,
        scheduledStartTime: tTime || null,
        scheduledEndTime: tEndTime,
        completedAt: null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        source: 'machine' as const,
        originalTask: task
      } as unknown as ApiMaintenanceTask & { source: 'machine', originalTask: UnifiedTask };
    });
    return [...leg, ...sched, ...mach];
  }, [calendarTasks, scheduleTasks, machineTasks]);

  // Timer tick — update every second for live display
  useEffect(() => {
    const hasActiveLegacy = legacyTasks.some((t) => t.status === 'in_progress');
    const hasActiveMachine = machineTasks.some((t) => t.status === 'in_progress' || t.status === 'in_maintenance');
    const hasActive = hasActiveLegacy || hasActiveMachine;

    if (hasActive) {
      timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [legacyTasks, machineTasks]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/technician/login');
  }, [logout, navigate]);

  const handleStatusChange = useCallback(
    async (newStatus: ApiTechnicianStatus) => {
      if (newStatus === myStatus) return;
      setStatusLoading(true);
      try {
        await updateMyStatus(newStatus);
      } catch { /* handled by store */ }
      setStatusLoading(false);
    },
    [myStatus, updateMyStatus],
  );

  // Legacy task actions
  const handleLegacyAction = useCallback(
    async (taskId: string, action: 'start' | 'pause' | 'resume') => {
      setActionLoading(taskId);
      try {
        if (action === 'start') await startLegacyTask(taskId);
        else if (action === 'pause') await pauseLegacyTask(taskId);
        else if (action === 'resume') await resumeLegacyTask(taskId);
        await fetchLegacyTasks();
      } catch { /* handled by store */ }
      setActionLoading(null);
    },
    [startLegacyTask, pauseLegacyTask, resumeLegacyTask, fetchLegacyTasks],
  );

  // Machine task actions
  const handleMachineAction = useCallback(
    async (taskType: TaskType, taskId: string, action: 'start' | 'pause' | 'resume') => {
      setActionLoading(taskId);
      try {
        if (action === 'start') await startMachineTask(taskType, taskId);
        else if (action === 'pause') await pauseMachineTask(taskType, taskId);
        else if (action === 'resume') await resumeMachineTask(taskType, taskId);
      } catch { /* handled by store */ }
      setActionLoading(null);
    },
    [startMachineTask, pauseMachineTask, resumeMachineTask],
  );

  const openFinishForm = useCallback((taskId: string, taskType: 'legacy' | TaskType) => {
    setFinishTaskId(taskId);
    setFinishTaskType(taskType);

    // Reset all fields
    setProblemDesc('');
    setSolutionDesc('');
    setLaborCost('');
    setNotes('');
    setUsedParts([]);
    setPauseReason('');
    setSpareParts([]);
    setTechnicianReport('');
    setTechnicianFee('');
    setCompanyFee('');

    setShowFinishModal(true);
  }, []);

  const handleFinish = useCallback(async () => {
    if (!finishTaskId || !finishTaskType) return;
    setActionLoading(finishTaskId);

    try {
      if (finishTaskType === 'legacy') {
        const report: TaskReportRequest = {
          problemDescription: problemDesc.trim() || undefined,
          solutionDescription: solutionDesc.trim() || undefined,
          laborCost: laborCost ? Number(laborCost) : undefined,
          notes: notes.trim() || undefined,
          usedParts: usedParts.length > 0 ? usedParts.filter((p) => p.name) : undefined,
        };
        await finishLegacyTask(finishTaskId, report);
        await fetchLegacyTasks();
      } else {
        const report: TaskReportPayload = {
          pauseReason: pauseReason.trim() || undefined,
          spareParts: spareParts.length > 0 ? spareParts.filter((p) => p.name.trim()) : undefined,
          technicianReport: technicianReport.trim() || undefined,
          technicianFee: technicianFee ? Number(technicianFee) : undefined,
          companyFee: companyFee ? Number(companyFee) : undefined,
        };
        await finishMachineTask(finishTaskType, finishTaskId, report);
      }
      setShowFinishModal(false);
    } catch { /* handled */ }
    setActionLoading(null);
  }, [
    finishTaskId,
    finishTaskType,
    problemDesc,
    solutionDesc,
    laborCost,
    notes,
    usedParts,
    pauseReason,
    spareParts,
    technicianReport,
    technicianFee,
    companyFee,
    finishLegacyTask,
    finishMachineTask,
    fetchLegacyTasks,
  ]);

  const openRejectForm = useCallback((taskId: string, taskType: TaskType) => {
    setRejectTaskId(taskId);
    setRejectTaskType(taskType);
    setRejectReason('');
    setShowRejectModal(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!rejectTaskId || !rejectTaskType || !rejectReason.trim()) return;
    setActionLoading(rejectTaskId);

    try {
      await rejectMachineTask(rejectTaskType, rejectTaskId, rejectReason.trim());
      setShowRejectModal(false);
    } catch { /* handled */ }
    setActionLoading(null);
  }, [rejectTaskId, rejectTaskType, rejectReason, rejectMachineTask]);

  // Legacy parts handlers
  const addPart = () => setUsedParts([...usedParts, { name: '', quantity: 1, cost: 0 }]);
  const removePart = (i: number) => setUsedParts(usedParts.filter((_, idx) => idx !== i));
  const updatePart = (i: number, field: keyof typeof usedParts[number], value: string | number) => {
    const copy = [...usedParts];
    copy[i] = { ...copy[i], [field]: value };
    setUsedParts(copy);
  };

  // Machine task spare parts handlers
  const addSparePart = () => setSpareParts([...spareParts, { name: '', quantity: 1, cost: 0 }]);
  const removeSparePart = (i: number) => setSpareParts(spareParts.filter((_, idx) => idx !== i));
  const updateSparePart = (i: number, field: keyof typeof spareParts[number], value: string | number) => {
    const copy = [...spareParts];
    copy[i] = { ...copy[i], [field]: value };
    setSpareParts(copy);
  };

  // Merge and organize all tasks
  const allActiveTasks = useMemo(() => {
    const legacyActive = legacyTasks
      .filter((t) => ['pending', 'assigned', 'in_progress', 'paused'].includes(t.status))
      .map((t) => ({ ...t, source: 'legacy' as const }));

    const machineActive = machineTasks
      .filter((t) => ['waiting', 'assigned', 'in_progress', 'in_maintenance', 'postponed'].includes(t.status))
      .map((t) => ({ ...t, source: 'machine' as const }));

    const scheduleActive = scheduleTasks
      .filter((t) => t.status !== 'cancelled')
      .map((t) => ({ ...t, source: 'schedule' as const }));

    return [...legacyActive, ...machineActive, ...scheduleActive]
      .sort((a, b) => getTaskSortTimestamp(a) - getTaskSortTimestamp(b));
  }, [legacyTasks, machineTasks, scheduleTasks]);

  const completedTasks = useMemo(() => {
    const legacyCompleted = legacyTasks
      .filter((t) => ['completed', 'cancelled'].includes(t.status))
      .map((t) => ({ ...t, source: 'legacy' as const }));

    const machineCompleted = machineTasks
      .filter((t) => ['ready', 'rejected'].includes(t.status))
      .map((t) => ({ ...t, source: 'machine' as const }));

    return [...legacyCompleted, ...machineCompleted].sort((a, b) => {
      const aTs = toValidDate((a as { updatedAt?: string }).updatedAt)?.getTime() ?? 0;
      const bTs = toValidDate((b as { updatedAt?: string }).updatedAt)?.getTime() ?? 0;
      return bTs - aTs;
    });
  }, [legacyTasks, machineTasks]);

  const loading = legacyLoading || machineLoading;

  if (loading && legacyTasks.length === 0 && machineTasks.length === 0) {
    return (
      <div className={styles.techDashboard}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.techDashboard}>
      {/* Top Bar */}
      <div className={styles.techTopBar}>
        <div className={styles.techTopBarTitle}>
          <Wrench size={22} />
          لوحة الفني
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'calendar' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('calendar')}
              title="التقويم"
            >
              <CalendarDays size={16} />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'tasks' ? styles.viewToggleActive : ''}`}
              onClick={() => setViewMode('tasks')}
              title="المهام"
            >
              <List size={16} />
            </button>
          </div>
          <button className={styles.techLogout} onClick={handleLogout}>
            <LogOut size={16} />
            خروج
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusBarLabel}>
          <Circle size={10} fill={TECH_STATUS_MAP[myStatus || 'available'].color} color={TECH_STATUS_MAP[myStatus || 'available'].color} />
          حالتي:
        </span>
        <div className={styles.statusToggleGroup}>
          {(Object.keys(TECH_STATUS_MAP) as ApiTechnicianStatus[]).map((s) => {
            const info = TECH_STATUS_MAP[s];
            const isActive = myStatus === s;
            return (
              <button
                key={s}
                className={`${styles.statusToggleBtn} ${isActive ? styles.statusToggleBtnActive : ''}`}
                style={
                  isActive
                    ? { background: info.color, borderColor: info.color, color: '#fff' }
                    : { borderColor: info.color, color: info.color }
                }
                onClick={() => handleStatusChange(s)}
                disabled={statusLoading}
              >
                {info.icon} {info.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.techContent}>
        {viewMode === 'calendar' ? (
          <WeeklyCalendar
            tasks={mergedCalendarTasks}
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            showAssignee={false}
            onTaskClick={(task) => setSelectedCalendarTask(task)}
          />
        ) : (
        <>
        {/* Active Tasks */}
        <h2 className={styles.sectionTitle}>
          <ClipboardList size={20} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
          المهام النشطة ({allActiveTasks.length})
        </h2>

        {allActiveTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={48} />
            <p>لا توجد مهام نشطة حالياً</p>
          </div>
        ) : (
          allActiveTasks.map((task) => {
            const isLegacy = task.source === 'legacy';
            const isMachine = task.source === 'machine';
            const isSchedule = task.source === 'schedule';

            const statusInfo = isMachine
              ? MACHINE_TASK_STATUS_MAP[task.status] || STATUS_MAP[task.status as ApiTaskStatus]
              : STATUS_MAP[task.status as ApiTaskStatus];

            const priority = (isLegacy || isSchedule) ? (task as ApiMaintenanceTask).priority : 'medium';
            const priorityInfo = PRIORITY_MAP[priority || 'medium'];
            const isInProgress = task.status === 'in_progress' || task.status === 'in_maintenance';
            const isPaused = task.status === 'paused' || task.status === 'postponed';
            const isAssigned = task.status === 'assigned';
            const liveDuration = isMachine
              ? calcUnifiedLiveDuration(task as UnifiedTask)
              : isLegacy
                ? calcLiveDuration(task as ApiMaintenanceTask)
                : 0;
            const scheduleMeta = getTaskScheduleMeta(
              isMachine ? (task as UnifiedTask) : (task as ApiMaintenanceTask),
              isMachine,
            );

            return (
              <div key={task._id} className={styles.taskCardTech}>
                <div className={styles.taskCardHeader}>
                  <h3 className={styles.taskCardTitle}>
                    {isMachine && `[${TASK_TYPE_LABEL[(task as UnifiedTask).taskType]}] `}
                    {isLegacy ? task.title : (task as UnifiedTask).machineName}
                  </h3>
                  <span
                    className={styles.statusBadge}
                    style={{ background: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div className={styles.taskCardMeta}>
                  {isLegacy && task.machineInfo && <span>🔧 {task.machineInfo}</span>}
                  {isMachine && <span>🔧 {(task as UnifiedTask).machineDetails}</span>}
                  {isLegacy && task.location && <span>📍 {task.location}</span>}
                  {!isSchedule && (
                    <span
                      className={styles.priorityBadge}
                      style={{ color: priorityInfo.color, borderColor: priorityInfo.color }}
                    >
                      {priorityInfo.label}
                    </span>
                  )}
                </div>

                <div className={styles.scheduleStrip}>
                  <span className={styles.schedulePill}>
                    <CalendarDays size={14} /> {scheduleMeta.dateLabel}
                  </span>
                  <span className={styles.schedulePill}>
                    <Clock size={14} /> {scheduleMeta.timeLabel}
                  </span>
                </div>

                {/* Timer */}
                {(isInProgress || isPaused) && !isSchedule && (
                  <div className={styles.timerDisplay}>
                    <Clock size={22} />
                    <span>{formatTimer(liveDuration)}</span>
                    <span className={styles.timerLabel}>
                      {isInProgress ? 'جاري العمل' : 'متوقف مؤقتاً'}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.actionBtns}>
                  {!isSchedule && (
                    <button
                      className={styles.btnReport}
                      onClick={() => setReportTask({
                        source: isMachine ? 'machine' : 'legacy',
                        task: isMachine ? (task as UnifiedTask) : (task as ApiMaintenanceTask),
                      })}
                    >
                      <FileText size={16} />
                      ريبورت
                    </button>
                  )}

                  {isSchedule && (
                    <button className={styles.btnPause} disabled>
                      هذه مهمة مجدولة
                    </button>
                  )}

                  {isAssigned && !isSchedule && (
                    <button
                      className={styles.btnStart}
                      onClick={() =>
                        isLegacy
                          ? handleLegacyAction(task._id, 'start')
                          : handleMachineAction((task as UnifiedTask).taskType, task._id, 'start')
                      }
                      disabled={actionLoading === task._id}
                    >
                      <Play size={16} />
                      بدء العمل
                    </button>
                  )}

                  {isInProgress && !isSchedule && (
                    <>
                      <button
                        className={styles.btnPause}
                        onClick={() =>
                          isLegacy
                            ? handleLegacyAction(task._id, 'pause')
                            : handleMachineAction((task as UnifiedTask).taskType, task._id, 'pause')
                        }
                        disabled={actionLoading === task._id}
                      >
                        <Pause size={16} />
                        إيقاف مؤقت
                      </button>
                      <button
                        className={styles.btnFinish}
                        onClick={() =>
                          openFinishForm(
                            task._id,
                            isLegacy ? 'legacy' : (task as UnifiedTask).taskType
                          )
                        }
                        disabled={actionLoading === task._id}
                      >
                        <CheckCircle2 size={16} />
                        إنهاء المهمة
                      </button>
                    </>
                  )}

                  {isPaused && !isSchedule && (
                    <>
                      <button
                        className={styles.btnResume}
                        onClick={() =>
                          isLegacy
                            ? handleLegacyAction(task._id, 'resume')
                            : handleMachineAction((task as UnifiedTask).taskType, task._id, 'resume')
                        }
                        disabled={actionLoading === task._id}
                      >
                        <RotateCcw size={16} />
                        استئناف
                      </button>
                      <button
                        className={styles.btnFinish}
                        onClick={() =>
                          openFinishForm(
                            task._id,
                            isLegacy ? 'legacy' : (task as UnifiedTask).taskType
                          )
                        }
                        disabled={actionLoading === task._id}
                      >
                        <CheckCircle2 size={16} />
                        إنهاء المهمة
                      </button>
                    </>
                  )}

                  {/* Reject button for machine tasks only */}
                  {isMachine && (isAssigned || isPaused) && (
                    <button
                      className={styles.btnReject}
                      onClick={() => openRejectForm(task._id, (task as UnifiedTask).taskType)}
                      disabled={actionLoading === task._id}
                    >
                      <XCircle size={16} />
                      رفض
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <>
            <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>
              المهام المنتهية ({completedTasks.length})
            </h2>
            {completedTasks.map((task) => {
              const isMachine = task.source === 'machine';
              const statusInfo = isMachine
                ? MACHINE_TASK_STATUS_MAP[task.status] || STATUS_MAP[task.status as ApiTaskStatus]
                : STATUS_MAP[task.status as ApiTaskStatus];
              const scheduleMeta = getTaskScheduleMeta(
                isMachine ? (task as UnifiedTask) : (task as ApiMaintenanceTask),
                isMachine,
              );
              const totalDuration = isMachine
                ? calcUnifiedLiveDuration(task as UnifiedTask)
                : (task as ApiMaintenanceTask).totalDurationMs;
              const completedTitle = isMachine
                ? `[${TASK_TYPE_LABEL[(task as UnifiedTask).taskType]}] ${(task as UnifiedTask).machineName}`
                : (task as ApiMaintenanceTask).title;

              return (
                <div key={task._id} className={styles.taskCardTech} style={{ opacity: 0.7 }}>
                  <div className={styles.taskCardHeader}>
                    <h3 className={styles.taskCardTitle}>{completedTitle}</h3>
                    <span
                      className={styles.statusBadge}
                      style={{ background: statusInfo?.color || '#6b7280' }}
                    >
                      {statusInfo?.label || task.status}
                    </span>
                  </div>
                  <div className={styles.taskCardMeta}>
                    {!isMachine && (task as ApiMaintenanceTask).machineInfo && (
                      <span>🔧 {(task as ApiMaintenanceTask).machineInfo}</span>
                    )}
                    {isMachine && <span>🔧 {(task as UnifiedTask).machineDetails}</span>}
                    <span>
                      <CalendarDays size={14} style={{ display: 'inline' }} />{' '}
                      {scheduleMeta.dateLabel}
                    </span>
                    <span>
                      <Clock size={14} style={{ display: 'inline' }} />{' '}
                      {formatTimer(totalDuration)}
                    </span>
                    <button
                      className={styles.btnReport}
                      onClick={() => setReportTask({
                        source: isMachine ? 'machine' : 'legacy',
                        task: isMachine ? (task as UnifiedTask) : (task as ApiMaintenanceTask),
                      })}
                    >
                      <FileText size={14} /> ريبورت
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
        </>
        )}
      </div>

      {/* Calendar Task Modal */}
      {selectedCalendarTask && (() => {
        const isLegacy = selectedCalendarTask.source === 'legacy';
        const isMachine = selectedCalendarTask.source === 'machine';
        const isSchedule = selectedCalendarTask.source === 'schedule';
        const task = isMachine ? selectedCalendarTask.originalTask : selectedCalendarTask;

        const statusInfo = isMachine
          ? MACHINE_TASK_STATUS_MAP[task.status] || STATUS_MAP[task.status as ApiTaskStatus]
          : STATUS_MAP[task.status as ApiTaskStatus];

        const priority = (isLegacy || isSchedule) ? (task as ApiMaintenanceTask).priority : 'medium';
        const priorityInfo = PRIORITY_MAP[priority || 'medium'];
        const isInProgress = task.status === 'in_progress' || task.status === 'in_maintenance';
        const isPaused = task.status === 'paused' || task.status === 'postponed';
        const isAssigned = task.status === 'assigned';
        const liveDuration = isMachine
          ? calcUnifiedLiveDuration(task as UnifiedTask)
          : isLegacy
            ? calcLiveDuration(task as ApiMaintenanceTask)
            : 0;
        const scheduleMeta = getTaskScheduleMeta(
          isMachine ? (task as UnifiedTask) : (task as ApiMaintenanceTask),
          isMachine,
        );

        return (
          <div className={styles.modalOverlay} onClick={() => setSelectedCalendarTask(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClipboardList size={20} />
                  تفاصيل المهمة
                </h3>
                <button onClick={() => setSelectedCalendarTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.taskCardTech} style={{ margin: 0, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <div className={styles.taskCardHeader}>
                  <h3 className={styles.taskCardTitle}>
                    {isMachine && `[${TASK_TYPE_LABEL[(task as UnifiedTask).taskType]}] `}
                    {isLegacy ? task.title : (task as UnifiedTask).machineName}
                  </h3>
                  <span
                    className={styles.statusBadge}
                    style={{ background: statusInfo?.color || '#ccc' }}
                  >
                    {statusInfo?.label || task.status}
                  </span>
                </div>

                <div className={styles.taskCardMeta} style={{ marginTop: 12 }}>
                  {isLegacy && task.machineInfo && <span>🔧 {task.machineInfo}</span>}
                  {isMachine && <span>🔧 {(task as UnifiedTask).machineDetails}</span>}
                  {isLegacy && task.location && <span>📍 {task.location}</span>}
                  {!isSchedule && priorityInfo && (
                    <span
                      className={styles.priorityBadge}
                      style={{ color: priorityInfo.color, borderColor: priorityInfo.color }}
                    >
                      {priorityInfo.label}
                    </span>
                  )}
                </div>

                <div className={styles.scheduleStrip}>
                  <span className={styles.schedulePill}>
                    <CalendarDays size={14} /> {scheduleMeta.dateLabel}
                  </span>
                  <span className={styles.schedulePill}>
                    <Clock size={14} /> {scheduleMeta.timeLabel}
                  </span>
                </div>

                <div className={styles.taskCardDesc} style={{ margin: '16px 0', fontSize: '0.95rem', color: '#4b5563' }}>
                  {isLegacy && task.description && <p>{task.description}</p>}
                  {isMachine && (task as UnifiedTask).pauseReason && <p><strong>سبب الإيقاف:</strong> {(task as UnifiedTask).pauseReason}</p>}
                  {isMachine && (task as UnifiedTask).rejectionReason && <p><strong>سبب الرفض:</strong> {(task as UnifiedTask).rejectionReason}</p>}
                </div>

                {/* Timer */}
                {(isInProgress || isPaused) && !isSchedule && (
                  <div className={styles.timerDisplay} style={{ marginBottom: 16 }}>
                    <Clock size={22} />
                    <span>{formatTimer(liveDuration)}</span>
                    <span className={styles.timerLabel}>
                      {isInProgress ? 'جاري العمل' : 'متوقف مؤقتاً'}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.actionBtns} style={{ marginTop: 24 }}>
                  {!isSchedule && (
                    <button
                      className={styles.btnReport}
                      onClick={() => {
                        setReportTask({
                          source: isMachine ? 'machine' : 'legacy',
                          task: isMachine ? (task as UnifiedTask) : (task as ApiMaintenanceTask),
                        });
                        setSelectedCalendarTask(null);
                      }}
                    >
                      <FileText size={16} />
                      ريبورت
                    </button>
                  )}

                  {isSchedule && (
                    <button className={styles.btnPause} disabled>
                      هذه مهمة مجدولة
                    </button>
                  )}

                  {isAssigned && !isSchedule && (
                    <button
                      className={styles.btnStart}
                      onClick={() => {
                        isLegacy
                          ? handleLegacyAction(task._id, 'start')
                          : handleMachineAction((task as UnifiedTask).taskType, task._id, 'start');
                        setSelectedCalendarTask(null);
                      }}
                      disabled={actionLoading === task._id}
                    >
                      <Play size={16} />
                      بدء العمل
                    </button>
                  )}

                  {isInProgress && !isSchedule && (
                    <>
                      <button
                        className={styles.btnPause}
                        onClick={() => {
                          isLegacy
                            ? handleLegacyAction(task._id, 'pause')
                            : handleMachineAction((task as UnifiedTask).taskType, task._id, 'pause');
                          setSelectedCalendarTask(null);
                        }}
                        disabled={actionLoading === task._id}
                      >
                        <Pause size={16} />
                        إيقاف مؤقت
                      </button>
                      <button
                        className={styles.btnFinish}
                        onClick={() => {
                          openFinishForm(
                            task._id,
                            isLegacy ? 'legacy' : (task as UnifiedTask).taskType
                          );
                          setSelectedCalendarTask(null);
                        }}
                        disabled={actionLoading === task._id}
                      >
                        <CheckCircle2 size={16} />
                        إنهاء المهمة
                      </button>
                    </>
                  )}

                  {isPaused && !isSchedule && (
                    <>
                      <button
                        className={styles.btnResume}
                        onClick={() => {
                          isLegacy
                            ? handleLegacyAction(task._id, 'resume')
                            : handleMachineAction((task as UnifiedTask).taskType, task._id, 'resume');
                          setSelectedCalendarTask(null);
                        }}
                        disabled={actionLoading === task._id}
                      >
                        <RotateCcw size={16} />
                        استئناف
                      </button>
                      <button
                        className={styles.btnFinish}
                        onClick={() => {
                          openFinishForm(
                            task._id,
                            isLegacy ? 'legacy' : (task as UnifiedTask).taskType
                          );
                          setSelectedCalendarTask(null);
                        }}
                        disabled={actionLoading === task._id}
                      >
                        <CheckCircle2 size={16} />
                        إنهاء المهمة
                      </button>
                    </>
                  )}

                  {/* Reject button for machine tasks only */}
                  {isMachine && (isAssigned || isPaused) && (
                    <button
                      className={styles.btnReject}
                      onClick={() => {
                        openRejectForm(task._id, (task as UnifiedTask).taskType);
                        setSelectedCalendarTask(null);
                      }}
                      disabled={actionLoading === task._id}
                    >
                      <XCircle size={16} />
                      رفض
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Report Modal */}
      {reportTask && (() => {
        const isMachine = reportTask.source === 'machine';
        const task = reportTask.task;
        const statusInfo = isMachine
          ? MACHINE_TASK_STATUS_MAP[(task as UnifiedTask).status] || STATUS_MAP[(task as UnifiedTask).status as ApiTaskStatus]
          : STATUS_MAP[(task as ApiMaintenanceTask).status as ApiTaskStatus];

        const title = isMachine
          ? `[${TASK_TYPE_LABEL[(task as UnifiedTask).taskType]}] ${(task as UnifiedTask).machineName}`
          : (task as ApiMaintenanceTask).title;
        const machineInfo = isMachine
          ? (task as UnifiedTask).machineDetails
          : (task as ApiMaintenanceTask).machineInfo;
        const durationMs = isMachine
          ? calcUnifiedLiveDuration(task as UnifiedTask)
          : calcLiveDuration(task as ApiMaintenanceTask);
        const scheduleMeta = getTaskScheduleMeta(task, isMachine);
        const logs = isMachine
          ? (task as UnifiedTask).timeLogs
          : (task as ApiMaintenanceTask).timeLogs;
        const { startedAt, finishedAt } = extractTimeline(logs as Array<{ action: string; timestamp: string | Date }>);

        return (
          <div className={styles.modalOverlay} onClick={() => setReportTask(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.reportHeader}>
                <div>
                  <h3 className={styles.modalTitle}>تقرير المهمة</h3>
                  <p className={styles.reportSubtitle}>ملخص زمني وحالة التنفيذ</p>
                </div>
                <button className={styles.reportCloseBtn} onClick={() => setReportTask(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className={styles.reportHero}>
                <div>
                  <div className={styles.reportTaskTitle}>{title}</div>
                  {machineInfo && <div className={styles.reportTaskInfo}>🔧 {machineInfo}</div>}
                </div>
                <span className={styles.statusBadge} style={{ background: statusInfo?.color || '#6b7280' }}>
                  {statusInfo?.label || 'غير معروف'}
                </span>
              </div>

              <div className={styles.reportGrid}>
                <div className={styles.reportCard}>
                  <span className={styles.reportLabel}>المدة الكلية</span>
                  <strong className={styles.reportValue}>{formatTimer(durationMs)}</strong>
                </div>
                <div className={styles.reportCard}>
                  <span className={styles.reportLabel}>التاريخ المجدول</span>
                  <strong className={styles.reportValue}>{scheduleMeta.dateLabel}</strong>
                </div>
                <div className={styles.reportCard}>
                  <span className={styles.reportLabel}>الوقت المجدول</span>
                  <strong className={styles.reportValue}>{scheduleMeta.timeLabel}</strong>
                </div>
                <div className={styles.reportCard}>
                  <span className={styles.reportLabel}>بداية التنفيذ</span>
                  <strong className={styles.reportValue}>{formatDateTimeAr(startedAt)}</strong>
                </div>
                <div className={styles.reportCard}>
                  <span className={styles.reportLabel}>نهاية التنفيذ</span>
                  <strong className={styles.reportValue}>{formatDateTimeAr(finishedAt)}</strong>
                </div>
                <div className={styles.reportCard}>
                  <span className={styles.reportLabel}>عدد سجلات الوقت</span>
                  <strong className={styles.reportValue}>{logs?.length || 0}</strong>
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.btnSecondary} onClick={() => setReportTask(null)}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Finish Modal */}
      {showFinishModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFinishModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>تقرير إنهاء المهمة</h3>

            {finishTaskType === 'legacy' ? (
              <>
                {/* Legacy Task Fields */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>وصف المشكلة</label>
                  <textarea
                    className={styles.formTextarea}
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    placeholder="صِف المشكلة التي وجدتها..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>الحل المطبّق</label>
                  <textarea
                    className={styles.formTextarea}
                    value={solutionDesc}
                    onChange={(e) => setSolutionDesc(e.target.value)}
                    placeholder="ما الذي قمت به لحل المشكلة..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>القطع المستخدمة</label>
                  {usedParts.map((part, i) => (
                    <div key={i} className={styles.partsRow}>
                      <div className={styles.formGroup}>
                        <input
                          className={styles.formInput}
                          value={part.name}
                          onChange={(e) => updatePart(i, 'name', e.target.value)}
                          placeholder="اسم القطعة"
                        />
                      </div>
                      <div className={styles.formGroup} style={{ maxWidth: 80 }}>
                        <input
                          className={styles.formInput}
                          type="number"
                          min={1}
                          value={part.quantity}
                          onChange={(e) => updatePart(i, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className={styles.formGroup} style={{ maxWidth: 100 }}>
                        <input
                          className={styles.formInput}
                          type="number"
                          min={0}
                          value={part.cost}
                          onChange={(e) => updatePart(i, 'cost', Number(e.target.value))}
                          placeholder="التكلفة"
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removePartBtn}
                        onClick={() => removePart(i)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className={styles.addPartBtn} onClick={addPart}>
                    <Plus size={14} style={{ display: 'inline' }} /> إضافة قطعة
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>تكلفة العمالة (ل.س)</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min={0}
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ملاحظات إضافية</label>
                  <textarea
                    className={styles.formTextarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات أخرى..."
                  />
                </div>
              </>
            ) : (
              <>
                {/* Machine Task Fields */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>سبب الإيقاف / الاستمرار</label>
                  <textarea
                    className={styles.formTextarea}
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    placeholder="أدخل سبب الإيقاف أو ملاحظة الاستمرار..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>قطع الغيار</label>
                  {spareParts.map((part, i) => (
                    <div key={i} className={styles.partsRow}>
                      <div className={styles.formGroup}>
                        <input
                          className={styles.formInput}
                          value={part.name}
                          onChange={(e) => updateSparePart(i, 'name', e.target.value)}
                          placeholder="اسم القطعة"
                        />
                      </div>
                      <div className={styles.formGroup} style={{ maxWidth: 80 }}>
                        <input
                          className={styles.formInput}
                          type="number"
                          min={1}
                          value={part.quantity}
                          onChange={(e) => updateSparePart(i, 'quantity', Number(e.target.value))}
                          placeholder="الكمية"
                        />
                      </div>
                      <div className={styles.formGroup} style={{ maxWidth: 100 }}>
                        <input
                          className={styles.formInput}
                          type="number"
                          min={0}
                          value={part.cost || 0}
                          onChange={(e) => updateSparePart(i, 'cost', Number(e.target.value))}
                          placeholder="التكلفة"
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removePartBtn}
                        onClick={() => removeSparePart(i)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className={styles.addPartBtn} onClick={addSparePart}>
                    <Plus size={14} style={{ display: 'inline' }} /> إضافة قطعة
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>تقرير الفني</label>
                  <textarea
                    className={styles.formTextarea}
                    value={technicianReport}
                    onChange={(e) => setTechnicianReport(e.target.value)}
                    placeholder="أدخل تقرير الفني..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>أجرة فني الصيانة (ل.س)</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min={0}
                    value={technicianFee}
                    onChange={(e) => setTechnicianFee(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>أجرة الشركة (ل.س)</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min={0}
                    value={companyFee}
                    onChange={(e) => setCompanyFee(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </>
            )}

            <div className={styles.formActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowFinishModal(false)}
              >
                إلغاء
              </button>
              <button
                className={styles.btnFinish}
                onClick={handleFinish}
                disabled={!!actionLoading}
              >
                {actionLoading ? 'جاري الإنهاء...' : 'إنهاء وإرسال التقرير'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 className={styles.modalTitle}>رفض المهمة</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>سبب الرفض *</label>
              <textarea
                className={styles.formTextarea}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب رفض المهمة..."
                rows={4}
              />
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowRejectModal(false)}
              >
                إلغاء
              </button>
              <button
                className={styles.btnReject}
                onClick={handleReject}
                disabled={!!actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? 'جاري الرفض...' : 'رفض المهمة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
