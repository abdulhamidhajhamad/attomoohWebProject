import { useEffect, useState, useCallback, useMemo } from 'react';
import { Wrench, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useMachineMaintenanceStore } from '../../../shared/store/machineMaintenanceStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiMachineMaint } from '../../../shared/api/types';
import { ReceptionSelect, EMPTY_RECEPTION } from '../../../shared/ui/ReceptionSelect';
import { TechnicianSelect, EMPTY_TECHNICIAN } from '../../../shared/ui/TechnicianSelect';
import type { ReceptionValue } from '../../../shared/ui/ReceptionSelect';
import type { TechnicianValue } from '../../../shared/ui/TechnicianSelect';
import styles from '../shared/CrudPage.module.css';

const statusMap: Record<string, { label: string; cls: string }> = {
  waiting: { label: 'انتظار', cls: 'badgeYellow' },
  in_maintenance: { label: 'قيد الصيانة', cls: 'badgeBlue' },
  postponed: { label: 'مؤجل', cls: 'badgeYellow' },
  ready: { label: 'جاهز', cls: 'badgeGreen' },
  rejected: { label: 'مرفوض', cls: 'badgeRed' },
};
const fmtMin = (ms: number) => ms > 0 ? Math.round(ms / 60000) + ' دقيقة' : '—';

interface SparePartForm {
  name: string;
  quantity: number;
  cost: number;
}

interface MaintenanceForm {
  machineReception: ReceptionValue;
  machineName: string;
  machineDetails: string;
  date: string;
  time: string;
  pauseReason: string;
  technician: TechnicianValue;
  spareParts: SparePartForm[];
  technicianReport: string;
  status: 'waiting' | 'in_maintenance' | 'postponed' | 'ready' | 'rejected';
  technicianFee: number;
  companyFee: number;
}

const EMPTY_PART: SparePartForm = { name: '', quantity: 1, cost: 0 };

const nowParts = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0] ?? '';
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
};

const createEmptyForm = (): MaintenanceForm => {
  const { date, time } = nowParts();
  return {
    machineReception: { ...EMPTY_RECEPTION },
    machineName: '',
    machineDetails: '',
    date,
    time,
    pauseReason: '',
    technician: { ...EMPTY_TECHNICIAN },
    spareParts: [{ ...EMPTY_PART }],
    technicianReport: '',
    status: 'waiting',
    technicianFee: 0,
    companyFee: 0,
  };
};

const getReceptionMachineName = (reception: ReceptionValue['reception']) => {
  if (!reception) return '';
  if (reception.machine && typeof reception.machine === 'object' && 'name' in reception.machine) {
    return reception.machine.name;
  }
  return reception.machineDetails || '';
};

const formToPayload = (form: MaintenanceForm) => ({
  machineReception: form.machineReception.id,
  machineName: form.machineName,
  machineDetails: form.machineDetails,
  pauseReason: form.pauseReason,
  technician: form.technician.mode === 'select' ? (form.technician.id || undefined) : undefined,
  technicianName: form.technician.mode === 'manual' ? form.technician.name : '',
  spareParts: form.spareParts
    .filter((part) => part.name.trim())
    .map((part) => ({
      name: part.name.trim(),
      quantity: Number(part.quantity) || 0,
      cost: Number(part.cost) || 0,
    })),
  technicianReport: form.technicianReport,
  status: form.status,
  technicianFee: Number(form.technicianFee) || 0,
  companyFee: Number(form.companyFee) || 0,
});

