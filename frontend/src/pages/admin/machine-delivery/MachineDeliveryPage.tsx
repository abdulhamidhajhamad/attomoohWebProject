import { useEffect, useState, useCallback } from 'react';
import { Upload, Plus, Search, Trash2, Pencil, X, Check, FileText, Printer, Package } from 'lucide-react';
import { useMachineDeliveryStore } from '../../../shared/store/machineDeliveryStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { ReceptionModal, EMPTY_RECEPTION } from '../../../shared/ui/ReceptionModal';
import { EmployeeSelect, EMPTY_EMPLOYEE } from '../../../shared/ui/EmployeeSelect';
import type { ReceptionValue } from '../../../shared/ui/ReceptionModal';
import type { EmployeeValue } from '../../../shared/ui/EmployeeSelect';
import type { ApiMachineDelivery, ApiMachineReception } from '../../../shared/api/types';
import { generateDeliveryPdf } from './generateDeliveryPdf';
import styles from '../shared/CrudPage.module.css';

interface DeliveryForm {
  reception: ReceptionValue;
  deliveryDate: string;
  notes: string;
  deliveredBy: EmployeeValue;
  technicianReport: string;
  technicianFee: string;
  companyFee: string;
}

const getTodayDateValue = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const EMPTY_FORM: DeliveryForm = {
  reception: { ...EMPTY_RECEPTION },
  deliveryDate: new Date().toISOString().split('T')[0],
  notes: '',
  deliveredBy: { ...EMPTY_EMPLOYEE },
  technicianReport: '',
  technicianFee: '',
  companyFee: '',
};

const parseNonNegativeNumber = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const formToPayload = (
  form: DeliveryForm,
  options: { includeReportFields?: boolean } = {},
) => {
  if (!form.reception.reception) return null;

  const reception = form.reception.reception;
  const machineName = reception.machine && typeof reception.machine === 'object' && 'name' in reception.machine
    ? reception.machine.name
    : reception.machineDetails || '';
  const customerName = reception.customer && typeof reception.customer === 'object' && 'name' in reception.customer
    ? reception.customer.name
    : reception.customerName || '';

  const payload = {
    machineReception: form.reception.id,
    machineName,
    machineDetails: reception.machineDetails || '',
    customerName,
    deliveryDate: form.deliveryDate || new Date().toISOString().split('T')[0],
    notes: form.notes,
    deliveredBy: form.deliveredBy.mode === 'select' && form.deliveredBy.id ? form.deliveredBy.id : undefined,
  };

  if (!options.includeReportFields) {
    return payload;
  }

  const technicianReport = form.technicianReport.trim();
  const technicianFee = parseNonNegativeNumber(form.technicianFee);
  const companyFee = parseNonNegativeNumber(form.companyFee);

  if (!technicianReport || technicianFee === null || companyFee === null) {
    return null;
  }

  return {
    ...payload,
    technicianReport,
    technicianFee,
    companyFee,
  };
};

const deliveryToForm = (d: ApiMachineDelivery): DeliveryForm => {
  let receptionValue: ReceptionValue = { ...EMPTY_RECEPTION };
  if (d.machineReception && typeof d.machineReception === 'object') {
    receptionValue = { id: d.machineReception._id, reception: d.machineReception };
  }

  let deliveredByValue: EmployeeValue = { ...EMPTY_EMPLOYEE };
  if (d.deliveredBy && typeof d.deliveredBy === 'object' && '_id' in d.deliveredBy) {
    deliveredByValue = { id: d.deliveredBy._id, name: d.deliveredBy.name, mode: 'select' };
  }

  return {
    reception: receptionValue,
    deliveryDate: d.deliveryDate ? d.deliveryDate.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: d.notes || '',
    deliveredBy: deliveredByValue,
    technicianReport: '',
    technicianFee: '',
    companyFee: '',
  };
};

