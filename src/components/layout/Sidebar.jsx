import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. Importer le hook
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import '../../styles/layout.css';

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation();
  const { t } = useTranslation(); // 2. Initialiser la fonction de traduction

  const menuItems = [
    // 3. Utiliser t('clé') pour les labels
    { icon: <LayoutDashboard size={18} />, label: t('sidebar_dashboard'), path: "/" },
    { icon: <BarChart3 size={18} />, label: t('sidebar_stats'), path: "/statistics" },
    { icon: <ShoppingCart size={18} />, label: t('sidebar_sales'), path: "/sales" },
    { icon: <Package size={18} />, label: t('sidebar_inventory'), path: "/inventory" },
  ];

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        {isExpanded && <span className="logo-text">MYSTORE</span>}
        <button onClick={() => setIsExpanded(!isExpanded)} className="toggle-btn">
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? 'nav-link active' : 'nav-link'}
            title={!isExpanded ? item.label : undefined}
          >
            {item.icon}
            {isExpanded && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link
          to="/help"
          className={location.pathname === "/help" ? 'nav-link active' : 'nav-link'}
          // 4. Traduire aussi le texte d'aide
          title={!isExpanded ? t('sidebar_help') : undefined}
        >
          <HelpCircle size={18} />
          {isExpanded && <span>{t('sidebar_help')}</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;