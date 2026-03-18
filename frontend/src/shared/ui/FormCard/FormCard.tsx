import type { ReactNode } from 'react';
import styles from './FormCard.module.css';

interface FormCardProps {
  /** Card title */
  title: string;
  /** Optional subtitle/hint below the title */
  hint?: string;
  /** Optional right-side header action (e.g. badge, button) */
  headerAction?: ReactNode;
  /** Card content */
  children: ReactNode;
}

/**
 * Reusable form card wrapper for admin pages.
 * Provides a consistent card container with optional header.
 * Follows ISP — minimal interface, each prop is optional except children & title.
 */
export function FormCard({ title, hint, headerAction, children }: FormCardProps) {
  const hasHeaderAction = !!headerAction;

  return (
    <div className={styles.card}>
      {hasHeaderAction ? (
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>{title}</h2>
            {hint && <p className={styles.cardHint}>{hint}</p>}
          </div>
          {headerAction}
        </div>
      ) : (
        <>
          <h2 className={styles.cardTitle}>{title}</h2>
          {hint && <p className={styles.cardHint}>{hint}</p>}
        </>
      )}
      {children}
    </div>
  );
}
