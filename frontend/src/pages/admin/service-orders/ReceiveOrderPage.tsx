import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, Save } from 'lucide-react';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { CreateServiceOrderRequest, ApiMachineCondition } from '../../../shared/api/types';
import styles from './ServiceOrders.module.css';

const EMPTY_FORM: CreateServiceOrderRequest = {
  machineType: '',
  machineDetails: '',
  serialNumber: '',
  customer: '',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  customerNotes: '',
  warranty: false,
  expectedDeliveryDate: '',
  condition: 'complete' as ApiMachineCondition,
  customerProblemDesc: '',
};

export default function ReceiveOrderPage() {
  const navigate = useNavigate();
  const {
    customers,
    machineTypes,
    error,
    fetchCustomers,
    fetchMachineTypes,
    createOrder,
    clearError,
  } = useServiceOrdersStore();

  const [form, setForm] = useState<CreateServiceOrderRequest>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchMachineTypes();
    clearError();
  }, [fetchCustomers, fetchMachineTypes, clearError]);

  // When customer is selected from dropdown, auto-fill info
  const handleCustomerChange = useCallback(
    (customerId: string) => {
      setForm((prev) => {
        if (!customerId) {
          return { ...prev, customer: '', customerName: '', customerPhone: '', customerAddress: '' };
        }
        const c = customers.find((c) => c._id === customerId);
        if (c) {
          return {
            ...prev,
            customer: c._id,
            customerName: c.name,
            customerPhone: c.phone,
            customerAddress: c.address || '',
            customerNotes: c.notes || '',
          };
        }
        return { ...prev, customer: customerId };
      });
    },
    [customers],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.customerName.trim()) return;
      setSaving(true);
      try {
        // Clean up empty strings — don't send them as IDs
        const payload = { ...form };
        if (!payload.machineType) delete payload.machineType;
        if (!payload.customer) delete payload.customer;
        if (!payload.expectedDeliveryDate) delete payload.expectedDeliveryDate;

        await createOrder(payload);
        navigate('/admin/maintenance/service-orders');
      } catch {
        /* error in store */
      } finally {
        setSaving(false);
      }
    },
    [form, createOrder, navigate],
  );

  return (
    <div className={styles.formPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <ClipboardList size={24} />
            استقبال أمر خدمة جديد
          </h1>
          <p className={styles.pageSubtitle}>
            تعبئة نموذج الاستقبال لأمر صيانة جديد
          </p>
        </div>
        <button
          className={styles.btnSecondary}
          onClick={() => navigate('/admin/maintenance/service-orders')}
        >
          <ArrowRight size={18} />
          رجوع
        </button>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* === Section: Customer === */}
          <div className={styles.formSectionTitle}>بيانات الزبون</div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              اختيار زبون موجود
            </label>
            <select
              className={styles.formSelect}
              value={form.customer || ''}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">— زبون جديد —</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              اسم الزبون <span className={styles.formRequired}>*</span>
            </label>
            <input
              className={styles.formInput}
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>رقم الهاتف</label>
            <input
              className={styles.formInput}
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>العنوان</label>
            <input
              className={styles.formInput}
              value={form.customerAddress}
              onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
            />
          </div>

          {/* === Section: Machine === */}
          <div className={styles.formSectionTitle}>بيانات الآلة</div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>نوع الآلة</label>
            <select
              className={styles.formSelect}
              value={form.machineType || ''}
              onChange={(e) => setForm({ ...form, machineType: e.target.value })}
            >
              <option value="">— اختيار نوع —</option>
              {machineTypes.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>تفاصيل الآلة / الموديل</label>
            <input
              className={styles.formInput}
              placeholder="مثال: مفرمة لحمة 32"
              value={form.machineDetails}
              onChange={(e) => setForm({ ...form, machineDetails: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>الرقم التسلسلي</label>
            <input
              className={styles.formInput}
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>حالة الآلة عند الاستلام</label>
            <select
              className={styles.formSelect}
              value={form.condition}
              onChange={(e) =>
                setForm({ ...form, condition: e.target.value as ApiMachineCondition })
              }
            >
              <option value="complete">كاملة</option>
              <option value="incomplete">ناقصة</option>
            </select>
          </div>

          {/* === Section: Service Details === */}
          <div className={styles.formSectionTitle}>تفاصيل الخدمة</div>

          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel}>وصف المشكلة من الزبون</label>
            <textarea
              className={styles.formTextarea}
              value={form.customerProblemDesc}
              onChange={(e) =>
                setForm({ ...form, customerProblemDesc: e.target.value })
              }
              placeholder="وصف المشكلة التي يشكو منها الزبون..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>تاريخ التسليم المتوقع</label>
            <input
              type="date"
              className={styles.formInput}
              value={form.expectedDeliveryDate}
              onChange={(e) =>
                setForm({ ...form, expectedDeliveryDate: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formCheckboxLabel}>
              <input
                type="checkbox"
                className={styles.formCheckbox}
                checked={form.warranty}
                onChange={(e) => setForm({ ...form, warranty: e.target.checked })}
              />
              تحت الكفالة
            </label>
          </div>

          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel}>ملاحظات الزبون</label>
            <textarea
              className={styles.formTextarea}
              value={form.customerNotes}
              onChange={(e) =>
                setForm({ ...form, customerNotes: e.target.value })
              }
              placeholder="ملاحظات إضافية..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate('/admin/maintenance/service-orders')}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={saving || !form.customerName.trim()}
          >
            {saving ? (
              <LoadingSpinner />
            ) : (
              <>
                <Save size={18} />
                حفظ أمر الخدمة
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
