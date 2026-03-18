/**
 * Branch configuration — Single Source of Truth.
 * Add, remove, or update branches here only.
 */

export interface Branch {
  id: string;
  phone: string;
  name: { ar: string; en: string };
  city: { ar: string; en: string };
}

export const BRANCHES: Branch[] = [
  {
    id: 'nablus',
    phone: import.meta.env.VITE_BRANCH_NABLUS_PHONE || '+972597440022',
    name: { ar: 'فرع نابلس', en: 'Nablus Branch' },
    city: { ar: 'نابلس', en: 'Nablus' },
  },
  {
    id: 'hebron',
    phone: import.meta.env.VITE_BRANCH_HEBRON_PHONE || '+972594311157',
    name: { ar: 'فرع الخليل', en: 'Hebron Branch' },
    city: { ar: 'الخليل', en: 'Hebron' },
  },
];
