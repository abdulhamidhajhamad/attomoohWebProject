import { useEffect, useState, useCallback } from 'react';
import { Cog, Plus, Trash2, Pencil, X, Check, FileText } from 'lucide-react';
import { useServiceOrdersStore } from '../../../shared/store/serviceOrdersStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import type { ApiMachineType, CreateMachineTypeRequest } from '../../../shared/api/types';
import styles from './MachineTypesPage.module.css';

const EMPTY_FORM: CreateMachineTypeRequest = { name: '', description: '' };

export default function MachineTypesPage() {
  const {
    machineTypes,
    loading,
    error,
    fetchMachineTypes,
    createMachineType,
    updateMachineType,
    deleteMachineType,
    clearError,
  } = useServiceOrdersStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<CreateMachineTypeRequest>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CreateMachineTypeRequest>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMachineTypes();
  }, [fetchMachineTypes]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      await createMachineType(addForm);
      setAddForm({ ...EMPTY_FORM });
      setShowAddForm(false);
    } catch {
      /* store error */
    } finally {
      setSaving(false);
    }
  }, [addForm, createMachineType]);

  const handleStartEdit = useCallback((m: ApiMachineType) => {
    setEditId(m._id);
    setEditForm({ name: m.name, description: m.description || '' });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateMachineType(editId, editForm);
      setEditId(null);
    } catch {
      /* store error */
    } finally {
      setSaving(false);
    }
  }, [editId, editForm, updateMachineType]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`هل أنت متأكد من حذف نوع الآلة "${name}"؟`)) return;
      try {
        await deleteMachineType(id);
      } catch {
        /* store error */
      }
    },
    [deleteMachineType],
  );

  if (loading && machineTypes.length === 0) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Cog size={24} />
            أنواع الآلات
          </h1>
          <p className={styles.pageSubtitle}>
            إدارة أنواع الآلات التي يتم صيانتها
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.btnPrimary}
            onClick={() => {
              clearError();
              setShowAddForm(!showAddForm);
            }}
          >
            <Plus size={18} />
            نوع جديد
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>اسم النوع</th>
              <th>الوصف</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {/* Add Row */}
            {showAddForm && (
              <tr className={styles.addFormRow}>
                <td>
                  <input
                    className={styles.formInput}
                    placeholder="اسم نوع الآلة *"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={styles.formInput}
                    placeholder="وصف (اختياري)"
                    value={addForm.description}
                    onChange={(e) =>
                      setAddForm({ ...addForm, description: e.target.value })
                    }
                  />
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.btnSave}
                      onClick={handleAdd}
                      disabled={saving}
                    >
                      <Check size={14} />
                      حفظ
                    </button>
                    <button
                      className={styles.btnCancel}
                      onClick={() => setShowAddForm(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {machineTypes.map((m) =>
              editId === m._id ? (
                <tr key={m._id} className={styles.addFormRow}>
                  <td>
                    <input
                      className={styles.formInput}
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.formInput}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnSave}
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        <Check size={14} />
                        حفظ
                      </button>
                      <button
                        className={styles.btnCancel}
                        onClick={() => setEditId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={m._id}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>{m.description || '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => handleStartEdit(m)}
                        title="تعديل"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleDelete(m._id, m.name)}
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}

            {machineTypes.length === 0 && !showAddForm && (
              <tr>
                <td colSpan={3}>
                  <div className={styles.emptyState}>
                    <FileText size={40} />
                    <p>لا يوجد أنواع آلات بعد</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
