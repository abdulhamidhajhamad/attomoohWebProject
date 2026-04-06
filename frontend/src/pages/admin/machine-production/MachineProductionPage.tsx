import { useEffect, useState, useCallback } from 'react';
import { Factory, Plus, Search, Trash2, Pencil, X, Check, FileText, Eye, Clock } from 'lucide-react';
import { useMachineProductionStore } from '../../../shared/store/machineProductionStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiMachineProduction } from '../../../shared/api/types';
import { TechnicianSelect, EMPTY_TECHNICIAN } from '../../../shared/ui/TechnicianSelect';
import type { TechnicianValue } from '../../../shared/ui/TechnicianSelect';
import styles from '../shared/CrudPage.module.css';

const statusMap: Record<string, { label: string; cls: string }> = {
  assigned: { label: 'معين', cls: 'badgeBlue' },
  in_progress: { label: 'قيد الإنتاج', cls: 'badgeBlue' },
  postponed: { label: 'مؤجل', cls: 'badgeYellow' },
  ready: { label: 'جاهز', cls: 'badgeGreen' },
  rejected: { label: 'مرفوض', cls: 'badgeRed' },
};
const fmtMin = (ms: number) => ms > 0 ? Math.round(ms / 60000) + ' دقيقة' : '—';

interface ProductionForm {
  autoCustomId: boolean;
  customId: string;
  machineName: string;
  machineDetails: string;
  date: string;
  technician: TechnicianValue;
  status: 'assigned' | 'in_progress' | 'postponed' | 'ready' | 'rejected';
  scheduledStartTime: string;
  scheduledEndTime: string;
}

const createEmptyForm = (): ProductionForm => ({
  autoCustomId: true,
  customId: '',
  machineName: '',
  machineDetails: '',
  date: new Date().toISOString().split('T')[0] ?? '',
  technician: { ...EMPTY_TECHNICIAN },
  status: 'assigned',
  scheduledStartTime: '',
  scheduledEndTime: '',
});

const formToPayload = (form: ProductionForm) => ({
  customId: form.autoCustomId ? undefined : form.customId.trim() || undefined,
  machineName: form.machineName,
  machineDetails: form.machineDetails,
  machineNameAndDetails: [form.machineName, form.machineDetails].filter(Boolean).join(' - '),
  technician: form.technician.mode === 'select' ? (form.technician.id || undefined) : undefined,
  technicianName: form.technician.mode === 'manual' ? form.technician.name : '',
  status: form.status,
  scheduledStartTime: form.scheduledStartTime || null,
  scheduledEndTime: form.scheduledEndTime || null,
});

