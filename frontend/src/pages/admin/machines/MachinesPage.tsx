import { useEffect, useState, useCallback } from 'react';
import { Cog, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useMachinesStore } from '../../../shared/store/machinesStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiMachine } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface AddForm { name: string; }
const EMPTY: AddForm = { name: '' };
const techName = (t: unknown) => (t && typeof t === 'object' && 'name' in (t as Record<string, unknown>)) ? (t as { name: string }).name : '—';

export default function MachinesPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useMachinesStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) return; setSaving(true);
    try { await createItem(addForm as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch {} finally { setSaving(false); }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiMachine) => { setEditId(r._id); setEditForm({ name: r.name }); }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return; setSaving(true);
    try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch {} finally { setSaving(false); }
  }, [editId, editForm, updateItem]);

  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch {} }, [deleteItem]);

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Cog size={24} />إدارة الآلات</h1><p className={styles.pageSubtitle}>إدارة بيانات الآلات والفنيين المسؤولين</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>الاسم</th><th>فني 1</th><th>فني 2</th><th>فني 3</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {showAdd && (
              <tr className={styles.addFormRow}>
                <td><span className={styles.customId}>تلقائي</span></td>
                <td><input className={styles.formInput} placeholder="اسم الآلة *" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} /></td>
                <td colSpan={3}>يتم التعيين لاحقاً</td><td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} /></button></div></td>
              </tr>
            )}
            {items.map(r => editId === r._id ? (
              <tr key={r._id} className={styles.addFormRow}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td><input className={styles.formInput} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                <td colSpan={3}>—</td><td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} /></button></div></td>
              </tr>
            ) : (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{techName(r.technician1)}</td>
                <td>{techName(r.technician2)}</td>
                <td>{techName(r.technician3)}</td>
                <td><span className={`${styles.badge} ${r.isActive ? styles.badgeGreen : styles.badgeGray}`}>{r.isActive ? 'فعال' : 'غير فعال'}</span></td>
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