const maintenanceToForm = (item: ApiMachineMaint): MaintenanceForm => {
  const date = item.date ? item.date.split('T')[0] : '';
  const time = item.time || (item.date ? new Date(item.date).toTimeString().slice(0, 5) : '');

  let machineReception: ReceptionValue = { ...EMPTY_RECEPTION };
  if (item.machineReception && typeof item.machineReception === 'object' && '_id' in item.machineReception) {
    machineReception = {
      id: item.machineReception._id,
      reception: item.machineReception,
    };
  } else if (typeof item.machineReception === 'string') {
    machineReception = { id: item.machineReception, reception: undefined };
  }

  let technician: TechnicianValue = { ...EMPTY_TECHNICIAN };
  if (item.technician && typeof item.technician === 'object' && '_id' in item.technician) {
    technician = { id: item.technician._id, name: item.technician.name, mode: 'select' };
  } else if (item.technicianName) {
    technician = { id: undefined, name: item.technicianName, mode: 'manual' };
  }

  return {
    machineReception,
    machineName: item.machineName || '',
    machineDetails: item.machineDetails || '',
    date,
    time,
    pauseReason: item.pauseReason || '',
    technician,
    spareParts: item.spareParts?.length
      ? item.spareParts.map((part) => ({
          name: part.name || '',
          quantity: Number(part.quantity) || 0,
          cost: Number(part.cost) || 0,
        }))
      : [{ ...EMPTY_PART }],
    technicianReport: item.technicianReport || '',
    status: (item.status || 'waiting') as MaintenanceForm['status'],
    technicianFee: Number(item.technicianFee) || 0,
    companyFee: Number(item.companyFee) || 0,
  };
};

const getMachineCode = (item: ApiMachineMaint) => {
  if (item.machineReception && typeof item.machineReception === 'object' && 'customId' in item.machineReception) {
    return item.machineReception.customId;
  }
  return '—';
};

const getTechnicianName = (item: ApiMachineMaint) => {
  if (item.technician && typeof item.technician === 'object' && 'name' in item.technician) return item.technician.name;
  return item.technicianName || '—';
};

