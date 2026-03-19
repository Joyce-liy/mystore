// src/router/AppRouter.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout'; // On créera ce wrapper juste après
import Dashboard from '../pages/Dashboard';
import Sales from '../pages/Sales';
import LoginPage from '../pages/LoginPage';
import Inventory from '../pages/Inventory';
import RegisterPage from '../pages/RegisterPage';
import Help from '../pages/Help';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Toutes les pages utilisent le Layout commun */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sales" element={<Sales />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;