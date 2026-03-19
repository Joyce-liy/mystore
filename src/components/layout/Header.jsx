import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, UserCircle, HelpCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/layout.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { label: "Tableau de bord", path: "/" },
    { label: "Ventes", path: "/sales" },
    { label: "Inventaire", path: "/inventory" },
    { label: "Clients", path: "/customers" },
    { label: "Paramètres", path: "/settings" },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname);
  const title = currentPage ? currentPage.label : "Tableau de bord";

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-title">{title}</div>

      <div className="header-actions">
        {/* Bouton de changement de thème */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={isDark ? "Mode clair" : "Mode sombre"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Bouton d'aide */}
        {/*<button><HelpCircle size={20} /></button>*/}

        <div className="notification-icon">
          <Bell size={20} />
          <span className="badge">3</span>
        </div>

        <div
          className="user-profile"
          onClick={handleLogout}
          style={{ cursor: 'pointer' }}
          title="Se déconnecter"
        >
          <UserCircle size={32} />
        </div>
      </div>
    </header>
  );
};

export default Header;