import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Search, Trash2, Pencil, X, Check, FileText, ShieldCheck, KeyRound } from 'lucide-react';
import { useEmployeesStore } from '../../../shared/store/employeesStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiEmployee, ApiLinkedUser } from '../../../shared/api/types';
import styles from '../shared/CrudPage.module.css';

const CAT_LABELS: Record<string, string> = { permanent: 'دائم', partial: 'جزئي', temporary: 'مؤقت', external: 'خارجي' };
const ROLE_LABELS: Record<string, string> = { technician: 'فني صيانة', user: 'مستخدم', admin: 'مدير' };

interface AddForm {
  name: string; phone: string; jobTitle: string; category: string;
  grantAccess: boolean; email: string; password: string; role: string;
}
const EMPTY: AddForm = { name: '', phone: '', jobTitle: '', category: 'permanent', grantAccess: false, email: '', password: '', role: 'technician' };

interface EditForm { name: string; phone: string; jobTitle: string; category: string; }
const EMPTY_EDIT: EditForm = { name: '', phone: '', jobTitle: '', category: 'permanent' };

function getLinkedUser(emp: ApiEmployee): ApiLinkedUser | null {
  if (!emp.linkedUser || typeof emp.linkedUser === 'string') return null;
  return emp.linkedUser;
}

export default function EmployeesPage() {
  const { items, loading, error, fetchAll, createItem, updateItem, deleteItem, clearError } = useEmployeesStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ ...EMPTY_EDIT });
  const [saving, setSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchAll(search || undefined), 300); return () => clearTimeout(t); }, [fetchAll, search]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) return;
    if (addForm.grantAccess && (!addForm.email.trim() || !addForm.password.trim())) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: addForm.name, phone: addForm.phone,
        jobTitle: addForm.jobTitle, category: addForm.category,
      };
      if (addForm.grantAccess) {
        payload.email = addForm.email;
        payload.password = addForm.password;
        payload.role = addForm.role;
      }
      await createItem(payload);
      setAddForm({ ...EMPTY });
      setShowAdd(false);
    } catch { /* store handles error */ } finally { setSaving(false); }
  }, [addForm, createItem]);

  const startEdit = useCallback((r: ApiEmployee) => {
    setEditId(r._id);
    setEditForm({ name: r.name, phone: r.phone, jobTitle: r.jobTitle, category: r.category });
    setShowAdd(false);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try { await updateItem(editId, editForm as unknown as Record<string, unknown>); setEditId(null); } catch { /* store */ } finally { setSaving(false); }
  }, [editId, editForm, updateItem]);

  const handleDel = useCallback(async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try { await deleteItem(id); } catch { /* store */ }
  }, [deleteItem]);

  if (loading && items.length === 0) return <div className={styles.page}><LoadingSpinner /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}><Users size={24} />إدارة الموارد البشرية</h1><p className={styles.pageSubtitle}>بيانات الموظفين</p></div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}><Search size={18} color="#9ca3af" /><input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className={styles.btnPrimary} onClick={() => { clearError(); setEditId(null); setAddForm({ ...EMPTY }); setShowAdd(!showAdd); }}><Plus size={18} />إضافة</button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Add Form Card ── */}
      {showAdd && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}><Plus size={18} />إضافة موظف جديد</h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الاسم *</label>
              <input className={styles.formInput} placeholder="اسم الموظف" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الهاتف</label>
              <input className={styles.formInput} placeholder="رقم الهاتف" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>المسمى الوظيفي</label>
              <input className={styles.formInput} placeholder="المسمى الوظيفي" value={addForm.jobTitle} onChange={e => setAddForm({ ...addForm, jobTitle: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الفئة</label>
              <select className={styles.formSelect} value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}>
                <option value="permanent">دائم</option>
                <option value="partial">جزئي</option>
                <option value="temporary">مؤقت</option>
                <option value="external">خارجي</option>
              </select>
            </div>

            {/* ── System Access Section ── */}
            <div className={styles.formDivider} />
            <div className={styles.formSectionLabel}><KeyRound size={15} />دخول النظام</div>
            <div className={styles.formField}>
              <label className={styles.switchLabel}>
                <input type="checkbox" className={styles.formCheckbox} checked={addForm.grantAccess} onChange={e => setAddForm({ ...addForm, grantAccess: e.target.checked, email: '', password: '', role: 'technician' })} />
                منح صلاحية دخول النظام
              </label>
            </div>
            {addForm.grantAccess && (
              <>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>الدور</label>
                  <select className={styles.formSelect} value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                    <option value="technician">فني صيانة</option>
                    <option value="user">مستخدم</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>البريد الإلكتروني *</label>
                  <input className={styles.formInput} type="email" placeholder="example@email.com" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>كلمة المرور *</label>
                  <input className={styles.formInput} type="password" placeholder="6 أحرف على الأقل" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={handleAdd} disabled={saving}><Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            <button className={styles.btnCancel} onClick={() => setShowAdd(false)}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      {/* ── Edit Form Card ── */}
      {editId && (
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}><Pencil size={18} />تعديل موظف</h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الاسم</label>
              <input className={styles.formInput} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الهاتف</label>
              <input className={styles.formInput} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>المسمى الوظيفي</label>
              <input className={styles.formInput} value={editForm.jobTitle} onChange={e => setEditForm({ ...editForm, jobTitle: e.target.value })} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>الفئة</label>
              <select className={styles.formSelect} value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="permanent">دائم</option>
                <option value="partial">جزئي</option>
                <option value="temporary">مؤقت</option>
                <option value="external">خارجي</option>
              </select>
            </div>
          </div>
          <div className={styles.formCardActions}>
            <button className={styles.btnSave} onClick={saveEdit} disabled={saving}><Check size={14} />{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            <button className={styles.btnCancel} onClick={() => setEditId(null)}><X size={14} />إلغاء</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>الرمز</th><th>الاسم</th><th>الهاتف</th><th>المسمى الوظيفي</th><th>الفئة</th><th>دخول النظام</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r._id}>
                <td><span className={styles.customId}>{r.customId}</span></td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{r.phone || '—'}</td>
                <td>{r.jobTitle || '—'}</td>
                <td><span className={`${styles.badge} ${styles.badgeBlue}`}>{CAT_LABELS[r.category] || r.category}</span></td>
                <td>
                  {getLinkedUser(r) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className={`${styles.badge} ${styles.badgePurple}`}>
                        <ShieldCheck size={12} />{ROLE_LABELS[getLinkedUser(r)!.role] || getLinkedUser(r)!.role}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{getLinkedUser(r)!.email}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>—</span>
                  )}
                </td>
                <td><span className={`${styles.badge} ${r.isActive ? styles.badgeGreen : styles.badgeGray}`}>{r.isActive ? 'فعال' : 'غير فعال'}</span></td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => startEdit(r)} title="تعديل"><Pencil size={14} /></button>
                    <button className={styles.btnDanger} onClick={() => handleDel(r._id)} title="حذف"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8}><div className={styles.emptyState}><FileText size={40} /><p>لا يوجد بيانات</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
