import { useEffect, useState, useCallback } from 'react';
import { Download, Plus, Search, Trash2, Pencil, X, Check, FileText, Printer, StickyNote } from 'lucide-react';
import { useMachineReceptionStore } from '../../../shared/store/machineReceptionStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { MachineSelect, EMPTY_MACHINE } from '../../../shared/ui/MachineSelect';
import { CustomerSelect, EMPTY_CUSTOMER } from '../../../shared/ui/CustomerSelect';
import { EmployeeSelect, EMPTY_EMPLOYEE } from '../../../shared/ui/EmployeeSelect';
import type { MachineValue } from '../../../shared/ui/MachineSelect';
import type { CustomerValue } from '../../../shared/ui/CustomerSelect';
import type { EmployeeValue } from '../../../shared/ui/EmployeeSelect';
import type { ApiMachineReception } from '../../../shared/api/types';
import { generateReceptionPdf } from './generateReceptionPdf';
import styles from '../shared/CrudPage.module.css';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  waiting: { label: 'انتظار', cls: 'badgeYellow' },
  in_maintenance: { label: 'قيد الصيانة', cls: 'badgeBlue' },
  postponed: { label: 'مؤجل', cls: 'badgeYellow' },
  ready: { label: 'جاهز', cls: 'badgeGreen' },
  rejected: { label: 'مرفوض', cls: 'badgeRed' },
  delivered: { label: 'تم التسليم', cls: 'badgeGray' },
};

interface ReceptionForm {
  machine: MachineValue;
  machineDetails: string;
  serialNumber: string;
  customer: CustomerValue;
  warranty: boolean;
  expectedDeliveryDate: string;
  condition: 'complete' | 'incomplete';
  receivedParts: string;
  customerProblemDesc: string;
  notes: string;
  receivedBy: EmployeeValue;
}

const EMPTY_FORM: ReceptionForm = {
  machine: { ...EMPTY_MACHINE },
  machineDetails: '',
  serialNumber: '',
  customer: { ...EMPTY_CUSTOMER },
  warranty: false,
  expectedDeliveryDate: '',
  condition: 'complete',
  receivedParts: '',
  customerProblemDesc: '',
  notes: '',
  receivedBy: { ...EMPTY_EMPLOYEE },
};

const formToPayload = (form: ReceptionForm) => ({
  machine: form.machine.id || undefined,
  machineDetails: form.machineDetails,
  serialNumber: form.serialNumber,
  customer: form.customer.mode === 'select' && form.customer.id ? form.customer.id : undefined,
  customerName: form.customer.name,
  customerPhone: form.customer.phone,
  customerAddress: form.customer.address,
  warranty: form.warranty,
  expectedDeliveryDate: form.expectedDeliveryDate || undefined,
  condition: form.condition,
  receivedParts: form.receivedParts,
  customerProblemDesc: form.customerProblemDesc,
  notes: form.notes,
  receivedBy: form.receivedBy.mode === 'select' ? (form.receivedBy.id || undefined) : null,
  receivedByName: form.receivedBy.mode === 'manual' ? form.receivedBy.name : '',
});

