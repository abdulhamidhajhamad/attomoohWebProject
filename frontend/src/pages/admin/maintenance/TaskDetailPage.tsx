import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Users,
  FileText,
  Trash2,
  XCircle,
  UserPlus,
  MapPin,
  Info,
  ClipboardList,
} from 'lucide-react';
import { useMaintenanceStore } from '../../../shared/store/maintenanceStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiMaintenanceTask, ApiTechnician, ApiTaskStatus, ApiServiceOrder, ApiMachineType } from '../../../shared/api/types';
import styles from './MaintenancePage.module.css';

const STATUS_MAP: Record<ApiTaskStatus, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: '#f59e0b' },
  assigned: { label: 'معيّنة', color: '#3b82f6' },
  in_progress: { label: 'قيد التنفيذ', color: '#8b5cf6' },
  paused: { label: 'متوقفة مؤقتاً', color: '#ef4444' },
  completed: { label: 'مكتملة', color: '#10b981' },
  cancelled: { label: 'ملغاة', color: '#6b7280' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: '#6b7280' },
  medium: { label: 'متوسطة', color: '#f59e0b' },
  high: { label: 'عالية', color: '#ef4444' },
  urgent: { label: 'عاجلة', color: '#dc2626' },
};

const ACTION_LABELS: Record<string, string> = {
  start: 'بدء العمل',
  pause: 'إيقاف مؤقت',
  resume: 'استئناف',
  finish: 'إنهاء المهمة',
};

const ACTION_COLORS: Record<string, string> = {
  start: '#10b981',
  pause: '#f59e0b',
  resume: '#3b82f6',
  finish: '#8b5cf6',
};

