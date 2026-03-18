import { CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './ResultMessage.module.css';

interface ResultMessageProps {
  /** Whether the operation was successful */
  ok: boolean;
  /** Message to display */
  message: string;
}

/**
 * Reusable result/feedback message for form submissions.
 * Shows success (green) or error (red) state with appropriate icon.
 * Follows OCP — styling is determined by state, easily extensible for warnings etc.
 */
export function ResultMessage({ ok, message }: ResultMessageProps) {
  return (
    <div
      className={`${styles.resultMsg} ${ok ? styles.resultSuccess : styles.resultError}`}
      role="alert"
    >
      {ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}