const receptionToForm = (r: ApiMachineReception): ReceptionForm => {
  let machineValue: MachineValue = { ...EMPTY_MACHINE };
  if (r.machine && typeof r.machine === 'object' && '_id' in r.machine) {
    machineValue = { id: r.machine._id, name: r.machine.name };
  }

  let customerValue: CustomerValue = { ...EMPTY_CUSTOMER };
  if (r.customer && typeof r.customer === 'object' && '_id' in r.customer) {
    customerValue = {
      id: r.customer._id,
      name: r.customer.name,
      phone: r.customer.phone || '',
      address: r.customer.address || '',
      mode: 'select',
    };
  } else if (r.customerName) {
    customerValue = {
      id: undefined,
      name: r.customerName,
      phone: r.customerPhone || '',
      address: r.customerAddress || '',
      mode: 'manual',
    };
  }

  let receivedByValue: EmployeeValue = { ...EMPTY_EMPLOYEE };
  if (r.receivedBy && typeof r.receivedBy === 'object' && '_id' in r.receivedBy) {
    receivedByValue = { id: r.receivedBy._id, name: r.receivedBy.name, mode: 'select' };
  } else if (r.receivedByName) {
    // If they had a manual name from before, force them to select a system employee now since manual is disabled
    receivedByValue = { id: undefined, name: '', mode: 'select' };
  }

  return {
    machine: machineValue,
    machineDetails: r.machineDetails || '',
    serialNumber: r.serialNumber || '',
    customer: customerValue,
    warranty: r.warranty || false,
    expectedDeliveryDate: r.expectedDeliveryDate ? r.expectedDeliveryDate.split('T')[0] : '',
    condition: r.condition as 'complete' | 'incomplete',
    receivedParts: r.receivedParts || '',
    customerProblemDesc: r.customerProblemDesc || '',
    notes: r.notes || '',
    receivedBy: receivedByValue,
  };
};

const getMachineDisplay = (r: ApiMachineReception) => {
  const name = r.machine && typeof r.machine === 'object' && 'name' in r.machine ? r.machine.name : '';
  const details = (r.machineDetails || '').trim();

  if (name && details && details !== name) {
    return `${name} - ${details}`;
  }

  return name || details || '—';
};

const getCustomerName = (r: ApiMachineReception) => {
  if (r.customer && typeof r.customer === 'object' && 'name' in r.customer) return r.customer.name;
  return r.customerName || '—';
};

const getReceivedByName = (r: ApiMachineReception) => {
  if (r.receivedBy && typeof r.receivedBy === 'object' && 'name' in r.receivedBy) return r.receivedBy.name;
  if (r.receivedByName) return r.receivedByName;
  return '—';
};

