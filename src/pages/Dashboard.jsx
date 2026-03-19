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
  const [transportData, setTransportData] = useState([0, 0]); // [Ville, Drone]
  const [weeklySales, setWeeklySales] = useState([]);
  const [droneStats, setDroneStats] = useState({ count: 0, savings: 0 });

  useEffect(() => {
    // 1. Écouter les ventes dans Firestore
    const q = query(collection(db, "sales"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSales = snapshot.docs.map(doc => doc.data());

      // --- CALCULS DES COÛTS DE TRANSPORT ---
      // Note : On suppose ici que tu as un champ 'typeTransport' (Ville/Drone) 
      // Si tu n'as que le montant, on peut simuler une répartition
      let villeTotal = 0;
      let droneTotal = 0;
      let droneCount = 0;

      allSales.forEach(sale => {
        const cost = Number(sale.transport) || 0;
        // Logique : Si le coût est bas (ex: < 500), on considère que c'est un Drone
        if (cost <= 450) { 
          droneTotal += cost;
          droneCount++;
        } else {
          villeTotal += cost;
        }
      });

      setTotalTransport(villeTotal + droneTotal);
      setTransportData([villeTotal, droneTotal]);
      setDroneStats({ count: droneCount, savings: 75 }); // Exemple fixe pour l'impact

      // --- CALCULS POUR LE GRAPH DE PERFORMANCE (BarPlot) ---
      // On groupe les ventes par jour (Lun, Mar, etc.)
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const groupedSales = {};

      allSales.forEach(sale => {
        if (sale.createdAt) {
          const date = sale.createdAt.toDate();
          const dayName = days[date.getDay()];
          groupedSales[dayName] = (groupedSales[dayName] || 0) + Number(sale.prixVente);
        }
      });

      const formattedSales = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(day => ({
        name: day,
        vente: groupedSales[day] || 0
      }));

      setWeeklySales(formattedSales);
    });

    return () => unsubscribe();
  }, []);

  // Configuration dynamique du Doughnut
  const transportCircleData = {
    labels: ['Livraison Ville (Moto)', 'Livraison Drone'],
    datasets: [
      {
        data: transportData,
        backgroundColor: ['#3b82f6', '#10b981'],
        hoverBackgroundColor: ['#2563eb', '#059669'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  return (
    <div className="dashboard-container">
      {/* 1. Ventes Dynamiques */}
      <div className="card full-width shadow-sm">
        <h2 className="card-title">Performance des Ventes (Réel)</h2>
        <BarPlot data={weeklySales.length > 0 ? weeklySales : []} />
      </div>

      {/* 2. Le Cercle de Transport Dynamique */}
      <div className="card shadow-sm">
        <h2 className="card-title">Répartition des Coûts Logistiques</h2>
        <div style={{ height: '280px', position: 'relative' }}>
          <Doughnut 
            data={transportCircleData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: { 
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } 
              }
            }} 
          />
          <div className="chart-center-text">
            <span className="total-label">Total F</span>
            <span className="total-value" style={{ fontSize: '18px' }}>
              {totalTransport.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Carte Impact Drone */}
      <div className="card highlight-card shadow-sm">
        <h2 className="card-title" style={{ color: 'white' }}>Statistiques Drone</h2>
        <div className="impact-content">
          <div className="impact-main">
            <span className="impact-value">-{droneStats.savings}%</span>
            <p className="impact-label">Économie d'énergie</p>
          </div>
          <div className="impact-details">
            <div className="detail-item">
              <span>Livraisons Drone :</span>
              <strong>{droneStats.count}</strong>
            </div>
            <div className="detail-item">
              <span>Coût Moyen Ville :</span>
              <strong>2,500 F</strong>
            </div>
            <div className="detail-item">
              <span>Coût Moyen Drone :</span>
              <strong>450 F</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;