import { useEffect, useState, useCallback } from 'react';
import { Hammer, Plus, Search, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useToolsStore } from '../../../shared/store/toolsStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiTool } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

interface AddForm { name: string; quantity: string; location: string; notes: string; }
const EMPTY: AddForm = { name: '', quantity: '', location: '', notes: '' };

export default function ToolsPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useToolsStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);
  const toPayload = (f: AddForm) => ({ name: f.name, quantity: Number(f.quantity) || 0, location: f.location, notes: f.notes });
  const handleAdd = useCallback(async () => { if (!addForm.name.trim()) return; setSaving(true); try { await createItem(toPayload(addForm) as unknown as Record<string, unknown>); setAddForm({ ...EMPTY }); setShowAdd(false); } catch { /* store */ } finally { setSaving(false); } }, [addForm, createItem]);
  const startEdit = useCallback((r: ApiTool) => { setEditId(r._id); setEditForm({ name: r.name, quantity: String(r.quantity), location: r.location, notes: r.notes }); }, []);
  const saveEdit = useCallback(async () => { if (!editId) return; setSaving(true); try { await updateItem(editId, toPayload(editForm) as unknown as Record<string, unknown>); setEditId(null); } catch { /* store */ } finally { setSaving(false); } }, [editId, editForm, updateItem]);
  const handleDel = useCallback(async (id: string) => { if (!confirm('هل أنت متأكد من الحذف؟')) return; try { await deleteItem(id); } catch { /* store */ } }, [deleteItem]);
  const techName = (t: unknown) => (t && typeof t === 'object' && 'name' in (t as Record<string, unknown>)) ? (t as { name: string }).name : '—';
  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Hammer size={24} />إدارة العدد</h1><p className={styles.pageSubtitle}>العدد والأدوات</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>الاسم</th><th>الكمية</th><th>الفني المسؤول</th><th>الموقع</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {showAdd && (
              <tr className={styles.addFormRow}>
                <td><span className={styles.customId}>تلقائي</span></td>
                <td><input className={styles.formInput} placeholder="الاسم *" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} /></td>
                <td><input className={styles.formInput} type="number" placeholder="0" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: e.target.value })} /></td>
                <td>يتم التعيين لاحقاً</td>
                <td><input className={styles.formInput} placeholder="الموقع" value={addForm.location} onChange={e => setAddForm({ ...addForm, location: e.target.value })} /></td>
                <td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} /></button></div></td>
              </tr>
            )}
            {items.map(r => editId === r._id ? (
              <tr key={r._id} className={styles.addFormRow}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td><input className={styles.formInput} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                <td><input className={styles.formInput} type="number" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} /></td>
                <td>—</td>
                <td><input className={styles.formInput} value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} /></td>
                <td>—</td>
                <td><div className={styles.actions}><button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />حفظ</button><button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} /></button></div></td>
              </tr>
            ) : (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{r.quantity}</td>
                <td>{techName(r.responsibleTechnician)}</td>
                <td>{r.location || '—'}</td>
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
