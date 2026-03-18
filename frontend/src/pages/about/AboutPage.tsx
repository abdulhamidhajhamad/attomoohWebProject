import { useTranslation } from 'react-i18next';
import { Award, Shield, Headphones, Truck } from 'lucide-react';
import { Section } from '../../shared/ui/Section/Section';
import { useSEO } from '../../shared/hooks/useSEO';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  const { t } = useTranslation();

  useSEO({
    title: t('about.title'),
    description:
      'الطموح - شريكك الموثوق في تجهيز المطابخ الصناعية. سنوات من الخبرة في توريد معدات المطاعم والملاحم.',
  });

  return (
    <div className="container">
      <div className={styles.page}>
        {/* Hero */}
        <header className={styles.heroSection}>
          <h1 className={styles.heroTitle}>{t('about.title')}</h1>
          <p className={styles.heroSubtitle}>{t('about.subtitle')}</p>
        </header>

        {/* Mission & Vision */}
        <div className={styles.missionVision}>
          <div className={styles.mvCard}>
            <h2 className={styles.mvTitle}>{t('about.mission')}</h2>
            <p className={styles.mvText}>{t('about.missionText')}</p>
          </div>
          <div className={styles.mvCard}>
            <h2 className={styles.mvTitle}>{t('about.vision')}</h2>
            <p className={styles.mvText}>{t('about.visionText')}</p>
          </div>
        </div>

        {/* Values */}
        <Section title={t('about.values')}>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Award size={28} />
              </div>
              <h3 className={styles.valueTitle}>{t('about.quality')}</h3>
              <p className={styles.valueText}>{t('about.qualityText')}</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Shield size={28} />
              </div>
              <h3 className={styles.valueTitle}>{t('about.trust')}</h3>
              <p className={styles.valueText}>{t('about.trustText')}</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Headphones size={28} />
              </div>
              <h3 className={styles.valueTitle}>{t('about.service')}</h3>
              <p className={styles.valueText}>{t('about.serviceText')}</p>
            </div>
          </div>
        </Section>

        {/* Why Us */}
        <Section title={t('about.whyUs')}>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Award size={28} />
              </div>
              <h3 className={styles.valueTitle}>{t('about.experience')}</h3>
              <p className={styles.valueText}>{t('about.experienceText')}</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Shield size={28} />
              </div>
              <h3 className={styles.valueTitle}>{t('about.warranty')}</h3>
              <p className={styles.valueText}>{t('about.warrantyText')}</p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Truck size={28} />
              </div>
              <h3 className={styles.valueTitle}>{t('about.delivery')}</h3>
              <p className={styles.valueText}>{t('about.deliveryText')}</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