const productionToForm = (item: ApiMachineProduction): ProductionForm => {
  let technician: TechnicianValue = { ...EMPTY_TECHNICIAN };
  if (item.technician && typeof item.technician === 'object' && '_id' in item.technician) {
    technician = { id: item.technician._id, name: item.technician.name, mode: 'select' };
  } else if (item.technicianName) {
    technician = { id: undefined, name: item.technicianName, mode: 'manual' };
  }

  const scheduledStartTime = item.scheduledStartTime
    ? new Date(item.scheduledStartTime).toISOString().slice(0, 16)
    : '';
  const scheduledEndTime = item.scheduledEndTime
    ? new Date(item.scheduledEndTime).toISOString().slice(0, 16)
    : '';

  return {
    autoCustomId: false,
    customId: item.customId || '',
    machineName: item.machineName || '',
    machineDetails: item.machineDetails || '',
    date: item.date ? item.date.split('T')[0] : '',
    technician,
    status: (item.status || 'assigned') as ProductionForm['status'],
    scheduledStartTime,
    scheduledEndTime,
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
  const [reportModal, setReportModal] = useState<ApiMachineProduction | null>(null);

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
              <label className={styles.formLabel}>الوضع</label>
              <select
                className={styles.formSelect}
                value={activeForm.status}
                onChange={(e) => setActiveForm({ ...activeForm, status: e.target.value as ProductionForm['status'] })}
              >
                <option value="assigned">معين</option>
                <option value="in_progress">قيد الإنتاج</option>
                <option value="postponed">مؤجل</option>
                <option value="ready">جاهز</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>مدة الإنتاج</label>
              <input className={styles.formInput} value={isEditing ? fmtMin(items.find((row) => row._id === editId)?.productionDurationMs ?? 0) : '—'} readOnly />
            </div>

            <div className={styles.formSectionLabel}><Clock size={14} />جدولة المهمة</div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>وقت البدء المجدول</label>
              <input
                type="datetime-local"
                className={styles.formInput}
                value={activeForm.scheduledStartTime}
                onChange={(e) => setActiveForm({ ...activeForm, scheduledStartTime: e.target.value })}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>وقت الانتهاء المجدول</label>
              <input
                type="datetime-local"
                className={styles.formInput}
                value={activeForm.scheduledEndTime}
                onChange={(e) => setActiveForm({ ...activeForm, scheduledEndTime: e.target.value })}
              />
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
          <thead><tr><th>الرمز</th><th>اسم الآلة</th><th>التفاصيل</th><th>الفني</th><th>التاريخ</th><th>الوضع</th><th>المدة</th><th>جاهزة للتسليم</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.machineName || '—'}</td>
                <td>{r.machineDetails || '—'}</td>
                <td>{getTechnicianName(r)}</td>
                <td>{r.date ? new Date(r.date).toLocaleDateString('ar') : '—'}</td>
                <td><span className={`${styles.badge} ${styles[statusMap[r.status]?.cls || 'badgeGray']}`}>{statusMap[r.status]?.label || r.status}</span></td>
                <td>{fmtMin(r.productionDurationMs)}</td>
                <td><span className={`${styles.badge} ${r.readyForDelivery ? styles.badgeGreen : styles.badgeGray}`}>{r.readyForDelivery ? 'نعم' : 'لا'}</span></td>
                <td>
                  <div className={styles.actions}>
                    {r.status === 'ready' && (
                      <button className={styles.btnSecondary} onClick={() => setReportModal(r)} title="عرض التقرير">
                        <Eye size={14} />
                      </button>
                    )}
                    <button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button>
                    <button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={9}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>

      {reportModal && (
        <div className={styles.modalOverlay} onClick={() => setReportModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FileText size={18} /> تقرير الفني</h3>
              <button className={styles.modalClose} onClick={() => setReportModal(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.reportSection}>
                <label>اسم الآلة</label>
                <p>{reportModal.machineName || '—'}</p>
              </div>
              <div className={styles.reportSection}>
                <label>الفني</label>
                <p>{getTechnicianName(reportModal)}</p>
              </div>
              <div className={styles.reportSection}>
                <label>مدة الإنتاج</label>
                <p>{fmtMin(reportModal.productionDurationMs)}</p>
              </div>
              <div className={styles.reportSection}>
                <label>سبب الإيقاف</label>
                <p>{reportModal.pauseReason || '—'}</p>
              </div>
              <div className={styles.reportSection}>
                <label>الخامات وقطع الغيار</label>
                {reportModal.materialsAndParts && reportModal.materialsAndParts.length > 0 ? (
                  <table className={styles.miniTable}>
                    <thead><tr><th>المادة/القطعة</th><th>الكمية</th><th>التكلفة</th></tr></thead>
                    <tbody>
                      {reportModal.materialsAndParts.map((part, i) => (
                        <tr key={i}><td>{part.name}</td><td>{part.quantity}</td><td>{part.cost.toLocaleString('ar')} ل.س</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p>—</p>}
              </div>
              <div className={styles.reportSection}>
                <label>أجرة الفني</label>
                <p>{reportModal.technicianFee?.toLocaleString('ar') || 0} ل.س</p>
              </div>
              <div className={styles.reportSection}>
                <label>أجرة الشركة</label>
                <p>{reportModal.companyFee?.toLocaleString('ar') || 0} ل.س</p>
              </div>
              {reportModal.rejectionReason && (
                <div className={styles.reportSection}>
                  <label>سبب الرفض</label>
                  <p style={{ color: '#dc2626' }}>{reportModal.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
