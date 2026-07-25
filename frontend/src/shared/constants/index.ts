export const BRAND = {
  name: 'Attomooh',
  nameAr: 'الطموح',
  tagline: {
    ar: 'تجهيزات المطابخ الصناعية',
    en: 'Kitchen Equipment',
  },
  fullName: {
    ar: 'الطموح لتجهيزات المطابخ',
    en: 'Attomooh Kitchen Equipment',
  },
} as const;

export const COLORS = {
  primary: '#90297d',
  primaryDark: '#6e1f60',
  primaryLight: '#b44da3',
  primaryFaded: 'rgba(144, 41, 125, 0.08)',
  white: '#ffffff',
  black: '#1a1a1a',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const;

export const CONTACT = {
  phone: import.meta.env.VITE_CONTACT_PHONE || '+970599000000',
  whatsapp: import.meta.env.VITE_CONTACT_WHATSAPP || '+970599000000',
  email: import.meta.env.VITE_CONTACT_EMAIL || 'Attomooh.sales1@gmail.com',
  address: {
    ar: 'فلسطين',
    en: 'Palestine',
  },
  workingHours: {
    ar: 'السبت - الخميس: 9 صباحاً - 6 مساءً',
    en: 'Saturday - Thursday: 9 AM - 6 PM',
  },
};

export const WHATSAPP_BASE_URL = 'https://wa.me/';

export const ITEMS_PER_PAGE = 12;
