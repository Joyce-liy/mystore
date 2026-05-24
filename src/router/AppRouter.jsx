import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import Statistics from '../pages/statistics'; // Changé 'statistics' en 'Statistics' (Convention React)
import Sales from '../pages/Sales';
import LoginPage from '../pages/LoginPage';
import Inventory from '../pages/Inventory';
import RegisterPage from '../pages/RegisterPage';
import Help from '../pages/Help';

// Si vous ne voulez pas utiliser Dashboard pour l'instant, 
// assurez-vous qu'il n'est mentionné nulle part dans le code actif.

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/register" element={<RegisterPage />} />
        
     <Route path="/" element={<Layout />}>
          {/* La page qui s'affiche par défaut sur http://localhost:5173/ */}
          <Route index element={<Dashboard />} /> 
          
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="sales" element={<Sales />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;