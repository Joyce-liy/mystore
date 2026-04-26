import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, UserCircle, Globe } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import '../../styles/layout.css';

const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const currentLang = i18n.language ? i18n.language.split('-')[0].toLowerCase() : 'fr';

  const menuItems = [
    { label: t('dashboard'), path: "/" },
    { label: t('sales'), path: "/sales" },
    { label: t('inventory'), path: "/inventory" },
    { label: t('customers'), path: "/customers" },
    { label: t('settings'), path: "/settings" },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname);
  const title = currentPage ? currentPage.label : t('dashboard');

  const handleLogout = () => {
    if (window.confirm(t('logout_confirm'))) {
      navigate('/login');
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'fr' ? 'en' : 'fr');
  };

  return (
    <header className="header">
      <div className="header-title">{title}</div>

      <div className="header-actions">

        {/* Sélecteur de langue */}
        <div className="lang-wrapper">
          <button
            className="lang-select-btn"
            onClick={toggleLanguage}
            title={currentLang === 'fr' ? "Switch to English" : "Passer en Français"}
          >
            <Globe size={14} className="icon-globe" />
            <span className="lang-text">{currentLang.toUpperCase()}</span>
          </button>
        </div>

        {/* Thème */}
        <button
          onClick={toggleTheme}
          className="action-btn theme-btn"
          title={isDark ? t('light_mode') : t('dark_mode')}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="notification-wrapper action-btn">
          <Bell size={16} />
          <span className="notification-badge">3</span>
        </div>

        {/* Profil */}
        <div
          className="user-profile-trigger"
          onClick={handleLogout}
          title={t('logout')}
        >
          <UserCircle size={28} strokeWidth={1.5} />
        </div>

      </div>
    </header>
  );
};

export default Header;