import { useEffect, useState, useCallback } from 'react';
import { CalendarClock, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useMaintenanceScheduleStore } from '../../../shared/store/maintenanceScheduleStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { ReceptionSelect, EMPTY_RECEPTION } from '../../../shared/ui/ReceptionSelect';
import { TechnicianSelect, EMPTY_TECHNICIAN } from '../../../shared/ui/TechnicianSelect';
import { maintenanceScheduleService } from '../../../shared/api/services';
import type { ReceptionValue } from '../../../shared/ui/ReceptionSelect';
import type { TechnicianValue } from '../../../shared/ui/TechnicianSelect';
import type { ApiMaintenanceSchedule } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

const statusMap: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'مجدول', cls: 'badgeBlue' },
  rescheduled: { label: 'نقل الجدولة', cls: 'badgeYellow' },
  cancelled: { label: 'ملغي', cls: 'badgeRed' },
};

interface MaintenanceScheduleForm {
  machineReception: ReceptionValue;
  machineName: string;
  machineDetails: string;
  technician: TechnicianValue;
  scheduledDate: string;
  scheduledTime: string;
}

interface RescheduleForm {
  enabled: boolean;
  technician: TechnicianValue;
  date: string;
  time: string;
  reason: string;
}

interface CancelForm {
  enabled: boolean;
  reason: string;
}

const createEmptyScheduleForm = (): MaintenanceScheduleForm => ({
  machineReception: { ...EMPTY_RECEPTION },
  machineName: '',
  machineDetails: '',
  technician: { ...EMPTY_TECHNICIAN },
  scheduledDate: '',
  scheduledTime: '',
});

const createEmptyRescheduleForm = (): RescheduleForm => ({
  enabled: false,
  technician: { ...EMPTY_TECHNICIAN },
  date: '',
  time: '',
  reason: '',
});

const createEmptyCancelForm = (): CancelForm => ({
  enabled: false,
  reason: '',
});

const getReceptionMachineName = (reception: ReceptionValue['reception']) => {
  if (!reception) return '';
  if (reception.machine && typeof reception.machine === 'object' && 'name' in reception.machine) {
    return reception.machine.name;
  }
  return reception.machineDetails || '';
};

const scheduleToPayload = (form: MaintenanceScheduleForm) => ({
  machineReception: form.machineReception.id,
  machineName: form.machineName,
  machineDetails: form.machineDetails,
  technician: form.technician.mode === 'select' ? (form.technician.id || undefined) : undefined,
  technicianName: form.technician.mode === 'manual' ? form.technician.name : '',
  scheduledDate: form.scheduledDate,
  scheduledTime: form.scheduledTime,
});

const getMachineCode = (row: ApiMaintenanceSchedule) => {
  if (row.machineReception && typeof row.machineReception === 'object' && 'customId' in row.machineReception) {
    return row.machineReception.customId;
  }
  return '—';
};

const getTechnicianName = (row: ApiMaintenanceSchedule) => {
  if (row.technician && typeof row.technician === 'object' && 'name' in row.technician) return row.technician.name;
  return row.technicianName || '—';
};

const getRescheduledTechnicianName = (row: ApiMaintenanceSchedule) => {
  if (row.rescheduledTechnician && typeof row.rescheduledTechnician === 'object' && 'name' in row.rescheduledTechnician) return row.rescheduledTechnician.name;
  return row.rescheduledTechnicianName || '—';
};

const scheduleToForm = (item: ApiMaintenanceSchedule): MaintenanceScheduleForm => {
  let machineReception: ReceptionValue = { ...EMPTY_RECEPTION };
  if (item.machineReception && typeof item.machineReception === 'object' && '_id' in item.machineReception) {
    machineReception = { id: item.machineReception._id, reception: item.machineReception };
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
    technician,
    scheduledDate: item.scheduledDate ? item.scheduledDate.split('T')[0] : '',
    scheduledTime: item.scheduledTime || '',
  };
};

