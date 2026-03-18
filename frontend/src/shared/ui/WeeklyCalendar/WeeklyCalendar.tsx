/**
 * WeeklyCalendar — Shared calendar component for maintenance scheduling
 *
 * Used by both Admin (MaintenancePage) and Technician (TechnicianDashboard).
 *   - Admin: editable=true, shows all technicians, can filter
 *   - Technician: editable=false, shows own tasks only
 *
 * Design:
 *   - X axis = 7 days (Sun–Sat), navigable ← →
 *   - Y axis = hours (START_HOUR..END_HOUR)
 *   - Each task renders as a colored block positioned by scheduledStartTime/scheduledEndTime
 *   - Tasks without scheduling appear in "all-day" row
 */

import { useMemo, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import type { ApiMaintenanceTask, ApiTechnician, ApiTaskStatus } from '../../api/types';
import styles from './WeeklyCalendar.module.css';

/* ═══════════════════════════════════
   Constants
   ═══════════════════════════════════ */

/** Calendar displays hours from START_HOUR to END_HOUR */
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const HOUR_HEIGHT = 60; // px per hour

const DAY_NAMES_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const STATUS_COLORS: Record<ApiTaskStatus, string> = {
  pending: '#f59e0b',
  assigned: '#3b82f6',
  in_progress: '#8b5cf6',
  paused: '#ef4444',
  completed: '#10b981',
  cancelled: '#6b7280',
};

/* ═══════════════════════════════════
   Helpers
   ═══════════════════════════════════ */

/** Get the Sunday (start) of the week containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d;
}

/** Format date as YYYY-MM-DD */
export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Generate 7 days starting from weekStart */
function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Parse "HH:mm" → fractional hours from START_HOUR. Returns null if invalid. */
function timeToOffset(time: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60 - START_HOUR;
}

/** Check if two dates are the same calendar day */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Format "HH:mm" label */
function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

/** Get assignee name from task */
function getAssigneeName(task: ApiMaintenanceTask): string {
  if (!task.assignedTo) return '';
  if (typeof task.assignedTo === 'string') return task.assignedTo;
  return task.assignedTo.name;
}

/* ═══════════════════════════════════
   Props
   ═══════════════════════════════════ */

export interface WeeklyCalendarProps {
  /** Tasks to display (already filtered by date range from store) */
  tasks: ApiMaintenanceTask[];
  /** The Sunday of the current week */
  weekStart: Date;
  /** Navigate to a different week */
  onWeekChange: (newStart: Date) => void;
  /** When a task block is clicked */
  onTaskClick?: (task: ApiMaintenanceTask) => void;
  /** Technician list for the filter dropdown (admin only) */
  technicians?: ApiTechnician[];
  /** Currently selected technician filter */
  selectedTechnician?: string;
  /** Callback when technician filter changes */
  onTechnicianChange?: (technicianId: string) => void;
  /** Whether task blocks show assignee name */
  showAssignee?: boolean;
}

/* ═══════════════════════════════════
   Component
   ═══════════════════════════════════ */

export default function WeeklyCalendar({
  tasks,
  weekStart,
  onWeekChange,
  onTaskClick,
  technicians,
  selectedTechnician,
  onTechnicianChange,
  showAssignee = true,
}: WeeklyCalendarProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = useMemo(() => new Date(), []);

  /** Build week label like "1 – 7 آذار 2026" */
  const weekLabel = useMemo(() => {
    const first = days[0];
    const last = days[6];
    const monthFormatter = new Intl.DateTimeFormat('ar', { month: 'long' });
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()} – ${last.getDate()} ${monthFormatter.format(first)} ${first.getFullYear()}`;
    }
    return `${first.getDate()} ${monthFormatter.format(first)} – ${last.getDate()} ${monthFormatter.format(last)} ${last.getFullYear()}`;
  }, [days]);

  /** Group tasks by day index (0–6). Tasks without scheduledDate go to allDay. */
  const { dayTasks, allDayTasks } = useMemo(() => {
    const dayTasks: ApiMaintenanceTask[][] = Array.from({ length: 7 }, () => []);
    const allDayTasks: ApiMaintenanceTask[][] = Array.from({ length: 7 }, () => []);

    for (const task of tasks) {
      if (!task.scheduledDate) continue;
      const taskDate = new Date(task.scheduledDate);
      const dayIdx = days.findIndex((d) => isSameDay(d, taskDate));
      if (dayIdx < 0) continue;

      if (task.scheduledStartTime && task.scheduledEndTime) {
        dayTasks[dayIdx].push(task);
      } else {
        allDayTasks[dayIdx].push(task);
      }
    }

    return { dayTasks, allDayTasks };
  }, [tasks, days]);

  const hasAllDay = allDayTasks.some((arr) => arr.length > 0);

  /* ── Navigation ── */

  const goToPrev = useCallback(() => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    onWeekChange(prev);
  }, [weekStart, onWeekChange]);

  const goToNext = useCallback(() => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    onWeekChange(next);
  }, [weekStart, onWeekChange]);

  const goToToday = useCallback(() => {
    onWeekChange(getWeekStart(new Date()));
  }, [onWeekChange]);

  return (
    <div className={styles.calendarWrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.navGroup}>
          <button className={styles.navBtn} onClick={goToNext} title="الأسبوع القادم">
            <ChevronRight size={18} />
          </button>
          <button className={styles.navBtn} onClick={goToPrev} title="الأسبوع السابق">
            <ChevronLeft size={18} />
          </button>
          <button className={styles.todayBtn} onClick={goToToday}>
            اليوم
          </button>
        </div>

        <span className={styles.weekLabel}>{weekLabel}</span>

        <div className={styles.toolbarActions}>
          {technicians && onTechnicianChange && (
            <select
              className={styles.techFilter}
              value={selectedTechnician || ''}
              onChange={(e) => onTechnicianChange(e.target.value)}
            >
              <option value="">كل الفنيين</option>
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Day Header Row */}
      <div className={styles.calendarGrid}>
        <div className={styles.dayHeaderCorner} />
        {days.map((day, i) => (
          <div
            key={i}
            className={`${styles.dayHeader} ${isSameDay(day, today) ? styles.dayToday : ''}`}
          >
            <div className={styles.dayName}>{DAY_NAMES_AR[day.getDay()]}</div>
            <div className={styles.dayNumber}>{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div className={styles.allDayRow}>
          <div className={styles.allDayLabel}>طوال اليوم</div>
          {days.map((_, dayIdx) => (
            <div key={dayIdx} className={styles.allDayCell}>
              {allDayTasks[dayIdx].map((task) => (
                <span
                  key={task._id}
                  className={styles.allDayChip}
                  style={{ background: STATUS_COLORS[task.status] }}
                  onClick={() => onTaskClick?.(task)}
                  title={task.title}
                >
                  {task.title}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className={styles.scrollContainer}>
        {tasks.length === 0 ? (
          <div className={styles.emptyCalendar}>
            <Calendar size={48} />
            <p>لا توجد مهام مجدولة لهذا الأسبوع</p>
          </div>
        ) : (
          HOURS.map((hour) => (
            <TimeRow
              key={hour}
              hour={hour}
              days={days}
              dayTasks={dayTasks}
              onTaskClick={onTaskClick}
              showAssignee={showAssignee}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   TimeRow — One hour row
   ═══════════════════════════════════ */

interface TimeRowProps {
  hour: number;
  days: Date[];
  dayTasks: ApiMaintenanceTask[][];
  onTaskClick?: (task: ApiMaintenanceTask) => void;
  showAssignee: boolean;
}

function TimeRow({ hour, days, dayTasks, onTaskClick, showAssignee }: TimeRowProps) {
  return (
    <>
      <div className={styles.timeLabel}>{formatHour(hour)}</div>
      {days.map((_, dayIdx) => (
        <DayCell
          key={dayIdx}
          hour={hour}
          tasks={dayTasks[dayIdx]}
          onTaskClick={onTaskClick}
          showAssignee={showAssignee}
        />
      ))}
    </>
  );
}

/* ═══════════════════════════════════
   DayCell — Renders task blocks for one hour slot
   Only the first hour of a multi-hour task renders the block.
   ═══════════════════════════════════ */

interface DayCellProps {
  hour: number;
  tasks: ApiMaintenanceTask[];
  onTaskClick?: (task: ApiMaintenanceTask) => void;
  showAssignee: boolean;
}

function DayCell({ hour, tasks, onTaskClick, showAssignee }: DayCellProps) {
  /**
   * Render blocks that START within this hour slot.
   * We render each block once — in the cell matching its start hour.
   */
  const blocks = tasks.filter((task) => {
    const startOffset = timeToOffset(task.scheduledStartTime);
    if (startOffset === null) return false;
    const startHour = Math.floor(startOffset + START_HOUR);
    return startHour === hour;
  });

  return (
    <div className={styles.dayColumn}>
      {blocks.map((task) => {
        const startOffset = timeToOffset(task.scheduledStartTime)!;
        const endOffset = timeToOffset(task.scheduledEndTime)!;
        const durationHours = Math.max(endOffset - startOffset, 0.25); // minimum visible height

        // Position within the cell: fractional minutes past the hour
        const minutesFraction = (startOffset - Math.floor(startOffset)) * HOUR_HEIGHT;
        const height = durationHours * HOUR_HEIGHT;

        return (
          <div
            key={task._id}
            className={styles.calendarBlock}
            style={{
              top: `${minutesFraction}px`,
              height: `${height}px`,
              background: STATUS_COLORS[task.status],
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick?.(task);
            }}
            title={`${task.title}\n${task.scheduledStartTime} – ${task.scheduledEndTime}`}
          >
            <span className={styles.blockTitle}>{task.title}</span>
            <span className={styles.blockTime}>
              {task.scheduledStartTime} – {task.scheduledEndTime}
            </span>
            {showAssignee && getAssigneeName(task) && (
              <span className={styles.blockAssignee}>{getAssigneeName(task)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
