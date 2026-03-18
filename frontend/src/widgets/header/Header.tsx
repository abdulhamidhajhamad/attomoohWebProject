import { useState, useCallback, memo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Home,
  Grid3X3,
  Package,
  Users,
  Phone,
} from 'lucide-react';
import { useCartStore } from '../../shared/store/cartStore';
import { useLanguageDirection } from '../../shared/hooks/useLanguageDirection';
import logoSrc from '../../img/logo.jpg'; /* <-- مسار اللوجو: غيّره إذا غيّرت مكان الصورة */
import styles from './Header.module.css';

const navItems = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/categories', labelKey: 'nav.categories', icon: Grid3X3 },
  { path: '/products', labelKey: 'nav.products', icon: Package },
  { path: '/about', labelKey: 'nav.about', icon: Users },
  { path: '/contact', labelKey: 'nav.contact', icon: Phone },
];

export const Header = memo(function Header() {
  const { t } = useTranslation();
  const { toggleLanguage, currentLang } = useLanguageDirection();
  const totalItems = useCartStore((s) => s.totalItems());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setMenuOpen(false);
      }
    },
    [searchQuery, navigate],
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="Attomooh Home">
          <img
            src={logoSrc}
            alt="Attomooh"
            className={styles.logoImg}
          />
        </Link>

        {/* Desktop Search */}
        <form className={styles.searchWrapper} onSubmit={handleSearch}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('nav.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('nav.search')}
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.langBtn}
            onClick={toggleLanguage}
            aria-label="Switch language"
          >
            {currentLang === 'ar' ? 'EN' : 'عربي'}
          </button>

          <Link
            to="/cart"
            className={styles.actionBtn}
            aria-label={`${t('nav.cart')} (${totalItems})`}
          >
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className={styles.cartCount}>{totalItems}</span>
            )}
          </Link>

          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className={styles.mobileMenu} aria-label="Mobile navigation">
          <form
            className={styles.mobileSearchWrapper}
            onSubmit={handleSearch}
          >
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="search"
                className={styles.searchInput}
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t('nav.search')}
              />
            </div>
          </form>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
                }
                onClick={closeMenu}
              >
                <Icon size={20} />
                {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>
      )}
    </header>
  );
});
