import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../features/admin/ProtectedRoute';
import { TechnicianProtectedRoute } from '../features/admin/TechnicianProtectedRoute';

// Public Pages
const HomePage = lazy(() => import('../pages/home/HomePage'));
const CategoriesPage = lazy(() => import('../pages/categories/CategoriesPage'));
const ProductsPage = lazy(() => import('../pages/products/ProductsPage'));
const ProductDetailPage = lazy(() => import('../pages/product-detail/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/cart/CartPage'));
const AboutPage = lazy(() => import('../pages/about/AboutPage'));
const ContactPage = lazy(() => import('../pages/contact/ContactPage'));

// Admin Pages
const AdminLoginPage = lazy(() => import('../pages/admin/login/AdminLoginPage'));
const DashboardPage = lazy(() => import('../pages/admin/dashboard/DashboardPage'));
const AdminProductsPage = lazy(() => import('../pages/admin/products/AdminProductsPage'));
const AddProductPage = lazy(() => import('../pages/admin/products/AddProductPage'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/categories/AdminCategoriesPage'));
const AddCategoryPage = lazy(() => import('../pages/admin/categories/AddCategoryPage'));
const EditCategoryPage = lazy(() => import('../pages/admin/categories/EditCategoryPage'));
const AdminSliderPage = lazy(() => import('../pages/admin/slider/AdminSliderPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/settings/AdminSettingsPage'));
const ReportsPage = lazy(() => import('../pages/admin/reports/ReportsPage'));

// Maintenance Module Pages
const MaintenanceDashboardPage = lazy(() => import('../pages/admin/maintenance-dashboard/MaintenanceDashboardPage'));
const MaintenancePage = lazy(() => import('../pages/admin/maintenance/MaintenancePage'));
const CreateTaskPage = lazy(() => import('../pages/admin/maintenance/CreateTaskPage'));
const TaskDetailPage = lazy(() => import('../pages/admin/maintenance/TaskDetailPage'));
const TechniciansPage = lazy(() => import('../pages/admin/maintenance/TechniciansPage'));
const ServiceOrdersPage = lazy(() => import('../pages/admin/service-orders/ServiceOrdersPage'));
const ReceiveOrderPage = lazy(() => import('../pages/admin/service-orders/ReceiveOrderPage'));
const ServiceOrderDetailPage = lazy(() => import('../pages/admin/service-orders/ServiceOrderDetailPage'));
const MachineTypesPage = lazy(() => import('../pages/admin/machine-types/MachineTypesPage'));
const MachineReceptionPage = lazy(() => import('../pages/admin/machine-reception/MachineReceptionPage'));
const MachineDeliveryPage = lazy(() => import('../pages/admin/machine-delivery/MachineDeliveryPage'));
const MachineInspectionPage = lazy(() => import('../pages/admin/machine-inspection/MachineInspectionPage'));
const MachineMaintenancePage = lazy(() => import('../pages/admin/machine-maintenance/MachineMaintenancePage'));
const MachineInstallationPage = lazy(() => import('../pages/admin/machine-installation/MachineInstallationPage'));
const MachineProductionPage = lazy(() => import('../pages/admin/machine-production/MachineProductionPage'));
const TransportPage = lazy(() => import('../pages/admin/transport/TransportPage'));
const CustomerCallsPage = lazy(() => import('../pages/admin/customer-calls/CustomerCallsPage'));
const MaintenanceSchedulePage = lazy(() => import('../pages/admin/maintenance-schedule/MaintenanceSchedulePage'));
const FinancialDocumentsPage = lazy(() => import('../pages/admin/financial-documents/FinancialDocumentsPage'));
const PurchaseOrdersPage = lazy(() => import('../pages/admin/purchase-orders/PurchaseOrdersPage'));

// HR Module Pages
const HRDashboardPage = lazy(() => import('../pages/admin/hr-dashboard/HRDashboardPage'));
const EmployeesPage = lazy(() => import('../pages/admin/employees/EmployeesPage'));

// الملفات (Master Data) Pages
const AreasPage = lazy(() => import('../pages/admin/areas/AreasPage'));
const MachinesPage = lazy(() => import('../pages/admin/machines/MachinesPage'));
const CustomersPage = lazy(() => import('../pages/admin/customers/CustomersPage'));
const SuppliersPage = lazy(() => import('../pages/admin/suppliers/SuppliersPage'));
const InventoryPage = lazy(() => import('../pages/admin/inventory/InventoryPage'));
const ToolsPage = lazy(() => import('../pages/admin/tools/ToolsPage'));
const VehiclesPage = lazy(() => import('../pages/admin/vehicles/VehiclesPage'));

// Technician Pages
const TechnicianLoginPage = lazy(() => import('../pages/technician/TechnicianLoginPage'));
const TechnicianDashboard = lazy(() => import('../pages/technician/TechnicianDashboard'));

// Admin Layout (lazy)
const AdminLayout = lazy(() => import('../widgets/admin-layout/AdminLayout').then(m => ({ default: m.AdminLayout })));

/** Public routes — wrapped in the public Layout */
export const publicRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/categories', element: <CategoriesPage /> },
  { path: '/categories/:categorySlug', element: <ProductsPage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/products/:productSlug', element: <ProductDetailPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
];

/** Admin routes — login is open, dashboard is protected */
export const adminRoutes: RouteObject[] = [
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },

      // ── المنتجات والتصنيفات ──
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/add', element: <AddProductPage /> },
      { path: 'products/edit/:productId', element: <AddProductPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'categories/add', element: <AddCategoryPage /> },
      { path: 'categories/:categoryId/edit', element: <EditCategoryPage /> },
      { path: 'slider', element: <AdminSliderPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'reports', element: <Navigate to="/admin/maintenance/reports" replace /> },

      // ── الملفات (Master Data) ──
      { path: 'areas', element: <AreasPage /> },
      { path: 'machines', element: <MachinesPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'tools', element: <ToolsPage /> },
      { path: 'vehicles', element: <VehiclesPage /> },

      // ══════════════════════════════════════════
      //  قسم الصيانة — /admin/maintenance/*
      // ══════════════════════════════════════════
      { path: 'maintenance', element: <MaintenanceDashboardPage /> },
      { path: 'maintenance/tasks', element: <MaintenancePage /> },
      { path: 'maintenance/tasks/create', element: <CreateTaskPage /> },
      { path: 'maintenance/tasks/:id', element: <TaskDetailPage /> },
      { path: 'maintenance/technicians', element: <TechniciansPage /> },
      { path: 'maintenance/service-orders', element: <ServiceOrdersPage /> },
      { path: 'maintenance/service-orders/receive', element: <ReceiveOrderPage /> },
      { path: 'maintenance/service-orders/:id', element: <ServiceOrderDetailPage /> },
      { path: 'maintenance/machine-types', element: <MachineTypesPage /> },
      { path: 'maintenance/reports', element: <ReportsPage /> },
      { path: 'maintenance/machine-reception', element: <MachineReceptionPage /> },
      { path: 'maintenance/machine-delivery', element: <MachineDeliveryPage /> },
      { path: 'maintenance/machine-inspection', element: <MachineInspectionPage /> },
      { path: 'maintenance/machine-maintenance', element: <MachineMaintenancePage /> },
      { path: 'maintenance/machine-installation', element: <MachineInstallationPage /> },
      { path: 'maintenance/machine-production', element: <MachineProductionPage /> },
      { path: 'maintenance/transport', element: <TransportPage /> },
      { path: 'maintenance/customer-calls', element: <CustomerCallsPage /> },
      { path: 'maintenance/maintenance-schedule', element: <MaintenanceSchedulePage /> },
      { path: 'maintenance/financial-documents', element: <FinancialDocumentsPage /> },
      { path: 'maintenance/purchase-orders', element: <PurchaseOrdersPage /> },

      // ══════════════════════════════════════════
      //  قسم الموارد البشرية — /admin/hr/*
      // ══════════════════════════════════════════
      { path: 'hr', element: <HRDashboardPage /> },
      { path: 'hr/employees', element: <EmployeesPage /> },
    ],
  },
];

/** Technician routes */
export const technicianRoutes: RouteObject[] = [
  { path: '/technician/login', element: <TechnicianLoginPage /> },
  {
    path: '/technician',
    element: (
      <TechnicianProtectedRoute>
        <TechnicianDashboard />
      </TechnicianProtectedRoute>
    ),
  },
];

/** All routes combined */
export const routes: RouteObject[] = [
  ...publicRoutes,
  ...adminRoutes,
  ...technicianRoutes,
];
