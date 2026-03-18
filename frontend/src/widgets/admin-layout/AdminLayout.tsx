import { useState, useMemo, memo } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LogOut, Menu, X, ChevronRight, ChevronDown } from 'lucide-react';
import { useAdminStore } from '../../shared/store/adminStore';
import {
  mainSidebarGroups,
  maintenanceSidebarGroups,
  hrSidebarGroups,
} from './sidebarConfig';
import type { SidebarGroup } from './sidebarConfig';
import logoSrc from '../../img/logo.jpg';
import styles from './AdminLayout.module.css';

function SidebarSection({
  group,
  onNavigate,
}: {
  group: SidebarGroup;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? true);
  const isUngrouped = group.label === '';

  return (
    <div className={styles.sidebarSection}>
      {!isUngrouped && (
        <button
          className={styles.sectionHeader}
          onClick={() => setOpen(!open)}
        >
          <span>{group.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
      {(isUngrouped || open) && (
        <div className={styles.sectionItems}>
          {group.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
              }
              onClick={onNavigate}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <ChevronRight size={14} className={styles.linkArrow} />
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function useSidebarGroups(): SidebarGroup[] {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (pathname.startsWith('/admin/maintenance')) return maintenanceSidebarGroups;
    if (pathname.startsWith('/admin/hr')) return hrSidebarGroups;
    return mainSidebarGroups;
  }, [pathname]);
}

export const AdminLayout = memo(function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logout = useAdminStore((s) => s.logout);
  const adminEmail = useAdminStore((s) => s.adminEmail);
  const navigate = useNavigate();
  const groups = useSidebarGroups();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <img src={logoSrc} alt="Attomooh" className={styles.sidebarLogo} />
          <span className={styles.sidebarTitle}>الطموح</span>
          <button
            className={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {groups.map((group, i) => (
            <SidebarSection
              key={group.label || `root-${i}`}
              group={group}
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>
              {adminEmail?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className={styles.adminNameText}>{adminEmail || 'Admin'}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className={styles.topBarRight}>
            <NavLink to="/" className={styles.viewSiteBtn} target="_blank">
              عرض الموقع ←
            </NavLink>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
});
