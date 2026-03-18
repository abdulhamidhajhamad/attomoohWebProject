import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  /** Title of the page */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Path to navigate back to */
  backTo: string;
  /** Text for the back button */
  backLabel: string;
  /** Optional actions on the right side */
  actions?: ReactNode;
}

/**
 * Reusable page header for admin form pages.
 * Provides back navigation, title, subtitle, and optional actions slot.
 * Follows SRP — only handles page header display and back navigation.
 */
export function PageHeader({ title, subtitle, backTo, backLabel, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.pageHeader}>
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => navigate(backTo)}
      >
        <ArrowRight size={18} />
        {backLabel}
      </button>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
