/**
 * Shared UI components barrel export.
 * These components follow SOLID principles:
 * - SRP: Each component has a single responsibility
 * - OCP: Extensible via props, no need to modify internals
 * - LSP: All follow consistent patterns and contracts
 * - ISP: Minimal, focused interfaces
 * - DIP: Components depend on abstractions (props), not concrete implementations
 */

export { ToggleSwitch } from './ToggleSwitch';
export { FormCard } from './FormCard';
export { ResultMessage } from './ResultMessage';
export { PageHeader } from './PageHeader';
export { SubmitButton } from './SubmitButton';
