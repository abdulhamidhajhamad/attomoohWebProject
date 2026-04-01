import { useEffect, useState, useCallback } from 'react';
import { Truck, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useTransportStore } from '../../../shared/store/transportStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiTransport } from '../../../shared/api/types';
import { ReceptionSelect, EMPTY_RECEPTION } from '../../../shared/ui/ReceptionSelect';
import { EmployeeSelect, EMPTY_EMPLOYEE } from '../../../shared/ui/EmployeeSelect';
import type { ReceptionValue } from '../../../shared/ui/ReceptionSelect';
import type { EmployeeValue } from '../../../shared/ui/EmployeeSelect';
import styles from '../shared/CrudPage.module.css';

const fmtMin = (ms: number) => ms > 0 ? Math.round(ms / 60000) + ' دقيقة' : '—';

interface TransportForm {
  machineReception: ReceptionValue;
  machineName: string;
  machineDetails: string;
  date: string;
  time: string;
  pauseReason: string;
  logistic: EmployeeValue;
  logisticReport: string;
  readyForDelivery: boolean;
  logisticFee: number;
  companyFee: number;
}

const createEmptyForm = (): TransportForm => ({
  machineReception: { ...EMPTY_RECEPTION },
  machineName: '',
  machineDetails: '',
  date: new Date().toISOString().split('T')[0] ?? '',
  time: new Date().toTimeString().slice(0, 5),
  pauseReason: '',
  logistic: { ...EMPTY_EMPLOYEE },
  logisticReport: '',
  readyForDelivery: false,
  logisticFee: 0,
  companyFee: 0,
});

const getReceptionMachineName = (reception: ReceptionValue['reception']) => {
  if (!reception) return '';
  if (reception.machine && typeof reception.machine === 'object' && 'name' in reception.machine) {
    return reception.machine.name;
  }
  return reception.machineDetails || '';
};

const formToPayload = (form: TransportForm) => ({
  machineReception: form.machineReception.id,
  machineName: form.machineName,
  machineDetails: form.machineDetails,
  pauseReason: form.pauseReason,
  logistic: form.logistic.mode === 'select' ? (form.logistic.id || undefined) : undefined,
  logisticName: form.logistic.mode === 'manual' ? form.logistic.name : '',
  logisticReport: form.logisticReport,
  readyForDelivery: form.readyForDelivery,
  logisticFee: Number(form.logisticFee) || 0,
  companyFee: Number(form.companyFee) || 0,
});

const transportToForm = (item: ApiTransport): TransportForm => {
  let machineReception: ReceptionValue = { ...EMPTY_RECEPTION };
  if (item.machineReception && typeof item.machineReception === 'object' && '_id' in item.machineReception) {
    machineReception = { id: item.machineReception._id, reception: item.machineReception };
  } else if (typeof item.machineReception === 'string') {
    machineReception = { id: item.machineReception, reception: undefined };
  }

  let logistic: EmployeeValue = { ...EMPTY_EMPLOYEE };
  if (item.logistic && typeof item.logistic === 'object' && '_id' in item.logistic) {
    logistic = { id: item.logistic._id, name: item.logistic.name, mode: 'select' };
  } else if (item.logisticName) {
    logistic = { id: undefined, name: item.logisticName, mode: 'manual' };
  }

  return {
    machineReception,
    machineName: item.machineName || '',
    machineDetails: item.machineDetails || '',
    date: item.date ? item.date.split('T')[0] : '',
    time: item.time || (item.date ? new Date(item.date).toTimeString().slice(0, 5) : ''),
    pauseReason: item.pauseReason || '',
    logistic,
    logisticReport: item.logisticReport || '',
    readyForDelivery: item.readyForDelivery || false,
    logisticFee: Number(item.logisticFee) || 0,
    companyFee: Number(item.companyFee) || 0,
  };
};

const getMachineCode = (item: ApiTransport) => {
  if (item.machineReception && typeof item.machineReception === 'object' && 'customId' in item.machineReception) {
    return item.machineReception.customId;
  }
  return '—';
};

const getLogisticName = (item: ApiTransport) => {
  if (item.logistic && typeof item.logistic === 'object' && 'name' in item.logistic) return item.logistic.name;
  return item.logisticName || '—';
};

