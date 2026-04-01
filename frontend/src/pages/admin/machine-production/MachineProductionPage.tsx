import { useEffect, useState, useCallback } from 'react';
import { Factory, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useMachineProductionStore } from '../../../shared/store/machineProductionStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiMachineProduction } from '../../../shared/api/types';
import { TechnicianSelect, EMPTY_TECHNICIAN } from '../../../shared/ui/TechnicianSelect';
import type { TechnicianValue } from '../../../shared/ui/TechnicianSelect';
import styles from '../shared/CrudPage.module.css';

const fmtMin = (ms: number) => ms > 0 ? Math.round(ms / 60000) + ' دقيقة' : '—';

interface MaterialPartForm {
  name: string;
  quantity: number;
  cost: number;
}

interface ProductionForm {
  autoCustomId: boolean;
  customId: string;
  machineName: string;
  machineDetails: string;
  pauseReason: string;
  date: string;
  technician: TechnicianValue;
  materialsAndParts: MaterialPartForm[];
  readyForDelivery: boolean;
  technicianFee: number;
  companyFee: number;
}

const EMPTY_PART: MaterialPartForm = { name: '', quantity: 1, cost: 0 };

const createEmptyForm = (): ProductionForm => ({
  autoCustomId: true,
  customId: '',
  machineName: '',
  machineDetails: '',
  pauseReason: '',
  date: new Date().toISOString().split('T')[0] ?? '',
  technician: { ...EMPTY_TECHNICIAN },
  materialsAndParts: [{ ...EMPTY_PART }],
  readyForDelivery: false,
  technicianFee: 0,
  companyFee: 0,
});

const formToPayload = (form: ProductionForm) => ({
  customId: form.autoCustomId ? undefined : form.customId.trim() || undefined,
  machineName: form.machineName,
  machineDetails: form.machineDetails,
  machineNameAndDetails: [form.machineName, form.machineDetails].filter(Boolean).join(' - '),
  pauseReason: form.pauseReason,
  technician: form.technician.mode === 'select' ? (form.technician.id || undefined) : undefined,
  technicianName: form.technician.mode === 'manual' ? form.technician.name : '',
  materialsAndParts: form.materialsAndParts
    .filter((part) => part.name.trim())
    .map((part) => ({
      name: part.name.trim(),
      quantity: Number(part.quantity) || 0,
      cost: Number(part.cost) || 0,
    })),
  readyForDelivery: form.readyForDelivery,
  technicianFee: Number(form.technicianFee) || 0,
  companyFee: Number(form.companyFee) || 0,
});

const productionToForm = (item: ApiMachineProduction): ProductionForm => {
  let technician: TechnicianValue = { ...EMPTY_TECHNICIAN };
  if (item.technician && typeof item.technician === 'object' && '_id' in item.technician) {
    technician = { id: item.technician._id, name: item.technician.name, mode: 'select' };
  } else if (item.technicianName) {
    technician = { id: undefined, name: item.technicianName, mode: 'manual' };
  }

  return {
    autoCustomId: false,
    customId: item.customId || '',
    machineName: item.machineName || '',
    machineDetails: item.machineDetails || '',
    pauseReason: item.pauseReason || '',
    date: item.date ? item.date.split('T')[0] : '',
    technician,
    materialsAndParts: item.materialsAndParts?.length
      ? item.materialsAndParts.map((part) => ({
          name: part.name || '',
          quantity: Number(part.quantity) || 0,
          cost: Number(part.cost) || 0,
        }))
      : [{ ...EMPTY_PART }],
    readyForDelivery: item.readyForDelivery || false,
    technicianFee: Number(item.technicianFee) || 0,
    companyFee: Number(item.companyFee) || 0,
  };
};

const getTechnicianName = (item: ApiMachineProduction) => {
  if (item.technician && typeof item.technician === 'object' && 'name' in item.technician) return item.technician.name;
  return item.technicianName || '—';
};