function formatDuration(ms: number): string {
  if (ms === 0) return '—';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}س ${m}د`;
  if (m > 0) return `${m}د ${s}ث`;
  return `${s}ث`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    fetchTaskById,
    assignTask,
    cancelTask,
    deleteTask,
    fetchTechnicians,
    technicians,
  } = useMaintenanceStore();

  const [task, setTask] = useState<ApiMaintenanceTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTech, setSelectedTech] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchTaskById(id)
      .then((t) => { if (!cancelled) setTask(t); })
      .finally(() => { if (!cancelled) setLoading(false); });
    fetchTechnicians();
    return () => { cancelled = true; };
  }, [id, fetchTaskById, fetchTechnicians]);

  const handleAssign = useCallback(async () => {
    if (!id || !selectedTech) return;
    try {
      await assignTask(id, { technicianId: selectedTech });
      const updated = await fetchTaskById(id);
      setTask(updated);
      setShowAssignModal(false);
      setSelectedTech('');
    } catch { /* handled */ }
  }, [id, selectedTech, assignTask, fetchTaskById]);

  const handleCancel = useCallback(async () => {
    if (!id || !confirm('هل تريد إلغاء هذه المهمة؟')) return;
    try {
      await cancelTask(id);
      const updated = await fetchTaskById(id);
      setTask(updated);
    } catch { /* handled */ }
  }, [id, cancelTask, fetchTaskById]);

  const handleDelete = useCallback(async () => {
    if (!id || !confirm('هل تريد حذف هذه المهمة نهائياً؟')) return;
    try {
      await deleteTask(id);
      navigate('/admin/maintenance/tasks');
    } catch { /* handled */ }
  }, [id, deleteTask, navigate]);

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <p>المهمة غير موجودة</p>
          <Link to="/admin/maintenance/tasks" className={styles.btnPrimary}>
            العودة
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[task.status];
  const priorityInfo = PRIORITY_MAP[task.priority];
  const assigneeName =
    task.assignedTo && typeof task.assignedTo !== 'string'
      ? task.assignedTo.name
      : 'غير معيّن';
  const creatorName =
    task.createdBy && typeof task.createdBy !== 'string'
      ? task.createdBy.name
      : '—';
  const isActive = !['completed', 'cancelled'].includes(task.status);
  const hasReport =
    task.report &&
    (task.report.problemDescription || task.report.solutionDescription);

  return (
    <div className={styles.page}>
      <a
        href="#"
        className={styles.backLink}
        onClick={(e) => {
          e.preventDefault();
          navigate('/admin/maintenance/tasks');
        }}
      >
        <ArrowRight size={16} />
        العودة إلى الصيانة
      </a>

      {/* Header */}
      <div className={styles.detailHeader}>
        <div>
          <h1 className={styles.pageTitle}>{task.title}</h1>
          <span
            className={styles.statusBadge}
            style={{ background: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>
        {isActive && (
          <div className={styles.headerActions}>
            <button
              className={styles.btnSecondary}
              onClick={() => setShowAssignModal(true)}
            >
              <UserPlus size={16} />
              تعيين فني
            </button>
            <button className={styles.btnDanger} onClick={handleCancel}>
              <XCircle size={16} />
              إلغاء
            </button>
            <button className={styles.btnDanger} onClick={handleDelete}>
              <Trash2 size={16} />
              حذف
            </button>
          </div>
        )}
      </div>

      {/* Detail Grid */}
      <div className={styles.detailGrid}>
        {/* Left — Main Info */}
        <div>
          {/* Info Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Info size={18} />
              تفاصيل المهمة
            </h2>

            {task.description && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>الوصف</span>
                <span className={styles.infoValue}>{task.description}</span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>الأولوية</span>
              <span
                className={styles.priorityBadge}
                style={{ color: priorityInfo.color, borderColor: priorityInfo.color }}
              >
                {priorityInfo.label}
              </span>
            </div>

            {task.machineInfo && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>الجهاز</span>
                <span className={styles.infoValue}>🔧 {task.machineInfo}</span>
              </div>
            )}

            {task.location && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>الموقع</span>
                <span className={styles.infoValue}>
                  <MapPin size={14} style={{ display: 'inline' }} /> {task.location}
                </span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>الفني المعيّن</span>
              <span className={styles.infoValue}>
                <Users size={14} style={{ display: 'inline' }} /> {assigneeName}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>أنشأها</span>
              <span className={styles.infoValue}>{creatorName}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>تاريخ الإنشاء</span>
              <span className={styles.infoValue}>{formatDateTime(task.createdAt)}</span>
            </div>

            {task.completedAt && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>تاريخ الإكمال</span>
                <span className={styles.infoValue}>{formatDateTime(task.completedAt)}</span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>مدة العمل</span>
              <span className={styles.infoValue}>
                <Clock size={14} style={{ display: 'inline' }} />{' '}
                {formatDuration(task.totalDurationMs)}
              </span>
            </div>
          </div>

          {/* Service Order Card */}
          {task.serviceOrder && typeof task.serviceOrder !== 'string' && (() => {
            const order = task.serviceOrder as ApiServiceOrder;
            const machineTypeName = order.machineType && typeof order.machineType !== 'string'
              ? (order.machineType as ApiMachineType).name
              : '';
            return (
              <div className={styles.card} style={{ marginTop: 20 }}>
                <h2 className={styles.cardTitle}>
                  <ClipboardList size={18} />
                  أمر الخدمة المرتبط
                </h2>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>رقم الأمر</span>
                  <span className={styles.infoValue}>
                    <Link to={`/admin/maintenance/service-orders/${order._id}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                      #{order.formNumber}
                    </Link>
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>الزبون</span>
                  <span className={styles.infoValue}>{order.customerName}</span>
                </div>

                {order.customerPhone && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>الهاتف</span>
                    <span className={styles.infoValue}>{order.customerPhone}</span>
                  </div>
                )}

                {machineTypeName && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>نوع الجهاز</span>
                    <span className={styles.infoValue}>🔧 {machineTypeName}</span>
                  </div>
                )}

                {order.machineDetails && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>تفاصيل الجهاز</span>
                    <span className={styles.infoValue}>{order.machineDetails}</span>
                  </div>
                )}

                {order.serialNumber && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>الرقم التسلسلي</span>
                    <span className={styles.infoValue}>{order.serialNumber}</span>
                  </div>
                )}

                {order.customerAddress && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>العنوان</span>
                    <span className={styles.infoValue}>
                      <MapPin size={14} style={{ display: 'inline' }} /> {order.customerAddress}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Report Card (only if task is completed) */}
          {hasReport && (
            <div className={styles.card} style={{ marginTop: 20 }}>
              <h2 className={styles.cardTitle}>
                <FileText size={18} />
                تقرير الإنجاز
              </h2>

              {task.report.problemDescription && (
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>وصف المشكلة</div>
                  <div className={styles.reportFieldValue}>
                    {task.report.problemDescription}
                  </div>
                </div>
              )}

              {task.report.solutionDescription && (
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>الحل المطبّق</div>
                  <div className={styles.reportFieldValue}>
                    {task.report.solutionDescription}
                  </div>
                </div>
              )}

              {task.report.usedParts && task.report.usedParts.length > 0 && (
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>القطع المستخدمة</div>
                  <div className={styles.partsList}>
                    {task.report.usedParts.map((part, i) => (
                      <div key={i} className={styles.partItem}>
                        <span>{part.name} × {part.quantity}</span>
                        {part.cost > 0 && <span>{part.cost} ₪</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.report.laborCost > 0 && (
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>تكلفة العمالة</div>
                  <div className={styles.reportFieldValue}>
                    {task.report.laborCost} ₪
                  </div>
                </div>
              )}

              {task.report.notes && (
                <div className={styles.reportField}>
                  <div className={styles.reportFieldLabel}>ملاحظات</div>
                  <div className={styles.reportFieldValue}>
                    {task.report.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Timeline */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Clock size={18} />
            سجل الأحداث
          </h2>

          {task.timeLogs.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              لم يبدأ العمل بعد
            </p>
          ) : (
            <div className={styles.timeline}>
              {task.timeLogs.map((log, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div
                    className={styles.timelineDot}
                    style={{ background: ACTION_COLORS[log.action] || '#6b7280' }}
                  />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineAction}>
                      {ACTION_LABELS[log.action] || log.action}
                    </div>
                    <div className={styles.timelineTime}>
                      {formatDateTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>تعيين فني للمهمة</h3>

            {technicians.length === 0 ? (
              <p style={{ color: '#6b7280' }}>لا يوجد فنيين مسجلين</p>
            ) : (
              technicians.map((tech: ApiTechnician) => (
                <div
                  key={tech._id}
                  className={`${styles.techSelectItem} ${selectedTech === tech._id ? styles.techSelectItemActive : ''}`}
                  onClick={() => setSelectedTech(tech._id)}
                >
                  <div>
                    <strong>{tech.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {tech.email}
                    </div>
                  </div>
                  <span
                    className={styles.techStatusBadge}
                    style={{
                      background:
                        tech.technicianStatus === 'available'
                          ? '#dcfce7'
                          : tech.technicianStatus === 'on_task'
                          ? '#fef3c7'
                          : '#f3f4f6',
                      color:
                        tech.technicianStatus === 'available'
                          ? '#16a34a'
                          : tech.technicianStatus === 'on_task'
                          ? '#d97706'
                          : '#6b7280',
                    }}
                  >
                    {tech.technicianStatus === 'available'
                      ? 'متاح'
                      : tech.technicianStatus === 'on_task'
                      ? 'في مهمة'
                      : 'خارج الخدمة'}
                  </span>
                </div>
              ))
            )}

            <div className={styles.formActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowAssignModal(false)}
              >
                إلغاء
              </button>
              <button
                className={styles.btnPrimary}
                disabled={!selectedTech}
                onClick={handleAssign}
              >
                تعيين
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
