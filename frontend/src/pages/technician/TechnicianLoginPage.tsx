import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, LogIn } from 'lucide-react';
import { useTechnicianAuthStore } from '../../shared/store/technicianAuthStore';
import styles from './TechnicianPages.module.css';

export default function TechnicianLoginPage() {
  const navigate = useNavigate();
  const login = useTechnicianAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        const success = await login(email, password);
        if (success) {
          navigate('/technician');
        } else {
          setError('بيانات الدخول غير صحيحة');
        }
      } catch {
        setError('حدث خطأ — حاول مرة أخرى');
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, navigate],
  );

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <Wrench size={36} color="var(--color-primary, #90297d)" />
          <h1>دخول الفنيين</h1>
          <p>سجّل دخولك لعرض المهام المسندة إليك</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>البريد الإلكتروني</label>
            <input
              className={styles.formInput}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>كلمة المرور</label>
            <input
              className={styles.formInput}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.loginBtn}
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}