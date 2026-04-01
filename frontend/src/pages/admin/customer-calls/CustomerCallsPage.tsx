import { useEffect, useState, useCallback } from 'react';
import { Phone, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useCustomerCallStore } from '../../../shared/store/customerCallStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { CustomerSelect, EMPTY_CUSTOMER } from '../../../shared/ui/CustomerSelect';
import { MachineSelect, EMPTY_MACHINE } from '../../../shared/ui/MachineSelect';
import { EmployeeSelect, EMPTY_EMPLOYEE } from '../../../shared/ui/EmployeeSelect';
import type { CustomerValue } from '../../../shared/ui/CustomerSelect';
import type { MachineValue } from '../../../shared/ui/MachineSelect';
import type { EmployeeValue } from '../../../shared/ui/EmployeeSelect';
import type { ApiCustomerCall } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface CustomerCallForm {
  customer: CustomerValue;
  machine: MachineValue;
  machineDetails: string;
  warranty: boolean;
  date: string;
  time: string;
  customerProblemDesc: string;
  solution: string;
  notes: string;
  receivedBy: EmployeeValue;
}

const createEmptyForm = (): CustomerCallForm => ({
  customer: { ...EMPTY_CUSTOMER },
  machine: { ...EMPTY_MACHINE },
  machineDetails: '',
  warranty: false,
  date: new Date().toISOString().split('T')[0] ?? '',
  time: new Date().toTimeString().slice(0, 5),
  customerProblemDesc: '',
  solution: '',
  notes: '',
  receivedBy: { ...EMPTY_EMPLOYEE },
});

const trunc = (s: string, n = 40) => (s && s.length > n ? s.slice(0, n) + '...' : s || '—');

const formToPayload = (form: CustomerCallForm) => ({
  customer: form.customer.mode === 'select' ? (form.customer.id || undefined) : undefined,
  customerName: form.customer.name,
  customerPhone: form.customer.phone,
  customerAddress: form.customer.address,
  machine: form.machine.id || undefined,
  machineName: form.machine.name,
  machineDetails: form.machineDetails,
  warranty: form.warranty,
  customerProblemDesc: form.customerProblemDesc,
  solution: form.solution,
  notes: form.notes,
  receivedBy: form.receivedBy.id || null,
  receivedByName: form.receivedBy.id ? '' : form.receivedBy.name,
});

const callToForm = (item: ApiCustomerCall): CustomerCallForm => {
  let customer: CustomerValue = { ...EMPTY_CUSTOMER };
  if (item.customer && typeof item.customer === 'object' && '_id' in item.customer) {
    customer = {
      id: item.customer._id,
      name: item.customer.name,
      phone: item.customer.phone || '',
      address: item.customer.address || '',
      mode: 'select',
    };
  } else if (item.customerName || item.customerPhone || item.customerAddress) {
    customer = {
      id: typeof item.customer === 'string' ? item.customer : undefined,
      name: item.customerName || '',
      phone: item.customerPhone || '',
      address: item.customerAddress || '',
      mode: 'manual',
    };
  }

  let machine: MachineValue = { ...EMPTY_MACHINE };
  if (item.machine && typeof item.machine === 'object' && '_id' in item.machine) {
    machine = { id: item.machine._id, name: item.machine.name };
  } else if (item.machineName) {
    machine = { id: typeof item.machine === 'string' ? item.machine : undefined, name: item.machineName };
  }

  let receivedBy: EmployeeValue = { ...EMPTY_EMPLOYEE };
  if (item.receivedBy && typeof item.receivedBy === 'object' && '_id' in item.receivedBy) {
    receivedBy = { id: item.receivedBy._id, name: item.receivedBy.name, mode: 'select' };
  }

  return {
    customer,
    machine,
    machineDetails: item.machineDetails || '',
    warranty: item.warranty || false,
    date: item.date ? item.date.split('T')[0] : '',
    time: item.time || (item.date ? new Date(item.date).toTimeString().slice(0, 5) : ''),
    customerProblemDesc: item.customerProblemDesc || '',
    solution: item.solution || '',
    notes: item.notes || '',
    receivedBy,
  };
};

const getCustomerName = (row: ApiCustomerCall) => {
  if (row.customer && typeof row.customer === 'object' && 'name' in row.customer) return row.customer.name;
  return row.customerName || '—';
};

const getMachineName = (row: ApiCustomerCall) => {
  if (row.machine && typeof row.machine === 'object' && 'name' in row.machine) return row.machine.name;
  return row.machineName || '—';
};

const getReceivedByName = (row: ApiCustomerCall) => {
  if (row.receivedBy && typeof row.receivedBy === 'object' && 'name' in row.receivedBy) return row.receivedBy.name;
  return row.receivedByName || '—';
};