export default function MachineProductionPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMachineProductionStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ProductionForm>(createEmptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductionForm>(createEmptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const handleAdd = useCallback(async () => {
    if (!addForm.machineName.trim() && !addForm.machineDetails.trim()) return;
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

  const startEdit = useCallback((r: ApiMachineProduction) => {
    setEditId(r._id);
    setShowAdd(false);
    setEditForm(productionToForm(r));
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
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

  const updatePart = useCallback(
    (index: number, key: keyof MaterialPartForm, value: string | number) => {
      if (!activeForm) return;
      const materialsAndParts = [...activeForm.materialsAndParts];
      materialsAndParts[index] = {
        ...materialsAndParts[index],
        [key]: key === 'name' ? String(value) : Number(value) || 0,
      };
      setActiveForm({ ...activeForm, materialsAndParts });
    },
    [activeForm, setActiveForm]
  );

  const addPart = useCallback(() => {
    if (!activeForm) return;
    setActiveForm({ ...activeForm, materialsAndParts: [...activeForm.materialsAndParts, { ...EMPTY_PART }] });
  }, [activeForm, setActiveForm]);

  const removePart = useCallback(
    (index: number) => {
      if (!activeForm) return;
      const materialsAndParts = activeForm.materialsAndParts.filter((_, i) => i !== index);
      setActiveForm({ ...activeForm, materialsAndParts: materialsAndParts.length ? materialsAndParts : [{ ...EMPTY_PART }] });
    },
    [activeForm, setActiveForm]
  );

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Factory size={24} />إدارة إنتاج الآلات</h1><p className={styles.pageSubtitle}>إنتاج الآلات وتتبع العمليات</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm(createEmptyForm()); setShowAdd(!showAdd); }}><Plus size={18} />جديد</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل إنتاج آلة</> : <><Plus size={18} />إنتاج آلة جديد</>}
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  className={styles.formCheckbox}
                  checked={activeForm.autoCustomId}
                  onChange={(e) => setActiveForm({ ...activeForm, autoCustomId: e.target.checked, customId: e.target.checked ? '' : activeForm.customId })}
                />
                رمز التعريف تلقائي (P)
              </label>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>رمز التعريف</label>
              <input
                className={styles.formInput}
                placeholder={activeForm.autoCustomId ? 'سيتم توليده تلقائياً' : 'أدخل رمزاً مثل P0000123'}
                value={activeForm.customId}
                onChange={(e) => setActiveForm({ ...activeForm, customId: e.target.value })}
                disabled={activeForm.autoCustomId}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>اسم الآلة</label>
              <input className={styles.formInput} value={activeForm.machineName} onChange={(e) => setActiveForm({ ...activeForm, machineName: e.target.value })} />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>تفاصيل الآلة</label>
              <input className={styles.formInput} value={activeForm.machineDetails} onChange={(e) => setActiveForm({ ...activeForm, machineDetails: e.target.value })} />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>التاريخ (تلقائي)</label>
              <input type="date" className={styles.formInput} value={activeForm.date} readOnly />
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
              <label className={styles.formLabel}>مدة الإنتاج</label>
              <input className={styles.formInput} value={isEditing ? fmtMin(items.find((row) => row._id === editId)?.productionDurationMs ?? 0) : '—'} readOnly />
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
              <textarea
                className={styles.formTextarea}
                value={activeForm.pauseReason}
                onChange={(e) => setActiveForm({ ...activeForm, pauseReason: e.target.value })}
              />
            </div>

            <div className={styles.formSectionLabel}><Factory size={14} />الخامات وقطع الغيار وتكلفتها</div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              {activeForm.materialsAndParts.map((part, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <input className={styles.formInput} placeholder="اسم المادة/القطعة" value={part.name} onChange={(e) => updatePart(index, 'name', e.target.value)} />
                  <input type="number" min={0} className={styles.formInput} placeholder="الكمية" value={part.quantity} onChange={(e) => updatePart(index, 'quantity', e.target.value)} />
                  <input type="number" min={0} className={styles.formInput} placeholder="التكلفة" value={part.cost} onChange={(e) => updatePart(index, 'cost', e.target.value)} />
                  <button type="button" className={styles.btnDanger} onClick={() => removePart(index)}><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" className={styles.btnSecondary} onClick={addPart}><Plus size={14} />إضافة خامة/قطعة</button>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>أجرة فني الإنتاج</label>
              <input type="number" min={0} className={styles.formInput} value={activeForm.technicianFee} onChange={(e) => setActiveForm({ ...activeForm, technicianFee: Number(e.target.value) || 0 })} />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>أجرة الشركة</label>
              <input type="number" min={0} className={styles.formInput} value={activeForm.companyFee} onChange={(e) => setActiveForm({ ...activeForm, companyFee: Number(e.target.value) || 0 })} />
            </div>
          </div>

          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={isEditing ? saveEdit : handleAdd} disabled={saving}>
              <Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className={styles.btnCancel} onClick={cancelForm}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>اسم الآلة</th><th>التفاصيل</th><th>الفني</th><th>التاريخ</th><th>المدة</th><th>جاهزة للتسليم</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.machineName || '—'}</td>
                <td>{r.machineDetails || '—'}</td>
                <td>{getTechnicianName(r)}</td>
                <td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td>
                <td>{fmtMin(r.productionDurationMs)}</td>
                <td><span className={`${styles.badge} ${r.readyForDelivery ? styles.badgeGreen : styles.badgeGray}`}>{r.readyForDelivery ? 'نعم' : 'لا'}</span></td>
                <td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
