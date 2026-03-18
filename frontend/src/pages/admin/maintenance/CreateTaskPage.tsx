import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, ClipboardList, Search } from 'lucide-react';
import { useMaintenanceStore } from '../../../shared/store/maintenanceStore';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import type { ApiTaskPriority, ApiTechnician, ApiServiceOrder, ApiMachineType } from '../../../shared/api/types';
import styles from './MaintenancePage.module.css';

/* ── helpers ── */
const ORDER_STATUS_LABELS: Record<string, string> = {
  waiting: 'بانتظار الصيانة',
  in_maintenance: 'قيد الصيانة',
  postponed: 'مؤجل',
  ready: 'جاهز',
  delivered: 'تم التسليم',
};

function getMachineTypeName(order: ApiServiceOrder): string {
  if (order.machineType && typeof order.machineType !== 'string') {
    return (order.machineType as ApiMachineType).name;
  }
  return '';
}

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const { createTask, fetchTechnicians, technicians, error, clearError } =
    useMaintenanceStore();
  const { orders, fetchOrders, loading: ordersLoading } = useServiceOrdersStore();

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ApiTaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTechnicians();
    fetchOrders();           // load all service orders
    return () => clearError();
  }, [fetchTechnicians, fetchOrders, clearError]);

  /* filter orders by search text */
  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.trim().toLowerCase();
    const machine = getMachineTypeName(o);
    return (
      String(o.formNumber).includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      machine.toLowerCase().includes(q) ||
      o.machineDetails.toLowerCase().includes(q)
    );
  });

  const selectedOrder = orders.find((o) => o._id === selectedOrderId) || null;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedOrderId) return;

      setSubmitting(true);
      try {
        await createTask({
          serviceOrder: selectedOrderId,
          description: description.trim() || undefined,
          priority,
          assignedTo: assignedTo || undefined,
          scheduledDate: scheduledDate || undefined,
          scheduledStartTime: scheduledStartTime || undefined,
          scheduledEndTime: scheduledEndTime || undefined,
        });
        navigate('/admin/maintenance/tasks');
      } catch {
        // error handled by store
      } finally {
        setSubmitting(false);
      }
    },
    [selectedOrderId, description, priority, assignedTo, scheduledDate, scheduledStartTime, scheduledEndTime, createTask, navigate],
  );

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

      <h1 className={styles.pageTitle}>
        <Plus size={24} />
        إنشاء مهمة صيانة جديدة
      </h1>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* ── Service Order Selector ── */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <ClipboardList size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            اختر أمر الخدمة *
          </label>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={16} style={{ position: 'absolute', top: 12, right: 12, color: '#9ca3af' }} />
            <input
              className={styles.formInput}
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="ابحث برقم الأمر، اسم الزبون، أو نوع الجهاز..."
              style={{ paddingRight: 36 }}
            />
          </div>

          {/* Orders list */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            maxHeight: 260,
            overflowY: 'auto',
            background: '#fafbfc',
          }}>
            {ordersLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                جاري تحميل أوامر الخدمة...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                لا توجد أوامر خدمة مطابقة
              </div>
            ) : (
              filteredOrders.map((order) => {
                const machine = getMachineTypeName(order);
                const isSelected = selectedOrderId === order._id;
                return (
                  <div
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                      borderRight: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <strong style={{ color: '#1f2937' }}>#{order.formNumber}</strong>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: order.status === 'waiting' ? '#fef3c7' : order.status === 'in_maintenance' ? '#e0e7ff' : '#f3f4f6',
                          color: order.status === 'waiting' ? '#92400e' : order.status === 'in_maintenance' ? '#3730a3' : '#6b7280',
                        }}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        {order.customerName}
                        {machine && ` • ${machine}`}
                        {order.machineDetails && ` — ${order.machineDetails}`}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: '1.1rem', marginRight: 8 }}>✓</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Selected Order Summary ── */}
        {selectedOrder && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 4,
          }}>
            <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 8, fontSize: '0.95rem' }}>
              📋 ملخص أمر الخدمة #{selectedOrder.formNumber}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.85rem', color: '#374151' }}>
              <div><strong>الزبون:</strong> {selectedOrder.customerName}</div>
              <div><strong>الهاتف:</strong> {selectedOrder.customerPhone || '—'}</div>
              <div><strong>الجهاز:</strong> {getMachineTypeName(selectedOrder) || '—'} {selectedOrder.machineDetails && `— ${selectedOrder.machineDetails}`}</div>
              <div><strong>الرقم التسلسلي:</strong> {selectedOrder.serialNumber || '—'}</div>
              <div><strong>العنوان:</strong> {selectedOrder.customerAddress || '—'}</div>
              <div><strong>وصف المشكلة:</strong> {selectedOrder.customerProblemDesc || '—'}</div>
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ملاحظات إضافية</label>
          <textarea
            className={styles.formTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="أي تفاصيل إضافية للفني عن المهمة..."
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>الأولوية</label>
            <select
              className={styles.formSelect}
              value={priority}
              onChange={(e) => setPriority(e.target.value as ApiTaskPriority)}
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>تعيين فني (اختياري)</label>
            <select
              className={styles.formSelect}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">— بدون تعيين —</option>
              {technicians.map((tech: ApiTechnician) => (
                <option key={tech._id} value={tech._id}>
                  {tech.name} ({tech.technicianStatus === 'available' ? 'متاح' : tech.technicianStatus === 'on_task' ? 'في مهمة' : 'خارج الخدمة'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Scheduling (Calendar) ── */}
        <div className={styles.formRow} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>تاريخ المهمة</label>
            <input
              className={styles.formInput}
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>من الساعة</label>
            <input
              className={styles.formInput}
              type="time"
              value={scheduledStartTime}
              onChange={(e) => setScheduledStartTime(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>إلى الساعة</label>
            <input
              className={styles.formInput}
              type="time"
              value={scheduledEndTime}
              onChange={(e) => setScheduledEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate('/admin/maintenance/tasks')}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={submitting || !selectedOrderId}
          >
            {submitting ? 'جاري الإنشاء...' : 'إنشاء المهمة'}
          </button>
        </div>
      </form>
    </div>
  );
}