export default function TransportPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useTransportStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<TransportForm>(createEmptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TransportForm>(createEmptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const handleAdd = useCallback(async () => {
    if (!addForm.machineReception.id) return;
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

  const startEdit = useCallback((r: ApiTransport) => {
    setEditId(r._id);
    setShowAdd(false);
    setEditForm(transportToForm(r));
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId || !editForm.machineReception.id) return;
    setSaving(true);
    try {
      await updateItem(editId, formToPayload(editForm) as unknown as Record<string, unknown>);
      setEditId(null);
    } catch {
      // store handles error
    } finally {
      setSaving(false);
    }
  }, [editId, editForm, updateItem]);
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

  const handleReceptionChange = useCallback(
    (value: ReceptionValue) => {
      const machineName = getReceptionMachineName(value.reception);
      const machineDetails = value.reception?.machineDetails || '';
      if (!activeForm) return;
      setActiveForm({
        ...activeForm,
        machineReception: value,
        machineName,
        machineDetails,
      });
    },
    [activeForm, setActiveForm]
  );

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Truck size={24} />إدارة النقل</h1><p className={styles.pageSubtitle}>نقل الآلات وتتبع عمليات النقل</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm(createEmptyForm()); setShowAdd(!showAdd); }}><Plus size={18} />جديد</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل نقل آلة</> : <><Plus size={18} />نقل آلة جديد</>}
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>رمز تعريف الآلة *</label>
              <ReceptionSelect
                value={activeForm.machineReception}
                onChange={handleReceptionChange}
                placeholder="اختر من قائمة الاستلام"
                statusFilter={['waiting', 'in_maintenance', 'postponed', 'ready', 'rejected']}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الآلة (تلقائي)</label>
              <input className={styles.formInput} value={activeForm.machineName} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>تفاصيل الآلة (تلقائي)</label>
              <input className={styles.formInput} value={activeForm.machineDetails} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>التاريخ (تلقائي)</label>
              <input type="date" className={styles.formInput} value={activeForm.date} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>الساعة (تلقائي)</label>
              <input type="time" className={styles.formInput} value={activeForm.time} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم اللوجستي</label>
              <EmployeeSelect
                value={activeForm.logistic}
                onChange={(logistic) => setActiveForm({ ...activeForm, logistic })}
                placeholder="اختر أو أدخل اسم اللوجستي"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>مدة النقل</label>
              <input className={styles.formInput} value={isEditing ? fmtMin(items.find((row) => row._id === editId)?.transportDurationMs ?? 0) : '—'} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  className={styles.formCheckbox}
                  checked={activeForm.readyForDelivery}
                  onChange={(e) => setActiveForm({ ...activeForm, readyForDelivery: e.target.checked })}
                />
                جاهزة للتسليم
              </label>
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>سبب الإيقاف / الاستمرار</label>
              <textarea className={styles.formTextarea} value={activeForm.pauseReason} onChange={(e) => setActiveForm({ ...activeForm, pauseReason: e.target.value })} />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>تقرير اللوجستي</label>
              <textarea className={styles.formTextarea} value={activeForm.logisticReport} onChange={(e) => setActiveForm({ ...activeForm, logisticReport: e.target.value })} />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>أجرة اللوجستي</label>
              <input type="number" min={0} className={styles.formInput} value={activeForm.logisticFee} onChange={(e) => setActiveForm({ ...activeForm, logisticFee: Number(e.target.value) || 0 })} />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>أجرة الشركة</label>
              <input type="number" min={0} className={styles.formInput} value={activeForm.companyFee} onChange={(e) => setActiveForm({ ...activeForm, companyFee: Number(e.target.value) || 0 })} />
            </div>
          </div>

          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={isEditing ? saveEdit : handleAdd} disabled={saving || !activeForm.machineReception.id}>
              <Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className={styles.btnCancel} onClick={cancelForm}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>رمز الآلة</th><th>اسم الآلة</th><th>التفاصيل</th><th>اللوجستي</th><th>التاريخ</th><th>الساعة</th><th>المدة</th><th>جاهزة للتسليم</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{getMachineCode(r)}</span></td>
                <td style={{ fontWeight: 600 }}>{r.machineName || '—'}</td>
                <td>{r.machineDetails || '—'}</td>
                <td>{getLogisticName(r)}</td>
                <td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td>
                <td>{r.time || (r.date ? new Date(r.date).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—')}</td>
                <td>{fmtMin(r.transportDurationMs)}</td>
                <td><span className={`${styles.badge} ${r.readyForDelivery ? styles.badgeGreen : styles.badgeGray}`}>{r.readyForDelivery ? 'نعم' : 'لا'}</span></td>
                <td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={9}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