export default function MachineReceptionPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMachineReceptionStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ReceptionForm>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ReceptionForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(search || undefined), 300);
    return () => clearTimeout(t);
  }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.customer.name.trim()) return;
    setSaving(true);
    try {
      await createItem(formToPayload(addForm) as unknown as Record<string, unknown>);
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
    } catch { /* store handles error */ } finally { setSaving(false); }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiMachineReception) => {
    setEditId(r._id);
    setEditForm(receptionToForm(r));
    setShowAdd(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateItem(editId, formToPayload(editForm) as unknown as Record<string, unknown>);
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

  const handlePrint = useCallback((r: ApiMachineReception) => {
    generateReceptionPdf(r);
  }, []);

  if (loading && items.length === 0) {
    return <div className={styles.page}><LoadingSpinner /></div>;
  }

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;
  const isEditing = !!editId;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}><Download size={24} />إدارة استلام الآلات</h1>
          <p className={styles.pageSubtitle}>استلام آلات من الزبائن وتتبع حالتها</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={18} color="#9ca3af" />
            <input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm({ ...EMPTY_FORM }); setShowAdd(!showAdd); }}>
            <Plus size={18} />استلام جديد
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل استلام</> : <><Plus size={18} />استلام آلة جديدة</>}
          </h3>
          <div className={styles.formGrid}>
            {/* Machine Selection */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الآلة *</label>
              <MachineSelect
                value={activeForm.machine}
                onChange={machine => setActiveForm({ ...activeForm, machine })}
                placeholder="اختر الآلة"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>تفاصيل الآلة</label>
              <input
                className={styles.formInput}
                placeholder="موديل، لون، مواصفات إضافية..."
                value={activeForm.machineDetails}
                onChange={e => setActiveForm({ ...activeForm, machineDetails: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الرقم التسلسلي</label>
              <input
                className={styles.formInput}
                placeholder="الرقم التسلسلي"
                value={activeForm.serialNumber}
                onChange={e => setActiveForm({ ...activeForm, serialNumber: e.target.value })}
              />
            </div>

            {/* Customer Selection */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الزبون *</label>
              <CustomerSelect
                value={activeForm.customer}
                onChange={customer => setActiveForm({ ...activeForm, customer })}
                placeholder="اختر أو أدخل الزبون"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>جوال الزبون</label>
              <input
                className={styles.formInput}
                placeholder="رقم الجوال"
                value={activeForm.customer.phone}
                onChange={e => setActiveForm({
                  ...activeForm,
                  customer: { ...activeForm.customer, phone: e.target.value }
                })}
                disabled={activeForm.customer.mode === 'select' && !!activeForm.customer.id}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>عنوان الزبون</label>
              <input
                className={styles.formInput}
                placeholder="العنوان"
                value={activeForm.customer.address}
                onChange={e => setActiveForm({
                  ...activeForm,
                  customer: { ...activeForm.customer, address: e.target.value }
                })}
                disabled={activeForm.customer.mode === 'select' && !!activeForm.customer.id}
              />
            </div>

            {/* Reception Details */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>تاريخ التسليم المتوقع</label>
              <input
                type="date"
                className={styles.formInput}
                value={activeForm.expectedDeliveryDate}
                onChange={e => setActiveForm({ ...activeForm, expectedDeliveryDate: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>حالة الآلة</label>
              <select
                className={styles.formSelect}
                value={activeForm.condition}
                onChange={e => setActiveForm({ ...activeForm, condition: e.target.value as 'complete' | 'incomplete' })}
              >
                <option value="complete">كاملة</option>
                <option value="incomplete">ناقصة</option>
              </select>
            </div>
            {activeForm.condition === 'incomplete' && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>الأجزاء المستلمة / الناقصة</label>
                <input
                  className={styles.formInput}
                  placeholder="تفاصيل الأجزاء الناقصة..."
                  value={activeForm.receivedParts}
                  onChange={e => setActiveForm({ ...activeForm, receivedParts: e.target.value })}
                />
              </div>
            )}
            <div className={styles.formField}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  className={styles.formCheckbox}
                  checked={activeForm.warranty}
                  onChange={e => setActiveForm({ ...activeForm, warranty: e.target.checked })}
                />
                تحت الكفالة
              </label>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>مستلم الآلة</label>
              <EmployeeSelect
                value={activeForm.receivedBy}
                onChange={receivedBy => setActiveForm({ ...activeForm, receivedBy })}
                placeholder="اختر الموظف المستلم"
                hideManualToggle={true}
              />
            </div>

            {/* Problem Description */}
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>وصف المشكلة من الزبون</label>
              <textarea
                className={styles.formTextarea}
                placeholder="وصف المشكلة كما ذكرها الزبون..."
                value={activeForm.customerProblemDesc}
                onChange={e => setActiveForm({ ...activeForm, customerProblemDesc: e.target.value })}
              />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}><StickyNote size={14} /> ملاحظات</label>
              <textarea
                className={styles.formTextarea}
                placeholder="ملاحظات إضافية..."
                value={activeForm.notes}
                onChange={e => setActiveForm({ ...activeForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={isEditing ? saveEdit : handleAdd} disabled={saving}>
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
              <th>الرمز</th>
              <th>الآلة والوصف</th>
              <th>الزبون</th>
              <th>الهاتف</th>
              <th>الحالة</th>
              <th>المستلم</th>
              <th>التاريخ</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{getMachineDisplay(r)}</td>
                <td>{getCustomerName(r)}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{r.customerPhone || '—'}</td>
                <td>
                  <span className={`${styles.badge} ${styles[STATUS_MAP[r.status]?.cls || 'badgeGray']}`}>
                    {STATUS_MAP[r.status]?.label || r.status}
                  </span>
                </td>
                <td>{getReceivedByName(r)}</td>
                <td>{r.receptionDate ? new Date(r.receptionDate).toLocaleDateString('ar') : '—'}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => handlePrint(r)} title="طباعة">
                      <Printer size={14} />
                    </button>
                    <button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button className={styles.btnDanger} onClick={() => handleDelete(r._id)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8}>
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
    </div>
  );
}
