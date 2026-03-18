import { useEffect, useState, useCallback } from 'react';
import { Download, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useMachineReceptionStore } from '../../../shared/store/machineReceptionStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiMachineReception } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

const statusMap: Record<string, { label: string; cls: string }> = {
  waiting: { label: 'انتظار', cls: 'badgeYellow' },
  in_maintenance: { label: 'قيد الصيانة', cls: 'badgeBlue' },
  postponed: { label: 'مؤجل', cls: 'badgeYellow' },
  ready: { label: 'جاهز', cls: 'badgeGreen' },
  rejected: { label: 'مرفوض', cls: 'badgeRed' },
  delivered: { label: 'تم التسليم', cls: 'badgeGray' },
};

interface AddForm { machineDetails: string; customerName: string; customerPhone: string; customerProblemDesc: string; }
const EMPTY: AddForm = { machineDetails: '', customerName: '', customerPhone: '', customerProblemDesc: '' };

export default function MachineReceptionPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMachineReceptionStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.customerName.trim()) return; setSaving(true);
    try { await createItem(addForm as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch {} finally { setSaving(false); }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiMachineReception) => { setEditId(r._id); setEditForm({ machineDetails: r.machineDetails, customerName: r.customerName, customerPhone: r.customerPhone, customerProblemDesc: r.customerProblemDesc }); }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return; setSaving(true);
    try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch {} finally { setSaving(false); }
  }, [editId, editForm, updateItem]);

  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch {} }, [deleteItem]);

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Download size={24} />إدارة استلام الآلات</h1><p className={styles.pageSubtitle}>استلام آلات من الزبائن وتتبع حالتها</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>الآلة</th><th>الزبون</th><th>الهاتف</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
          <tbody>
            {showAdd && (
              <tr className={styles.addFormRow}>
                <td><span className={styles.customId}>تلقائي</span></td>
                <td><input className={styles.formInput} placeholder="تفاصيل الآلة *" value={addForm.machineDetails} onChange={e => setAddForm({...addForm, machineDetails: e.target.value})} /></td>
                <td><input className={styles.formInput} placeholder="اسم الزبون *" value={addForm.customerName} onChange={e => setAddForm({...addForm, customerName: e.target.value})} /></td>
                <td><input className={styles.formInput} placeholder="الهاتف" value={addForm.customerPhone} onChange={e => setAddForm({...addForm, customerPhone: e.target.value})} /></td>
                <td>—</td><td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} /></button></div></td>
              </tr>
            )}
            {items.map(r => editId === r._id ? (
              <tr key={r._id} className={styles.addFormRow}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td><input className={styles.formInput} value={editForm.machineDetails} onChange={e => setEditForm({...editForm, machineDetails: e.target.value})} /></td>
                <td><input className={styles.formInput} value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} /></td>
                <td><input className={styles.formInput} value={editForm.customerPhone} onChange={e => setEditForm({...editForm, customerPhone: e.target.value})} /></td>
                <td>—</td><td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} /></button></div></td>
              </tr>
            ) : (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.machineDetails || '—'}</td>
                <td>{r.customerName}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{r.customerPhone || '—'}</td>
                <td><span className={`${styles.badge} ${styles[statusMap[r.status]?.cls || 'badgeGray']}`}>{statusMap[r.status]?.label || r.status}</span></td>
                <td>{r.receptionDate ? new Date(r.receptionDate).toLocaleDateString('ar') : '—'}</td>
                <td><div className={styles.actions}><button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button><button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && !showAdd && <tr><td colSpan={7}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
