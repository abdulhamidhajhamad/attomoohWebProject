import { useEffect, useState, useCallback, useRef } from 'react';
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
  Plus,
  X,
  Circle,
  CalendarDays,
  List,
} from 'lucide-react';
import { useMaintenanceStore } from '../../shared/store/maintenanceStore';
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

function calcLiveDuration(task: ApiMaintenanceTask): number {
  let totalMs = task.totalDurationMs || 0;

  // If currently in_progress, add time since last start/resume
  if (task.status === 'in_progress' && task.timeLogs.length > 0) {
    const lastLog = [...task.timeLogs].reverse().find(
      (l) => l.action === 'start' || l.action === 'resume',
    );
    if (lastLog) {
      totalMs += Date.now() - new Date(lastLog.timestamp).getTime();
    }
  }

  return totalMs;
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
  const {
    myTasks,
    calendarTasks,
    myStatus,
    loading,
    fetchMyTasks,
    fetchCalendarTasks,
    fetchMyStatus,
    updateMyStatus,
    startTask,
    pauseTask,
    resumeTask,
    finishTask,
  } = useMaintenanceStore();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // View mode: 'tasks' (original) or 'calendar'
  const [viewMode, setViewMode] = useState<'tasks' | 'calendar'>('tasks');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [scheduleTasks, setScheduleTasks] = useState<ApiMaintenanceTask[]>([]);

  // Finish form state
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishTaskId, setFinishTaskId] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [solutionDesc, setSolutionDesc] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [notes, setNotes] = useState('');
  const [usedParts, setUsedParts] = useState<{ name: string; quantity: number; cost: number }[]>([]);

  useEffect(() => {
    fetchMyTasks();
    fetchMyStatus();
  }, [fetchMyTasks, fetchMyStatus]);

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

  const mergedCalendarTasks = [...calendarTasks, ...scheduleTasks];

  // Timer tick — update every second for live display
  useEffect(() => {
    const hasActive = myTasks.some((t) => t.status === 'in_progress');
    if (hasActive) {
      timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [myTasks]);

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

  const handleAction = useCallback(
    async (taskId: string, action: 'start' | 'pause' | 'resume') => {
      setActionLoading(taskId);
      try {
        if (action === 'start') await startTask(taskId);
        else if (action === 'pause') await pauseTask(taskId);
        else if (action === 'resume') await resumeTask(taskId);
        await fetchMyTasks();
      } catch { /* handled by store */ }
      setActionLoading(null);
    },
    [startTask, pauseTask, resumeTask, fetchMyTasks],
  );

  const openFinishForm = useCallback((taskId: string) => {
    setFinishTaskId(taskId);
    setProblemDesc('');
    setSolutionDesc('');
    setLaborCost('');
    setNotes('');
    setUsedParts([]);
    setShowFinishModal(true);
  }, []);

  const handleFinish = useCallback(async () => {
    if (!finishTaskId) return;
    setActionLoading(finishTaskId);
    try {
      const report: TaskReportRequest = {
        problemDescription: problemDesc.trim() || undefined,
        solutionDescription: solutionDesc.trim() || undefined,
        laborCost: laborCost ? Number(laborCost) : undefined,
        notes: notes.trim() || undefined,
        usedParts: usedParts.length > 0 ? usedParts.filter((p) => p.name) : undefined,
      };
      await finishTask(finishTaskId, report);
      setShowFinishModal(false);
      await fetchMyTasks();
    } catch { /* handled */ }
    setActionLoading(null);
  }, [finishTaskId, problemDesc, solutionDesc, laborCost, notes, usedParts, finishTask, fetchMyTasks]);

  const addPart = () => setUsedParts([...usedParts, { name: '', quantity: 1, cost: 0 }]);
  const removePart = (i: number) => setUsedParts(usedParts.filter((_, idx) => idx !== i));
  const updatePart = (i: number, field: keyof typeof usedParts[number], value: string | number) => {
    const copy = [...usedParts];
    copy[i] = { ...copy[i], [field]: value };
    setUsedParts(copy);
  };

  // Separate active tasks and completed/cancelled
  const baseActiveTasks = myTasks.filter((t) =>
    ['assigned', 'in_progress', 'paused'].includes(t.status),
  );
  const activeScheduleTasks = scheduleTasks.filter((t) => t.status !== 'cancelled');
  const activeTasks = [...baseActiveTasks, ...activeScheduleTasks];
  const completedTasks = myTasks.filter((t) =>
    ['completed', 'cancelled'].includes(t.status),
  );

  if (loading && myTasks.length === 0) {
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
          />
        ) : (
        <>
        {/* Active Tasks */}
        <h2 className={styles.sectionTitle}>
          <ClipboardList size={20} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
          المهام النشطة ({activeTasks.length})
        </h2>

        {activeTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={48} />
            <p>لا توجد مهام نشطة حالياً</p>
          </div>
        ) : (
          activeTasks.map((task) => {
            const statusInfo = STATUS_MAP[task.status];
            const priorityInfo = PRIORITY_MAP[task.priority];
            const isInProgress = task.status === 'in_progress';
            const isPaused = task.status === 'paused';
            const isAssigned = task.status === 'assigned';
            const isSyntheticSchedule = task._id.startsWith('tech-schedule-');
            const liveDuration = calcLiveDuration(task);

            return (
              <div key={task._id} className={styles.taskCardTech}>
                <div className={styles.taskCardHeader}>
                  <h3 className={styles.taskCardTitle}>{task.title}</h3>
                  <span
                    className={styles.statusBadge}
                    style={{ background: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div className={styles.taskCardMeta}>
                  {task.machineInfo && <span>🔧 {task.machineInfo}</span>}
                  {task.location && <span>📍 {task.location}</span>}
                  <span
                    className={styles.priorityBadge}
                    style={{ color: priorityInfo.color, borderColor: priorityInfo.color }}
                  >
                    {priorityInfo.label}
                  </span>
                </div>

                {/* Timer */}
                {(isInProgress || isPaused) && (
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
                  {task._id.startsWith('tech-schedule-') && (
                    <button className={styles.btnPause} disabled>
                      هذه مهمة مجدولة
                    </button>
                  )}

                  {isAssigned && !isSyntheticSchedule && (
                    <button
                      className={styles.btnStart}
                      onClick={() => handleAction(task._id, 'start')}
                      disabled={actionLoading === task._id}
                    >
                      <Play size={16} />
                      بدء العمل
                    </button>
                  )}

                  {isInProgress && !isSyntheticSchedule && (
                    <>
                      <button
                        className={styles.btnPause}
                        onClick={() => handleAction(task._id, 'pause')}
                        disabled={actionLoading === task._id}
                      >
                        <Pause size={16} />
                        إيقاف مؤقت
                      </button>
                      <button
                        className={styles.btnFinish}
                        onClick={() => openFinishForm(task._id)}
                        disabled={actionLoading === task._id}
                      >
                        <CheckCircle2 size={16} />
                        إنهاء المهمة
                      </button>
                    </>
                  )}

                  {isPaused && !isSyntheticSchedule && (
                    <>
                      <button
                        className={styles.btnResume}
                        onClick={() => handleAction(task._id, 'resume')}
                        disabled={actionLoading === task._id}
                      >
                        <RotateCcw size={16} />
                        استئناف
                      </button>
                      <button
                        className={styles.btnFinish}
                        onClick={() => openFinishForm(task._id)}
                        disabled={actionLoading === task._id}
                      >
                        <CheckCircle2 size={16} />
                        إنهاء المهمة
                      </button>
                    </>
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
              const statusInfo = STATUS_MAP[task.status];
              return (
                <div key={task._id} className={styles.taskCardTech} style={{ opacity: 0.7 }}>
                  <div className={styles.taskCardHeader}>
                    <h3 className={styles.taskCardTitle}>{task.title}</h3>
                    <span
                      className={styles.statusBadge}
                      style={{ background: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className={styles.taskCardMeta}>
                    {task.machineInfo && <span>🔧 {task.machineInfo}</span>}
                    <span>
                      <Clock size={14} style={{ display: 'inline' }} />{' '}
                      {formatTimer(task.totalDurationMs)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
        </>
        )}
      </div>
      {showFinishModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFinishModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>تقرير إنهاء المهمة</h3>

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

            {/* Used Parts */}
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
              <label className={styles.formLabel}>تكلفة العمالة (₪)</label>
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
    </div>
  );
}

