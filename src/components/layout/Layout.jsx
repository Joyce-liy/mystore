// src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/layout.css';

const Layout = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="app-layout">
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

      {/* C'est cette classe qui va bouger en fonction de isExpanded */}
      <main className="main-content">
        <Header />
        <Outlet /> {/* Tes pages Ventes, Inventaire, etc. */}
      </main>
    </div>
  );
};

export default Layout;