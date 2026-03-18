import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { BranchSelectorModal } from './BranchSelectorModal';

/* ═══════════════════════════════════
   Context Contract (ISP)
   ═══════════════════════════════════ */

interface BranchSelectorContextValue {
  /** Open the branch selector modal. After user picks a branch, WhatsApp opens with the message. */
  requestWhatsApp: (message: string) => void;
}

const BranchSelectorContext = createContext<BranchSelectorContextValue | null>(null);

/* ═══════════════════════════════════
   Provider
   ═══════════════════════════════════ */

interface BranchSelectorProviderProps {
  children: ReactNode;
}

/**
 * BranchSelectorProvider — wraps the app and provides `requestWhatsApp`.
 * 
 * Pattern: **Mediator** — centralises the branch-selection workflow
 * so that no page/widget needs to know about branches or modal logic.
 * 
 * SOLID:
 *  - SRP: Provider only manages open/close + pending message state.
 *  - OCP: Adding new branches = edit `branches.ts`, nothing else changes.
 *  - DIP: Consumers depend on the abstract `requestWhatsApp`, not concrete implementation.
 */
export function BranchSelectorProvider({ children }: BranchSelectorProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  const requestWhatsApp = useCallback((message: string) => {
    setPendingMessage(message);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPendingMessage('');
  }, []);

  return (
    <BranchSelectorContext.Provider value={{ requestWhatsApp }}>
      {children}
      <BranchSelectorModal
        isOpen={isOpen}
        message={pendingMessage}
        onClose={handleClose}
      />
    </BranchSelectorContext.Provider>
  );
}

/* ═══════════════════════════════════
   Hook
   ═══════════════════════════════════ */

/**
 * useBranchSelector — gives any component access to `requestWhatsApp`.
 * Replaces the old `openWhatsApp(message)` pattern.
 */
export function useBranchSelector(): BranchSelectorContextValue {
  const ctx = useContext(BranchSelectorContext);
  if (!ctx) {
    throw new Error('useBranchSelector must be used within <BranchSelectorProvider>');
  }
  return ctx;
}
