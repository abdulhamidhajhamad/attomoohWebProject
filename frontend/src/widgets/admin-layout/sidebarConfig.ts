import {
  LayoutDashboard,
  MapPin,
  Cog,
  Users,
  Truck,
  Boxes,
  Hammer,
  Car,
  Download,
  Upload,
  Search,
  Wrench,
  MonitorCog,
  Factory,
  Phone,
  CalendarClock,
  Receipt,
  ShoppingCart,
  Package,
  Grid3X3,
  BarChart3,
  Image,
  Settings,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

export interface SidebarItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  end?: boolean;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

/* ═══════════════════════════════════
   Main Sidebar — shown on /admin and general pages
   ═══════════════════════════════════ */
export const mainSidebarGroups: SidebarGroup[] = [
  {
    label: '',
    defaultOpen: true,
    items: [
      { path: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'الأقسام',
    defaultOpen: true,
    items: [
      { path: '/admin/maintenance', label: 'الصيانة', icon: Wrench },
      { path: '/admin/hr', label: 'الموارد البشرية', icon: Users },
    ],
  },
  {
    label: 'الملفات',
    defaultOpen: true,
    items: [
      { path: '/admin/areas', label: 'المناطق', icon: MapPin },
      { path: '/admin/machines', label: 'الآلات', icon: Cog },
      { path: '/admin/customers', label: 'الزبائن', icon: Users },
      { path: '/admin/suppliers', label: 'الموردين', icon: Truck },
      { path: '/admin/inventory', label: 'المخزون', icon: Boxes },
      { path: '/admin/tools', label: 'العدد', icon: Hammer },
      { path: '/admin/vehicles', label: 'المركبات', icon: Car },
    ],
  },
  {
    label: 'أخرى',
    defaultOpen: false,
    items: [
      { path: '/admin/products', label: 'المنتجات', icon: Package },
      { path: '/admin/categories', label: 'التصنيفات', icon: Grid3X3 },
      { path: '/admin/slider', label: 'السلايدر', icon: Image },
      { path: '/admin/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

/* ═══════════════════════════════════
   Maintenance Sidebar — shown on /admin/maintenance/*
   ═══════════════════════════════════ */
export const maintenanceSidebarGroups: SidebarGroup[] = [
  {
    label: '',
    defaultOpen: true,
    items: [
      { path: '/admin', label: 'الرجوع للوحة التحكم', icon: ArrowRight, end: true },
    ],
  },
  {
    label: '',
    defaultOpen: true,
    items: [
      { path: '/admin/maintenance', label: 'لوحة الصيانة', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'المهام',
    defaultOpen: true,
    items: [
      { path: '/admin/maintenance/tasks', label: 'مهام الصيانة', icon: ClipboardList },
      { path: '/admin/maintenance/machine-reception', label: 'استلام آلة', icon: Download },
      { path: '/admin/maintenance/machine-delivery', label: 'تسليم آلة', icon: Upload },
      { path: '/admin/maintenance/machine-inspection', label: 'فحص آلة', icon: Search },
      { path: '/admin/maintenance/machine-maintenance', label: 'صيانة آلة', icon: Wrench },
      { path: '/admin/maintenance/machine-installation', label: 'تنصيب آلة', icon: MonitorCog },
      { path: '/admin/maintenance/machine-production', label: 'إنتاج آلة', icon: Factory },
      { path: '/admin/maintenance/transport', label: 'نقل', icon: Truck },
      { path: '/admin/maintenance/customer-calls', label: 'اتصال هاتفي', icon: Phone },
      { path: '/admin/maintenance/maintenance-schedule', label: 'جدولة صيانة', icon: CalendarClock },
    ],
  },
  {
    label: 'إدارة',
    defaultOpen: true,
    items: [
      { path: '/admin/maintenance/reports', label: 'التقارير', icon: BarChart3 },
      { path: '/admin/maintenance/service-orders', label: 'أوامر الخدمة', icon: ClipboardList },
      { path: '/admin/maintenance/machine-types', label: 'أنواع الآلات', icon: Cog },
      { path: '/admin/maintenance/technicians', label: 'الفنيين', icon: Users },
    ],
  },
  {
    label: 'المحاسبة',
    defaultOpen: false,
    items: [
      { path: '/admin/maintenance/financial-documents', label: 'المستندات المالية', icon: Receipt },
      { path: '/admin/maintenance/purchase-orders', label: 'طلبات المشتريات', icon: ShoppingCart },
    ],
  },
];

/* ═══════════════════════════════════
   HR Sidebar — shown on /admin/hr/*
   ═══════════════════════════════════ */
export const hrSidebarGroups: SidebarGroup[] = [
  {
    label: '',
    defaultOpen: true,
    items: [
      { path: '/admin', label: 'الرجوع للوحة التحكم', icon: ArrowRight, end: true },
    ],
  },
  {
    label: '',
    defaultOpen: true,
    items: [
      { path: '/admin/hr', label: 'لوحة الموارد البشرية', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: '',
    defaultOpen: true,
    items: [
      { path: '/admin/hr/employees', label: 'إدارة الموظفين', icon: Users },
    ],
  },
];