const getMachineName = (d: ApiMachineDelivery) => {
  return d.machineName || '—';
};

const getCustomerName = (d: ApiMachineDelivery) => {
  return d.customerName || '—';
};

const getDeliveredByName = (d: ApiMachineDelivery) => {
  if (d.deliveredBy && typeof d.deliveredBy === 'object' && 'name' in d.deliveredBy) return d.deliveredBy.name;
  return '—';
};

const getReceptionId = (d: ApiMachineDelivery) => {
  if (d.machineReception && typeof d.machineReception === 'object' && 'customId' in d.machineReception) {
    return d.machineReception.customId;
  }
  return '—';
};

export default function MachineDeliveryPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMachineDeliveryStore();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue());
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<DeliveryForm>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DeliveryForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(search || undefined), 300);
    return () => clearTimeout(t);
  }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    const payload = formToPayload(addForm, { includeReportFields: true });
    if (!payload) {
      alert('قبل التسليم يجب إدخال تقرير الفني وأجرة الفني وأجرة الشركة بشكل صحيح.');
      return;
    }
    setSaving(true);
    try {
      await createItem(payload as unknown as Record<string, unknown>);
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
    } catch { /* store handles error */ } finally { setSaving(false); }
  }, [addForm, createItem]);

  const startEdit = useCallback((d: ApiMachineDelivery) => {
    setEditId(d._id);
    setEditForm(deliveryToForm(d));
    setShowAdd(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    const payload = formToPayload(editForm);
    if (!payload) return;
    setSaving(true);
    try {
      await updateItem(editId, payload as unknown as Record<string, unknown>);
      setEditId(null);
    } catch { /* store handles error */ } finally { setSaving(false); }
  }, [editId, editForm, updateItem]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try { await deleteItem(id); } catch { /* store handles error */ }
  }, [deleteItem]);

  const cancelForm = useCallback(() => {
    setShowAdd(false);
    setEditId(null);
    setAddForm({ ...EMPTY_FORM });
    setEditForm({ ...EMPTY_FORM });
  }, []);

  const handlePrint = useCallback((d: ApiMachineDelivery) => {
    generateDeliveryPdf(d);
  }, []);

  if (loading && items.length === 0) {
    return <div className={styles.page}><LoadingSpinner /></div>;
  }

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;
  const isEditing = !!editId;
  const filteredItems = items.filter((item) => {
    if (!selectedDate) return true;
    return toDateInputValue(item.deliveryDate) === selectedDate;
  });

  // Get machine and customer info from selected reception
  const selectedReception = activeForm?.reception.reception;
  const machineName = selectedReception && selectedReception.machine && typeof selectedReception.machine === 'object' && 'name' in selectedReception.machine
    ? selectedReception.machine.name
    : selectedReception?.machineDetails || '';
  const customerName = selectedReception && selectedReception.customer && typeof selectedReception.customer === 'object' && 'name' in selectedReception.customer
    ? selectedReception.customer.name
    : selectedReception?.customerName || '';
  const machineDetails = selectedReception?.machineDetails || '';
  const customerPhone = selectedReception?.customerPhone || '';

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}><Upload size={24} />إدارة تسليم الآلات</h1>
          <p className={styles.pageSubtitle}>تسليم الآلات الجاهزة للزبائن</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={18} color="#9ca3af" />
            <input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.searchBox}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="فلتر حسب اليوم"
            />
          </div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm({ ...EMPTY_FORM }); setShowAdd(!showAdd); }}>
            <Plus size={18} />تسليم جديد
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل تسليم</> : <><Plus size={18} />تسليم آلة</>}
          </h3>
          <div className={styles.formGrid}>
            {/* Reception Selection */}
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>
                <Package size={14} /> اختر الآلة المستلمة (جاهزة للتسليم) *
              </label>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowModal(true)}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <Package size={16} />
                {activeForm.reception.reception
                  ? `تم اختيار: ${activeForm.reception.reception.customId}`
                  : 'اختر من الآلات الجاهزة للتسليم'
                }
              </button>
            </div>

            {/* Auto-filled information */}
            {selectedReception && (
              <>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>اسم الآلة</label>
                  <input
                    className={styles.formInput}
                    value={machineName}
                    disabled
                    style={{ background: '#f9fafb', color: '#6b7280' }}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>تفاصيل الآلة</label>
                  <input
                    className={styles.formInput}
                    value={machineDetails}
                    disabled
                    style={{ background: '#f9fafb', color: '#6b7280' }}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>اسم الزبون</label>
                  <input
                    className={styles.formInput}
                    value={customerName}
                    disabled
                    style={{ background: '#f9fafb', color: '#6b7280' }}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>جوال الزبون</label>
                  <input
                    className={styles.formInput}
                    value={customerPhone}
                    disabled
                    style={{ background: '#f9fafb', color: '#6b7280' }}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>رقم الاستلام</label>
                  <input
                    className={styles.formInput}
                    value={selectedReception.customId}
                    disabled
                    style={{ background: '#f9fafb', color: '#6b7280' }}
                  />
                </div>
              </>
            )}

            {/* Delivery Details */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>تاريخ التسليم *</label>
              <input
                type="date"
                className={styles.formInput}
                value={activeForm.deliveryDate}
                onChange={e => setActiveForm({ ...activeForm, deliveryDate: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>المسلم</label>
              <EmployeeSelect
                value={activeForm.deliveredBy}
                onChange={deliveredBy => setActiveForm({ ...activeForm, deliveredBy })}
                placeholder="اختر الموظف المسلم"
              />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>ملاحظات</label>
              <textarea
                className={styles.formTextarea}
                placeholder="ملاحظات التسليم..."
                value={activeForm.notes}
                onChange={e => setActiveForm({ ...activeForm, notes: e.target.value })}
              />
            </div>

            {!isEditing && (
              <>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>تقرير الفني *</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="أدخل تقرير الفني قبل التسليم"
                    value={activeForm.technicianReport}
                    onChange={e => setActiveForm({ ...activeForm, technicianReport: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>أجرة الفني *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={styles.formInput}
                    value={activeForm.technicianFee}
                    onChange={e => setActiveForm({ ...activeForm, technicianFee: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>أجرة الشركة *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={styles.formInput}
                    value={activeForm.companyFee}
                    onChange={e => setActiveForm({ ...activeForm, companyFee: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>
          <div className={styles.formCardActions}>
            <button
              className={styles.btnSave}
              onClick={isEditing ? saveEdit : handleAdd}
              disabled={saving || !activeForm.reception.id}
            >
              <Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className={styles.btnCancel} onClick={cancelForm}>
              <X size={14} />إلغاء
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>رقم الاستلام</th>
              <th>الآلة</th>
              <th>التفاصيل</th>
              <th>الزبون</th>
              <th>تاريخ التسليم</th>
              <th>المسلم</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(d => (
              <tr key={d._id}>
                <td><span className={styles.customId}>{getReceptionId(d)}</span></td>
                <td style={{ fontWeight: 600 }}>{getMachineName(d)}</td>
                <td>{d.machineDetails || '—'}</td>
                <td>{getCustomerName(d)}</td>
                <td>{d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString('ar') : '—'}</td>
                <td>{getDeliveredByName(d)}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => handlePrint(d)} title="طباعة">
                      <Printer size={14} />
                    </button>
                    <button className={styles.btnSecondary} onClick={() => startEdit(d)} title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button className={styles.btnDanger} onClick={() => handleDelete(d._id)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <FileText size={40} />
                    <p>لا يوجد بيانات</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reception Selection Modal */}
      <ReceptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={(reception) => {
          setActiveForm({ ...activeForm, reception });
        }}
      />
    </div>
  );
}
