import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle // Import de l'icône Help
} from 'lucide-react';
import '../../styles/layout.css';

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Tableau de bord", path: "/" },
    { icon: <ShoppingCart size={20} />, label: "Ventes", path: "/sales" },
    { icon: <Package size={20} />, label: "Inventaire", path: "/inventory" },
    { icon: <Users size={20} />, label: "Clients", path: "/customers" },
    { icon: <Settings size={20} />, label: "Paramètres", path: "/settings" },
  ];

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        {isExpanded && <span className="logo-text">MYSTORE</span>}
        <button onClick={() => setIsExpanded(!isExpanded)} className="toggle-btn">
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Menu principal */}
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={location.pathname === item.path ? 'nav-link active' : 'nav-link'}
          >
            {item.icon}
            {isExpanded && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Section Bas de page (Footer) */}
      <div className="sidebar-footer">
        <Link 
          to="/help" 
          className={location.pathname === "/help" ? 'nav-link active' : 'nav-link'}
        >
          <HelpCircle size={20} />
          {isExpanded && <span>Aide & Support</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;