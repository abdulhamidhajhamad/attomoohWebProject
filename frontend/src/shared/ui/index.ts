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
export { TechnicianSelect, EMPTY_TECHNICIAN } from './TechnicianSelect';
export type { TechnicianValue } from './TechnicianSelect';
export { AreaSelect, EMPTY_AREA } from './AreaSelect';
export type { AreaValue } from './AreaSelect';
export { EmployeeSelect, EMPTY_EMPLOYEE } from './EmployeeSelect';
export type { EmployeeValue } from './EmployeeSelect';
export { MachineSelect, EMPTY_MACHINE } from './MachineSelect';
export type { MachineValue } from './MachineSelect';
export { CustomerSelect, EMPTY_CUSTOMER } from './CustomerSelect';
export type { CustomerValue } from './CustomerSelect';
