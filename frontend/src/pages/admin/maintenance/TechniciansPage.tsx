import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  UserPlus,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { useMaintenanceStore } from '../../../shared/store/maintenanceStore';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner/LoadingSpinner';
import { httpClient } from '../../../shared/api/httpClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import type { ApiTechnician } from '../../../shared/api/types';
import styles from './MaintenancePage.module.css';

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  available: { label: 'متاح', bg: '#dcfce7', color: '#16a34a' },
  on_task: { label: 'في مهمة', bg: '#fef3c7', color: '#d97706' },
  off_duty: { label: 'خارج الخدمة', bg: '#f3f4f6', color: '#6b7280' },
};

export default function TechniciansPage() {
  const navigate = useNavigate();
  const { technicians, fetchTechnicians } = useMaintenanceStore();
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState('');

  // Add technician form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTechnicians().finally(() => setLoading(false));
  }, [fetchTechnicians]);

  const handleAddTechnician = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setAddError('');
      setSubmitting(true);

      try {
        await httpClient.post(
          ENDPOINTS.USERS.BASE,
          {
            name: name.trim(),
            email: email.trim(),
            password,
            phone: phone.trim(),
            role: 'technician',
          },
          true,
        );

        setShowAddForm(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        await fetchTechnicians();
      } catch (err: unknown) {
        setAddError(err instanceof Error ? err.message : 'خطأ في إنشاء الفني');
      } finally {
        setSubmitting(false);
      }
    },
    [name, email, password, phone, fetchTechnicians],
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <a
        href="#"
        className={styles.backLink}
        onClick={(e) => {
          e.preventDefault();
          navigate('/admin/maintenance');
        }}
      >
        <ArrowRight size={16} />
        العودة إلى الصيانة
      </a>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Users size={24} />
            إدارة الفنيين
          </h1>
          <p className={styles.pageSubtitle}>
            {technicians.length} فني مسجل
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setShowAddForm(true)}
        >
          <UserPlus size={18} />
          إضافة فني جديد
        </button>
      </div>

      {/* Technicians Grid */}
      {technicians.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} />
          <p>لا يوجد فنيين مسجلين بعد</p>
          <button
            className={styles.btnPrimary}
            onClick={() => setShowAddForm(true)}
          >
            <UserPlus size={18} />
            إضافة أول فني
          </button>
        </div>
      ) : (
        <div className={styles.techGrid}>
          {technicians.map((tech: ApiTechnician) => {
            const statusInfo = STATUS_LABELS[tech.technicianStatus] || STATUS_LABELS.available;
            return (
              <div key={tech._id} className={styles.techCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className={styles.techName}>{tech.name}</h3>
                  <span
                    className={styles.techStatusBadge}
                    style={{ background: statusInfo.bg, color: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className={styles.techInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Mail size={14} />
                    {tech.email}
                  </div>
                  {tech.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Phone size={14} />
                      {tech.phone}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.7 }}>
                    <Shield size={14} />
                    فني صيانة
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Technician Modal */}
      {showAddForm && (
        <div className={styles.modalOverlay} onClick={() => setShowAddForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              <UserPlus size={20} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
              إضافة فني جديد
            </h3>

            <form onSubmit={handleAddTechnician}>
              {addError && <div className={styles.errorMsg}>{addError}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>الاسم *</label>
                <input
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="اسم الفني"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>البريد الإلكتروني *</label>
                <input
                  className={styles.formInput}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>كلمة المرور *</label>
                <input
                  className={styles.formInput}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="6 أحرف على الأقل"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>رقم الهاتف</label>
                <input
                  className={styles.formInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowAddForm(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={submitting}
                >
                  {submitting ? 'جاري الإضافة...' : 'إضافة الفني'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