export default function MaintenanceSchedulePage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMaintenanceScheduleStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<MaintenanceScheduleForm>(createEmptyScheduleForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MaintenanceScheduleForm>(createEmptyScheduleForm());
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleForm>(createEmptyRescheduleForm());
  const [cancelForm, setCancelForm] = useState<CancelForm>(createEmptyCancelForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.machineReception.id || !addForm.scheduledDate || !addForm.scheduledTime) return;
    setSaving(true);
    try {
      await createItem(scheduleToPayload(addForm) as unknown as Record<string, unknown>);
      setAddForm(createEmptyScheduleForm());
      setShowAdd(false);
    } catch {
      // store handles error
    } finally {
      setSaving(false);
    }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiMaintenanceSchedule) => {
    setEditId(r._id);
    setShowAdd(false);
    setEditForm(scheduleToForm(r));

    let rsTech: TechnicianValue = { ...EMPTY_TECHNICIAN };
    if (r.rescheduledTechnician && typeof r.rescheduledTechnician === 'object' && '_id' in r.rescheduledTechnician) {
      rsTech = { id: r.rescheduledTechnician._id, name: r.rescheduledTechnician.name, mode: 'select' };
    } else if (r.rescheduledTechnicianName) {
      rsTech = { id: undefined, name: r.rescheduledTechnicianName, mode: 'manual' };
    }

    setRescheduleForm({
      enabled: false,
      technician: rsTech,
      date: r.rescheduledDate ? r.rescheduledDate.split('T')[0] : '',
      time: r.rescheduledTime || '',
      reason: r.rescheduleReason || '',
    });
    setCancelForm({ enabled: false, reason: r.cancellationReason || '' });
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try {
      if (cancelForm.enabled) {
        await maintenanceScheduleService.cancel(editId, { reason: cancelForm.reason || '' });
      } else if (rescheduleForm.enabled) {
        if (!rescheduleForm.date || !rescheduleForm.time) {
          setSaving(false);
          return;
        }
        await maintenanceScheduleService.reschedule(editId, {
          rescheduledTechnician: rescheduleForm.technician.mode === 'select' ? (rescheduleForm.technician.id || undefined) : undefined,
          rescheduledTechnicianName: rescheduleForm.technician.mode === 'manual' ? rescheduleForm.technician.name : '',
          rescheduledDate: rescheduleForm.date,
          rescheduledTime: rescheduleForm.time,
          rescheduleReason: rescheduleForm.reason,
        });
      } else {
        await updateItem(editId, scheduleToPayload(editForm) as unknown as Record<string, unknown>);
      }

      await fetchAll(search || undefined);
      setEditId(null);
    } catch {
      // store/service handle errors
    } finally {
      setSaving(false);
    }
  }, [cancelForm.enabled, cancelForm.reason, editForm, editId, fetchAll, rescheduleForm, search, updateItem]);

  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch {} }, [deleteItem]);

  const cancelEditor = useCallback(() => {
    setShowAdd(false);
    setEditId(null);
    setAddForm(createEmptyScheduleForm());
    setEditForm(createEmptyScheduleForm());
    setRescheduleForm(createEmptyRescheduleForm());
    setCancelForm(createEmptyCancelForm());
  }, []);

  const activeForm = showAdd ? addForm : editId ? editForm : null;
  const setActiveForm = showAdd ? setAddForm : setEditForm;
  const isEditing = !!editId;

  const handleReceptionChange = useCallback(
    (value: ReceptionValue) => {
      if (!activeForm) return;
      setActiveForm({
        ...activeForm,
        machineReception: value,
        machineName: getReceptionMachineName(value.reception),
        machineDetails: value.reception?.machineDetails || '',
      });
    },
    [activeForm, setActiveForm]
  );

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><CalendarClock size={24} />جدولة الصيانة</h1><p className={styles.pageSubtitle}>جدولة مواعيد الصيانة</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm(createEmptyScheduleForm()); setShowAdd(!showAdd); }}><Plus size={18} />جدولة جديدة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}

      {activeForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            {isEditing ? <><Pencil size={18} />تعديل / نقل جدولة / إلغاء</> : <><Plus size={18} />جدولة صيانة</>}
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
              <label className={styles.formLabel}>اسم الفني</label>
              <TechnicianSelect
                value={activeForm.technician}
                onChange={(technician) => setActiveForm({ ...activeForm, technician })}
                placeholder="اختر أو أدخل اسم الفني"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>تاريخ الجدولة *</label>
              <input type="date" className={styles.formInput} value={activeForm.scheduledDate} onChange={(e) => setActiveForm({ ...activeForm, scheduledDate: e.target.value })} />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>وقت الجدولة *</label>
              <input type="time" className={styles.formInput} value={activeForm.scheduledTime} onChange={(e) => setActiveForm({ ...activeForm, scheduledTime: e.target.value })} />
            </div>

            {isEditing && (
              <>
                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      className={styles.formCheckbox}
                      checked={rescheduleForm.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRescheduleForm({ ...rescheduleForm, enabled: checked });
                        if (checked) setCancelForm({ ...cancelForm, enabled: false });
                      }}
                    />
                    نقل الجدولة
                  </label>
                </div>

                {rescheduleForm.enabled && (
                  <>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>الفني الجديد</label>
                      <TechnicianSelect
                        value={rescheduleForm.technician}
                        onChange={(technician) => setRescheduleForm({ ...rescheduleForm, technician })}
                        placeholder="اختر أو أدخل الفني"
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>تاريخ النقل *</label>
                      <input type="date" className={styles.formInput} value={rescheduleForm.date} onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })} />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>وقت النقل *</label>
                      <input type="time" className={styles.formInput} value={rescheduleForm.time} onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })} />
                    </div>
                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label className={styles.formLabel}>سبب نقل الجدولة</label>
                      <textarea className={styles.formTextarea} value={rescheduleForm.reason} onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })} />
                    </div>
                  </>
                )}

                <div className={`${styles.formField} ${styles.fullWidth}`}>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      className={styles.formCheckbox}
                      checked={cancelForm.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCancelForm({ ...cancelForm, enabled: checked });
                        if (checked) setRescheduleForm({ ...rescheduleForm, enabled: false });
                      }}
                    />
                    إلغاء الجدولة
                  </label>
                </div>

                {cancelForm.enabled && (
                  <div className={`${styles.formField} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>سبب الإلغاء</label>
                    <textarea className={styles.formTextarea} value={cancelForm.reason} onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })} />
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={isEditing ? saveEdit : handleAdd} disabled={saving || !activeForm.machineReception.id || !activeForm.scheduledDate || !activeForm.scheduledTime}>
              <Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className={styles.btnCancel} onClick={cancelEditor}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>رمز الآلة</th><th>اسم الآلة</th><th>تفاصيل</th><th>الفني</th><th>تاريخ الجدولة</th><th>الساعة</th><th>الحالة</th><th>فني نقل الجدولة</th><th>سبب النقل / الإلغاء</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{getMachineCode(r)}</span></td>
                <td style={{ fontWeight: 600 }}>{r.machineName || '—'}</td>
                <td>{r.machineDetails || '—'}</td>
                <td>{getTechnicianName(r)}</td>
                <td>{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('ar') : '—'}</td>
                <td>{r.scheduledTime || '—'}</td>
                <td><span className={`${styles.badge} ${styles[statusMap[r.status]?.cls || 'badgeGray']}`}>{statusMap[r.status]?.label || r.status}</span></td>
                <td>{getRescheduledTechnicianName(r)}</td>
                <td>{r.status === 'cancelled' ? (r.cancellationReason || '—') : (r.rescheduleReason || '—')}</td>
                <td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={10}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
