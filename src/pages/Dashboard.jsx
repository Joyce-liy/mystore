import React, { useState, useEffect } from 'react';
import BarPlot from '../components/charts/BarPlot';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import '../styles/dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [totalTransport, setTotalTransport] = useState(0);
  const [transportData, setTransportData] = useState([0, 0]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [droneStats, setDroneStats] = useState({ count: 0, savings: 0 });

  useEffect(() => {
    const q = query(collection(db, "sales"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSales = snapshot.docs.map(doc => doc.data());

      let villeTotal = 0;
      let droneTotal = 0;
      let droneCount = 0;

      allSales.forEach(sale => {
        const cost = Number(sale.transport) || 0;
        if (cost <= 450) {
          droneTotal += cost;
          droneCount++;
        } else {
          villeTotal += cost;
        }
      });

      setTotalTransport(villeTotal + droneTotal);
      setTransportData([villeTotal, droneTotal]);
      setDroneStats({ count: droneCount, savings: 75 });

      const dayNames = { mon: 'Lun', tue: 'Mar', wed: 'Mer', thu: 'Jeu', fri: 'Ven', sat: 'Sam', sun: 'Dim' };
      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const groupedSales = {};

      allSales.forEach(sale => {
        if (sale.createdAt) {
          const date = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
          const dayKey = dayKeys[date.getDay()];
          groupedSales[dayKey] = (groupedSales[dayKey] || 0) + (Number(sale.prixVente) || 0);
        }
      });

      const formattedSales = ['mon', 'tue', 'wed', 'thu', 'fri'].map(key => ({
        name: dayNames[key],
        vente: groupedSales[key] || 0
      }));

      setWeeklySales(formattedSales);
    });

    return () => unsubscribe();
  }, []);

  const transportCircleData = {
    labels: ['Transport Ville', 'Transport Drone'],
    datasets: [
      {
        data: transportData,
        backgroundColor: ['#3b6ef8', '#10b981'],
        hoverBackgroundColor: ['#2550d4', '#059669'],
        borderWidth: 0,
        cutout: '72%',
      },
    ],
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: "'DM Sans', sans-serif" },
          color: 'var(--text-muted)',
        }
      }
    }
  };

  return (
    <div className="dashboard-container">

      {/* Performance des Ventes */}
      <div className="card full-width">
        <h2 className="card-title">Performance des Ventes</h2>
        <BarPlot data={weeklySales.length > 0 ? weeklySales : []} />
      </div>

      {/* Répartition Logistique */}
      <div className="card">
        <h2 className="card-title">Répartition Logistique</h2>
        <div style={{ height: '260px', position: 'relative' }}>
          <Doughnut data={transportCircleData} options={doughnutOptions} />
          <div className="chart-center-text">
            <span className="total-label">Total</span>
            <span className="total-value">{totalTransport.toLocaleString()} F</span>
          </div>
        </div>
      </div>

      {/* Statistiques Drones */}
      <div className="card highlight-card">
        <h2 className="card-title">Statistiques Drones</h2>
        <div className="impact-content">
          <div className="impact-main">
            <span className="impact-value">-{droneStats.savings}%</span>
            <p className="impact-label">Économie d'énergie</p>
          </div>
          <div className="impact-details">
            <div className="detail-item">
              <span>Livraisons par drone</span>
              <strong>{droneStats.count}</strong>
            </div>
            <div className="detail-item">
              <span>Coût moyen Ville</span>
              <strong>2 500 F</strong>
            </div>
            <div className="detail-item">
              <span>Coût moyen Drone</span>
              <strong>450 F</strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;