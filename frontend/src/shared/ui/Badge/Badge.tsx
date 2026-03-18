import { memo, type ReactNode } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'new' | 'sale' | 'outOfStock' | 'success';
  children: ReactNode;
}

export const Badge = memo(function Badge({
  variant = 'new',
  children,
}: BadgeProps) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
});
