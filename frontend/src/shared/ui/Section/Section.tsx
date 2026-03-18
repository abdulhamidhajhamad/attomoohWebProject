import { memo, type ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
}

export const Section = memo(function Section({
  children,
  title,
  subtitle,
  className = '',
  id,
}: SectionProps) {
  return (
    <section className={`${styles.section} ${className}`} id={id}>
      <div className="container">
        {(title || subtitle) && (
          <header className={styles.sectionHeader}>
            {title && <h2 className={styles.sectionTitle}>{title}</h2>}
            {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
});
