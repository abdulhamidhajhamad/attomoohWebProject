import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './SubmitButton.module.css';

interface SubmitButtonProps {
  /** Whether the form is currently submitting */
  loading: boolean;
  /** Text shown while loading */
  loadingText: string;
  /** Icon + text for default state */
  children: ReactNode;
  /** Button is disabled */
  disabled?: boolean;
}

/**
 * Reusable submit button for admin forms.
 * Handles loading spinner state and disabled state.
 */
export function SubmitButton({ loading, loadingText, children, disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={styles.submitBtn}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
          <Loader2 size={18} className={styles.spinner} />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
