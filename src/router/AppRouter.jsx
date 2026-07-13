import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import Statistics from '../pages/statistics';
import Sales from '../pages/Sales';
import LoginPage from '../pages/LoginPage';
import Inventory from '../pages/Inventory';
import RegisterPage from '../pages/RegisterPage';
import Help from '../pages/Help';
import Packets from '../pages/Packets';
import { PacketProvider } from '../contexts/PacketContext';

const AppRouter = () => {
  return (
    <Router>
      <PacketProvider>
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
            <Route path="packets" element={<Packets />} />
          </Route>
        </Routes>
      </PacketProvider>
    </Router>
  );
};

export default AppRouter;