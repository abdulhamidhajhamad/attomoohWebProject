import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { CONTACT } from '../../shared/constants';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import { useSEO } from '../../shared/hooks/useSEO';
import { useBranchSelector } from '../../shared/ui/BranchSelector';
import { Button } from '../../shared/ui/Button/Button';
import styles from './ContactPage.module.css';

export default function ContactPage() {
  const { t } = useTranslation();
  const { currentLang } = useLanguageDirection();
  const lang = currentLang as 'ar' | 'en';

  useSEO({
    title: t('contact.title'),
    description:
      'تواصل مع الطموح لتجهيزات المطابخ الصناعية. نحن هنا لمساعدتك.',
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  const { requestWhatsApp } = useBranchSelector();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const msg =
        lang === 'ar'
          ? `مرحباً، أنا ${form.name}.\n${form.message}\n\nرقم الهاتف: ${form.phone}\nالبريد: ${form.email}`
          : `Hello, I'm ${form.name}.\n${form.message}\n\nPhone: ${form.phone}\nEmail: ${form.email}`;
      requestWhatsApp(msg);
    },
    [form, lang, requestWhatsApp],
  );

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.heroSection}>
          <h1 className={styles.heroTitle}>{t('contact.title')}</h1>
          <p className={styles.heroSubtitle}>{t('contact.subtitle')}</p>
        </header>

        <div className={styles.contactGrid}>
          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="name">
                {t('contact.form.name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={styles.formInput}
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                {t('contact.form.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.formInput}
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="phone">
                {t('contact.form.phone')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={styles.formInput}
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="message">
                {t('contact.form.message')}
              </label>
              <textarea
                id="message"
                name="message"
                className={styles.formTextarea}
                value={form.message}
                onChange={handleChange}
                required
              />
            </div>

            <Button variant="whatsapp" size="lg" type="submit">
              <MessageCircle size={20} />
              {t('contact.form.send')}
            </Button>
          </form>

          {/* Info */}
          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Phone size={22} />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>{t('contact.info.phone')}</div>
                <a href={`tel:${CONTACT.phone}`} className={styles.infoValue}>
                  {CONTACT.phone}
                </a>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Mail size={22} />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>{t('contact.info.email')}</div>
                <a href={`mailto:${CONTACT.email}`} className={styles.infoValue}>
                  {CONTACT.email}
                </a>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <MapPin size={22} />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>{t('contact.info.address')}</div>
                <div className={styles.infoValue}>{CONTACT.address[lang]}</div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Clock size={22} />
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoLabel}>{t('contact.info.hours')}</div>
                <div className={styles.infoValue}>
                  {CONTACT.workingHours[lang]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
