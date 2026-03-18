import { Info } from 'lucide-react';
import { BRAND, CONTACT, COLORS } from '../../../shared/constants';
import styles from './AdminSettings.module.css';

export default function AdminSettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>الإعدادات</h1>
          <p className={styles.pageSubtitle}>إعدادات الموقع ومعلومات التواصل</p>
        </div>
      </div>

      {/* Brand Settings */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>بيانات العلامة التجارية</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>اسم العلامة (إنجليزي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={BRAND.name}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>اسم العلامة (عربي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={BRAND.nameAr}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>الشعار (إنجليزي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={BRAND.tagline.en}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>الشعار (عربي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={BRAND.tagline.ar}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>اللون الأساسي</label>
            <div className={styles.colorPreview}>
              <div
                className={styles.colorSwatch}
                style={{ background: COLORS.primary }}
              />
              <input
                type="text"
                className={styles.input}
                defaultValue={COLORS.primary}
                readOnly
              />
            </div>
          </div>
        </div>
        <div className={styles.cardNote}>
          <Info size={16} />
          <span>لتعديل هذه القيم، عدّل الملف: <code>src/shared/constants/index.ts</code></span>
        </div>
      </div>

      {/* Contact Settings */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>معلومات التواصل</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>رقم الهاتف</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={CONTACT.phone}
              readOnly
              dir="ltr"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>رقم واتساب</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={CONTACT.whatsapp}
              readOnly
              dir="ltr"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>البريد الإلكتروني</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={CONTACT.email}
              readOnly
              dir="ltr"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>العنوان (عربي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={CONTACT.address.ar}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>العنوان (إنجليزي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={CONTACT.address.en}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>ساعات العمل (عربي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={CONTACT.workingHours.ar}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>ساعات العمل (إنجليزي)</label>
            <input
              type="text"
              className={styles.input}
              defaultValue={CONTACT.workingHours.en}
              readOnly
            />
          </div>
        </div>
        <div className={styles.cardNote}>
          <Info size={16} />
          <span>لتعديل معلومات التواصل، عدّل الملف: <code>src/shared/constants/index.ts</code></span>
        </div>
      </div>

      {/* Logo Settings */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>اللوجو</h2>
        <div className={styles.logoSection}>
          <p className={styles.logoDesc}>
            اللوجو يظهر في الهيدر والفوتر ولوحة التحكم. لتغييره:
          </p>
          <ol className={styles.logoSteps}>
            <li>استبدل الملف <code>src/img/logo.jpg</code> بصورة اللوجو الجديدة</li>
            <li>يُفضل أن تكون الصورة بصيغة <code>.png</code> أو <code>.jpg</code> أو <code>.webp</code></li>
            <li>الحجم المثالي: <code>200×200 بكسل</code> أو أكبر</li>
            <li>أعد تشغيل خادم التطوير بعد تغيير الصورة</li>
          </ol>
        </div>
      </div>

      {/* i18n Settings */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>اللغات</h2>
        <div className={styles.langGrid}>
          <div className={styles.langCard}>
            <div className={styles.langFlag}>🇸🇦</div>
            <div>
              <strong>العربية</strong>
              <p>اللغة الافتراضية (RTL)</p>
            </div>
            <span className={styles.defaultBadge}>افتراضي</span>
          </div>
          <div className={styles.langCard}>
            <div className={styles.langFlag}>🇬🇧</div>
            <div>
              <strong>English</strong>
              <p>Secondary language (LTR)</p>
            </div>
          </div>
        </div>
        <div className={styles.cardNote}>
          <Info size={16} />
          <span>
            ملفات الترجمة: <code>src/shared/i18n/locales/ar.ts</code> و{' '}
            <code>src/shared/i18n/locales/en.ts</code>
          </span>
        </div>
      </div>

      {/* Admin Credentials */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>بيانات تسجيل الدخول</h2>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>اسم المستخدم</label>
            <input
              type="text"
              className={styles.input}
              defaultValue="admin"
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>كلمة المرور</label>
            <input
              type="password"
              className={styles.input}
              defaultValue="admin123"
              readOnly
            />
          </div>
        </div>
        <div className={`${styles.cardNote} ${styles.warningNote}`}>
          <Info size={16} />
          <span>
            لتغيير بيانات الدخول، عدّل الملف: <code>src/shared/store/adminStore.ts</code> —
            غيّر <code>ADMIN_USERNAME</code> و <code>ADMIN_PASSWORD</code>
          </span>
        </div>
      </div>
    </div>
  );
}
