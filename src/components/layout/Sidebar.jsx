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
  HelpCircle
} from 'lucide-react';
import '../../styles/layout.css';

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: "Tableau de bord", path: "/" },
    { icon: <ShoppingCart size={18} />, label: "Ventes", path: "/sales" },
    { icon: <Package size={18} />, label: "Inventaire", path: "/inventory" },
   // { icon: <Users size={18} />, label: "Clients", path: "/customers" },
   // { icon: <Settings size={18} />, label: "Paramètres", path: "/settings" },
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
          title={!isExpanded ? "Aide & Support" : undefined}
        >
          <HelpCircle size={18} />
          {isExpanded && <span>Aide & Support</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;