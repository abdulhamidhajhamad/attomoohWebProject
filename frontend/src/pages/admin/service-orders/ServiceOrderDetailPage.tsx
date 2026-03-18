import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  User,
  Wrench,
  Truck,
  Clock,
  CheckCircle2,
  UserPlus,
  Trash2,
  FileText,
  Package,
} from 'lucide-react';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { useMaintenanceStore } from '../../../shared/store/maintenanceStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiServiceOrder, ApiServiceOrderStatus } from '../../../shared/api/types';
import styles from './ServiceOrders.module.css';

const STATUS_MAP: Record<ApiServiceOrderStatus, { label: string; color: string }> = {
  waiting: { label: 'بانتظار الصيانة', color: '#f59e0b' },
  in_maintenance: { label: 'قيد الصيانة', color: '#8b5cf6' },
  postponed: { label: 'مؤجل', color: '#ef4444' },
  ready: { label: 'جاهز للتسليم', color: '#10b981' },
  delivered: { label: 'تم التسليم', color: '#6b7280' },
};

const CONDITION_MAP: Record<string, string> = {
  complete: 'كاملة',
  incomplete: 'ناقصة',
};

const TIME_ACTION_MAP: Record<string, string> = {
  start: 'بدء العمل',
  pause: 'إيقاف مؤقت',
  resume: 'استئناف',
  finish: 'إنهاء',
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms?: number): string {
  if (!ms || ms === 0) return '—';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h} ساعة ${m} دقيقة`;
  return `${m} دقيقة`;
}

function getName(obj: unknown): string {
  if (!obj) return '—';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && 'name' in obj) return String((obj as Record<string, unknown>).name);
  return '—';
}

export default function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchOrderById, assignOrder, deliverOrder, deleteOrder, error, clearError } =
    useServiceOrdersStore();
  const { technicians, fetchTechnicians } = useMaintenanceStore();

  const [order, setOrder] = useState<ApiServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const o = await fetchOrderById(id);
      setOrder(o);
    } catch {
      /* error in store */
    } finally {
      setLoading(false);
    }
  }, [id, fetchOrderById]);

  useEffect(() => {
    loadOrder();
    fetchTechnicians();
    clearError();
  }, [loadOrder, fetchTechnicians, clearError]);

  const handleAssign = useCallback(async () => {
    if (!id || !selectedTechId) return;
    setActionLoading(true);
    try {
      await assignOrder(id, { technicianId: selectedTechId });
      setShowAssignModal(false);
      await loadOrder();
    } catch {
      /* store error */
    } finally {
      setActionLoading(false);
    }
  }, [id, selectedTechId, assignOrder, loadOrder]);

  const handleDeliver = useCallback(async () => {
    if (!id || !confirm('هل أنت متأكد من تسليم هذا الأمر؟')) return;
    setActionLoading(true);
    try {
      await deliverOrder(id);
      await loadOrder();
    } catch {
      /* store error */
    } finally {
      setActionLoading(false);
    }
  }, [id, deliverOrder, loadOrder]);

  const handleDelete = useCallback(async () => {
    if (!id || !confirm('هل أنت متأكد من حذف هذا الأمر نهائياً؟')) return;
    try {
      await deleteOrder(id);
      navigate('/admin/maintenance/service-orders');
    } catch {
      /* store error */
    }
  }, [id, deleteOrder, navigate]);

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.emptyState}>
          <FileText size={48} />
          <p>لم يتم العثور على أمر الخدمة</p>
          <Link to="/admin/maintenance/service-orders" className={styles.btnSecondary}>
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status];

  return (
    <div className={styles.detailPage}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div>
          <Link to="/admin/maintenance/service-orders" className={styles.backLink}>
            <ArrowRight size={18} />
            رجوع لأوامر الخدمة
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>
            <ClipboardList size={24} />
            أمر خدمة #{order.formNumber}
          </h1>
        </div>
        <span
          className={styles.statusBadge}
          style={{
            background: `${statusInfo.color}18`,
            color: statusInfo.color,
            fontSize: '0.9rem',
            padding: '8px 20px',
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {/* Customer Info */}
      <div className={styles.detailCard}>
        <h3 className={styles.detailCardTitle}>
          <User size={20} />
          بيانات الزبون
        </h3>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>الاسم</span>
            <span className={styles.detailValue}>{order.customerName}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>الهاتف</span>
            <span className={styles.detailValue} dir="ltr" style={{ textAlign: 'right' }}>
              {order.customerPhone || '—'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>العنوان</span>
            <span className={styles.detailValue}>{order.customerAddress || '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>ملاحظات الزبون</span>
            <span className={styles.detailValue}>{order.customerNotes || '—'}</span>
          </div>
        </div>
      </div>

      {/* Machine Info */}
      <div className={styles.detailCard}>
        <h3 className={styles.detailCardTitle}>
          <Wrench size={20} />
          بيانات الآلة
        </h3>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>نوع الآلة</span>
            <span className={styles.detailValue}>{getName(order.machineType)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>تفاصيل / موديل</span>
            <span className={styles.detailValue}>{order.machineDetails || '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>الرقم التسلسلي</span>
            <span className={styles.detailValue}>{order.serialNumber || '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>حالة الآلة عند الاستلام</span>
            <span className={styles.detailValue}>
              {CONDITION_MAP[order.condition] || order.condition}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>تحت الكفالة</span>
            <span className={styles.detailValue}>{order.warranty ? 'نعم ✓' : 'لا'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>وصف المشكلة</span>
            <span className={styles.detailValue}>
              {order.customerProblemDesc || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Dates & Assignment */}
      <div className={styles.detailCard}>
        <h3 className={styles.detailCardTitle}>
          <Clock size={20} />
          التواريخ والتعيين
        </h3>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>تاريخ الاستقبال</span>
            <span className={styles.detailValue}>{formatDate(order.receptionDate)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>التسليم المتوقع</span>
            <span className={styles.detailValue}>
              {formatDate(order.expectedDeliveryDate)}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>تاريخ التسليم الفعلي</span>
            <span className={styles.detailValue}>{formatDate(order.deliveryDate)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>الفني المسؤول</span>
            <span className={styles.detailValue}>{getName(order.assignedTo)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>أنشأ الأمر</span>
            <span className={styles.detailValue}>{getName(order.createdBy)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>مدة العمل الإجمالية</span>
            <span className={styles.detailValue}>{formatDuration(order.totalDurationMs)}</span>
          </div>
        </div>
      </div>

      {/* Time Logs */}
      {order.timeLogs && order.timeLogs.length > 0 && (
        <div className={styles.detailCard}>
          <h3 className={styles.detailCardTitle}>
            <Clock size={20} />
            سجل الأوقات
          </h3>
          <div className={styles.timeLogsList}>
            {order.timeLogs.map((log, i) => (
              <div key={i} className={styles.timeLogItem}>
                <span className={styles.timeLogAction}>
                  {TIME_ACTION_MAP[log.action] || log.action}
                </span>
                <span>{formatDateTime(log.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Report */}
      {order.completionReport && (
        <div className={styles.detailCard}>
          <h3 className={styles.detailCardTitle}>
            <CheckCircle2 size={20} />
            تقرير الإنجاز
          </h3>
          <div className={styles.detailGrid}>
            <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
              <span className={styles.detailLabel}>تقرير الفني</span>
              <span className={styles.detailValue}>
                {order.completionReport.technicianReport || '—'}
              </span>
            </div>
            <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
              <span className={styles.detailLabel}>ملاحظات</span>
              <span className={styles.detailValue}>
                {order.completionReport.notes || '—'}
              </span>
            </div>
          </div>

          {/* Spare Parts */}
          {order.completionReport.spareParts && order.completionReport.spareParts.length > 0 && (
            <>
              <h4 style={{ margin: '16px 0 8px', fontSize: '0.9rem', fontWeight: 600 }}>
                <Package size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                قطع الغيار
              </h4>
              <div className={styles.partsList}>
                {order.completionReport.spareParts.map((p, i) => (
                  <div key={i} className={styles.partItem}>
                    <span className={styles.partName}>{p.name}</span>
                    <span className={styles.partQty}>×{p.quantity}</span>
                    <span className={styles.partCost}>{p.cost.toLocaleString()} ₪</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Cost Summary */}
          <div className={styles.costSummary}>
            <div className={styles.costRow}>
              <span>أجرة الصيانة</span>
              <span>{(order.completionReport.maintenanceFee || 0).toLocaleString()} ₪</span>
            </div>
            {order.completionReport.spareParts && order.completionReport.spareParts.length > 0 && (
              <div className={styles.costRow}>
                <span>تكلفة القطع</span>
                <span>
                  {order.completionReport.spareParts
                    .reduce((sum, p) => sum + p.cost * p.quantity, 0)
                    .toLocaleString()}{' '}
                  ₪
                </span>
              </div>
            )}
            <div className={`${styles.costRow} ${styles.costTotal}`}>
              <span>التكلفة الإجمالية</span>
              <span>{(order.completionReport.totalCost || 0).toLocaleString()} ₪</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div className={styles.detailCard}>
        <h3 className={styles.detailCardTitle}>
          <Wrench size={20} />
          الإجراءات
        </h3>
        <div className={styles.detailActions}>
          {/* Assign technician */}
          {(order.status === 'waiting' || order.status === 'postponed') && (
            <button
              className={styles.btnPrimary}
              onClick={() => setShowAssignModal(true)}
              disabled={actionLoading}
            >
              <UserPlus size={18} />
              تعيين فني
            </button>
          )}

          {/* Deliver */}
          {order.status === 'ready' && (
            <button
              className={styles.btnSuccess}
              onClick={handleDeliver}
              disabled={actionLoading}
            >
              <Truck size={18} />
              تسليم للزبون
            </button>
          )}

          {/* Delete */}
          {order.status !== 'delivered' && (
            <button
              className={styles.btnDanger}
              onClick={handleDelete}
              disabled={actionLoading}
            >
              <Trash2 size={18} />
              حذف الأمر
            </button>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>تعيين فني لهذا الأمر</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>اختر الفني</label>
              <select
                className={styles.formSelect}
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
              >
                <option value="">— اختيار —</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.technicianStatus === 'available' ? 'متاح' : 'مشغول'})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowAssignModal(false)}
              >
                إلغاء
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleAssign}
                disabled={!selectedTechId || actionLoading}
              >
                {actionLoading ? 'جاري...' : 'تعيين'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