export default function CustomerCallsPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useCustomerCallStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<CustomerCallForm>(createEmptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomerCallForm>(createEmptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const handleAdd = useCallback(async () => {
    if (!addForm.customer.name.trim()) return;
    setSaving(true);
    try {
      await createItem(formToPayload(addForm) as unknown as Record<string, unknown>);
      setAddForm(createEmptyForm());
      setShowAdd(false);
    } catch {
      // store handles error
    } finally {
      setSaving(false);
    }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiCustomerCall) => {
    setEditId(r._id);
    setShowAdd(false);
    setEditForm(callToForm(r));
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId || !editForm.customer.name.trim()) return;
    setSaving(true);
    try {
      await updateItem(editId, formToPayload(editForm) as unknown as Record<string, unknown>);
      setEditId(null);
    } catch {
      // store handles error
    } finally {
      setSaving(false);
    }
  }, [editForm, editId, updateItem]);

  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch {} }, [deleteItem]);

  const cancelForm = useCallback(() => {
    setShowAdd(false);
    setEditId(null);
    setAddForm(createEmptyForm());
    setEditForm(createEmptyForm());
  }, []);

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;
  const isEditing = !!editId;

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Phone size={24} />إدارة الاتصالات الهاتفية</h1><p className={styles.pageSubtitle}>تسجيل اتصالات الزبائن</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm(createEmptyForm()); setShowAdd(!showAdd); }}><Plus size={18} />جديد</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل اتصال هاتفي</> : <><Plus size={18} />اتصال هاتفي جديد</>}
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الزبون *</label>
              <CustomerSelect
                value={activeForm.customer}
                onChange={(customer) => setActiveForm({ ...activeForm, customer })}
                placeholder="اختر أو أدخل الزبون"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>جوال الزبون</label>
              <input
                className={styles.formInput}
                value={activeForm.customer.phone}
                onChange={(e) => setActiveForm({
                  ...activeForm,
                  customer: { ...activeForm.customer, phone: e.target.value },
                })}
                disabled={activeForm.customer.mode === 'select' && !!activeForm.customer.id}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>عنوان الزبون</label>
              <input
                className={styles.formInput}
                value={activeForm.customer.address}
                onChange={(e) => setActiveForm({
                  ...activeForm,
                  customer: { ...activeForm.customer, address: e.target.value },
                })}
                disabled={activeForm.customer.mode === 'select' && !!activeForm.customer.id}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الآلة</label>
              <MachineSelect
                value={activeForm.machine}
                onChange={(machine) => setActiveForm({ ...activeForm, machine })}
                placeholder="اختر الآلة"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>تفاصيل الآلة</label>
              <input
                className={styles.formInput}
                value={activeForm.machineDetails}
                onChange={(e) => setActiveForm({ ...activeForm, machineDetails: e.target.value })}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  className={styles.formCheckbox}
                  checked={activeForm.warranty}
                  onChange={(e) => setActiveForm({ ...activeForm, warranty: e.target.checked })}
                />
                تحت الكفالة
              </label>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>التاريخ (تلقائي)</label>
              <input className={styles.formInput} type="date" value={activeForm.date} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>الساعة (تلقائي)</label>
              <input className={styles.formInput} type="time" value={activeForm.time} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>مستلم الاتصال</label>
              <EmployeeSelect
                value={activeForm.receivedBy}
                onChange={(receivedBy) => setActiveForm({ ...activeForm, receivedBy })}
                placeholder="اختر مستلم الاتصال"
                hideManualToggle={true}
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>وصف المشكلة من الزبون</label>
              <textarea
                className={styles.formTextarea}
                value={activeForm.customerProblemDesc}
                onChange={(e) => setActiveForm({ ...activeForm, customerProblemDesc: e.target.value })}
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>وصف الحل</label>
              <textarea
                className={styles.formTextarea}
                value={activeForm.solution}
                onChange={(e) => setActiveForm({ ...activeForm, solution: e.target.value })}
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>ملاحظات</label>
              <textarea
                className={styles.formTextarea}
                value={activeForm.notes}
                onChange={(e) => setActiveForm({ ...activeForm, notes: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={isEditing ? saveEdit : handleAdd} disabled={saving || !activeForm.customer.name.trim()}>
              <Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className={styles.btnCancel} onClick={cancelForm}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الزبون</th><th>الجوال</th><th>العنوان</th><th>الآلة</th><th>تفاصيل الآلة</th><th>الكفالة</th><th>التاريخ</th><th>الساعة</th><th>المستلم</th><th>المشكلة</th><th>الحل</th><th>ملاحظات</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td style={{ fontWeight: 600 }}>{getCustomerName(r)}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{r.customerPhone || '—'}</td>
                <td>{trunc(r.customerAddress)}</td>
                <td>{getMachineName(r)}</td>
                <td>{trunc(r.machineDetails)}</td>
                <td><span className={`${styles.badge} ${r.warranty ? styles.badgeGreen : styles.badgeGray}`}>{r.warranty ? 'نعم' : 'لا'}</span></td>
                <td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td>
                <td>{r.time || (r.date ? new Date(r.date).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—')}</td>
                <td>{getReceivedByName(r)}</td>
                <td>{trunc(r.customerProblemDesc)}</td>
                <td>{trunc(r.solution)}</td>
                <td>{trunc(r.notes)}</td>
                <td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={13}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