export default function MachineMaintenancePage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMachineMaintenanceStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<MaintenanceForm>(createEmptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MaintenanceForm>(createEmptyForm());
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

  const startEdit = useCallback((r: ApiMachineMaint) => {
    setEditId(r._id);
    setShowAdd(false);
    setEditForm(maintenanceToForm(r));
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

  const readyForDelivery = activeForm?.status === 'ready';
  const totalSpareCost = useMemo(() => {
    if (!activeForm) return 0;
    return activeForm.spareParts.reduce((acc, part) => acc + (Number(part.quantity) || 0) * (Number(part.cost) || 0), 0);
  }, [activeForm]);

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

  const updatePart = useCallback(
    (index: number, key: keyof SparePartForm, value: string | number) => {
      if (!activeForm) return;
      const spareParts = [...activeForm.spareParts];
      spareParts[index] = {
        ...spareParts[index],
        [key]: key === 'name' ? String(value) : Number(value) || 0,
      };
      setActiveForm({ ...activeForm, spareParts });
    },
    [activeForm, setActiveForm]
  );

  const addPart = useCallback(() => {
    if (!activeForm) return;
    setActiveForm({ ...activeForm, spareParts: [...activeForm.spareParts, { ...EMPTY_PART }] });
  }, [activeForm, setActiveForm]);

  const removePart = useCallback(
    (index: number) => {
      if (!activeForm) return;
      const spareParts = activeForm.spareParts.filter((_, i) => i !== index);
      setActiveForm({ ...activeForm, spareParts: spareParts.length > 0 ? spareParts : [{ ...EMPTY_PART }] });
    },
    [activeForm, setActiveForm]
  );

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Wrench size={24} />إدارة صيانة الآلات</h1><p className={styles.pageSubtitle}>صيانة الآلات وتتبع حالتها</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm(createEmptyForm()); setShowAdd(!showAdd); }}><Plus size={18} />جديد</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل صيانة آلة</> : <><Plus size={18} />صيانة آلة جديدة</>}
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
              <label className={styles.formLabel}>اسم الفني</label>
              <TechnicianSelect
                value={activeForm.technician}
                onChange={(technician) => setActiveForm({ ...activeForm, technician })}
                placeholder="اختر أو أدخل الفني"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>الوضع</label>
              <select
                className={styles.formSelect}
                value={activeForm.status}
                onChange={(e) => setActiveForm({ ...activeForm, status: e.target.value as MaintenanceForm['status'] })}
              >
                <option value="waiting">بالانتظار</option>
                <option value="in_maintenance">قيد الصيانة</option>
                <option value="postponed">مؤجلة</option>
                <option value="ready">جاهزة</option>
                <option value="rejected">مرفوضة</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>جاهزة للتسليم (تلقائي)</label>
              <input className={styles.formInput} value={readyForDelivery ? 'نعم' : 'لا'} readOnly />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>مدة الصيانة</label>
              <input className={styles.formInput} value={isEditing ? fmtMin(items.find((row) => row._id === editId)?.maintenanceDurationMs ?? 0) : '—'} readOnly />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>سبب الإيقاف / الاستمرار</label>
              <textarea
                className={styles.formTextarea}
                placeholder="أدخل سبب الإيقاف أو ملاحظة الاستمرار"
                value={activeForm.pauseReason}
                onChange={(e) => setActiveForm({ ...activeForm, pauseReason: e.target.value })}
              />
            </div>

            <div className={styles.formSectionLabel}><Wrench size={14} />قطع الغيار وتكلفتها</div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              {activeForm.spareParts.map((part, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <input
                    className={styles.formInput}
                    placeholder="اسم القطعة"
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    min={0}
                    className={styles.formInput}
                    placeholder="الكمية"
                    value={part.quantity}
                    onChange={(e) => updatePart(index, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    min={0}
                    className={styles.formInput}
                    placeholder="التكلفة"
                    value={part.cost}
                    onChange={(e) => updatePart(index, 'cost', e.target.value)}
                  />
                  <button type="button" className={styles.btnDanger} onClick={() => removePart(index)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <button type="button" className={styles.btnSecondary} onClick={addPart}><Plus size={14} />إضافة قطعة</button>
                <span style={{ fontWeight: 600 }}>الإجمالي: {totalSpareCost.toLocaleString('ar')} ل.س</span>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>أجرة فني الصيانة</label>
              <input
                type="number"
                min={0}
                className={styles.formInput}
                value={activeForm.technicianFee}
                onChange={(e) => setActiveForm({ ...activeForm, technicianFee: Number(e.target.value) || 0 })}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>أجرة الشركة</label>
              <input
                type="number"
                min={0}
                className={styles.formInput}
                value={activeForm.companyFee}
                onChange={(e) => setActiveForm({ ...activeForm, companyFee: Number(e.target.value) || 0 })}
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>تقرير الفني</label>
              <textarea
                className={styles.formTextarea}
                placeholder="أدخل تقرير الفني"
                value={activeForm.technicianReport}
                onChange={(e) => setActiveForm({ ...activeForm, technicianReport: e.target.value })}
              />
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
          <thead><tr><th>رمز الآلة</th><th>اسم الآلة</th><th>الفني</th><th>التاريخ</th><th>الساعة</th><th>الوضع</th><th>جاهزة للتسليم</th><th>المدة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{getMachineCode(r)}</span></td>
                <td style={{ fontWeight: 600 }}>{r.machineName || '—'}</td>
                <td>{getTechnicianName(r)}</td>
                <td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td>
                <td>{r.time || (r.date ? new Date(r.date).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—')}</td>
                <td><span className={`${styles.badge} ${styles[statusMap[r.status]?.cls || 'badgeGray']}`}>{statusMap[r.status]?.label || r.status}</span></td>
                <td><span className={`${styles.badge} ${r.readyForDelivery ? styles.badgeGreen : styles.badgeGray}`}>{r.readyForDelivery ? 'نعم' : 'لا'}</span></td>
                <td>{fmtMin(r.maintenanceDurationMs)}</td>
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
