// src/pages/statistics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, ShoppingBag, Package, DollarSign, BarChart2 } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// ── Composants de charts ──
import SalesEvolutionChart  from '../components/charts/SalesEvolutionChart';
import TopArticlesChart     from '../components/charts/TopArticlesChart';
import StockDistributionChart from '../components/charts/StockDistributionChart';
import ProfitExpensesChart  from '../components/charts/ProfitExpensesChart';

import '../styles/statistics.css';

/* ══════════════════════════════════════
   Composant KPI Card
══════════════════════════════════════ */
const KpiCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="stat-kpi-card">
    <div className="stat-kpi-icon" style={{ background: `${color}18`, color }}>
      <Icon size={18} />
    </div>
    <div className="stat-kpi-body">
      <p className="stat-kpi-label">{label}</p>
      <p className="stat-kpi-value">{value}</p>
      {sub && (
        <p className="stat-kpi-sub" style={{ color: trend >= 0 ? '#10b981' : '#ef4444' }}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {sub}
        </p>
      )}
    </div>
  </div>
);

/* ══════════════════════════════════════
   Composant Chart Card
══════════════════════════════════════ */
const ChartCard = ({ title, subtitle, badge, children, className = '' }) => (
  <div className={`stat-chart-card ${className}`}>
    <div className="stat-chart-header">
      <div>
        <h3 className="stat-chart-title">{title}</h3>
        {subtitle && <p className="stat-chart-subtitle">{subtitle}</p>}
      </div>
      {badge && <span className="stat-chart-badge">{badge}</span>}
    </div>
    <div className="stat-chart-body">{children}</div>
  </div>
);

/* ══════════════════════════════════════
   Page Statistiques principale
══════════════════════════════════════ */
const Statistics = () => {
  const { t } = useTranslation();
  const [allSales,   setAllSales]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  // ── Fetch Firestore ──
  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setAllSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // ── KPIs globaux ──
  const kpis = useMemo(() => {
    let revenue = 0, expenses = 0, profit = 0;
    allSales.forEach(s => {
      revenue  += Number(s.prixVente) || 0;
      expenses += (Number(s.prixAchat) || 0) + (Number(s.transport) || 0);
      profit   += Number(s.profit)    || 0;
    });
    return { revenue, expenses, profit, count: allSales.length };
  }, [allSales]);

  // ── 1. Évolution des ventes par mois ──
  const salesEvolutionData = useMemo(() => {
    const months = {};
    const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    allSales.forEach(s => {
      if (!s.createdAt) return;
      const date = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      const key  = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
      if (!months[key]) months[key] = { label: key, revenue: 0, profit: 0 };
      months[key].revenue += Number(s.prixVente) || 0;
      months[key].profit  += Number(s.profit)    || 0;
    });
    return Object.values(months).slice(-8); // 8 derniers mois
  }, [allSales]);

  // ── 2. Top articles par quantité vendue ──
  const topArticlesData = useMemo(() => {
    const articles = {};
    allSales.forEach(s => {
      if (!s.designation) return;
      const key = s.designation;
      articles[key] = (articles[key] || 0) + 1;
    });
    return Object.entries(articles)
      .map(([name, quantite]) => ({ name, quantite }))
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 6);
  }, [allSales]);

  // ── 3. Distribution du stock ──
  const stockData = useMemo(() => {
    const seen = new Map();
    allSales.forEach(s => {
      if (s.designation && !seen.has(s.designation)) {
        seen.set(s.designation, s.stock ?? 0);
      }
    });
    let inStock = 0, lowStock = 0, outStock = 0;
    seen.forEach(stock => {
      if (stock <= 0)  outStock++;
      else if (stock <= 5) lowStock++;
      else inStock++;
    });
    return [
      { name: 'En stock',    value: inStock  },
      { name: 'Stock faible', value: lowStock },
      { name: 'Rupture',     value: outStock  },
    ];
  }, [allSales]);

  // ── 4. Profit vs Dépenses par mois ──
  const profitExpensesData = useMemo(() => {
    const months = {};
    const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    allSales.forEach(s => {
      if (!s.createdAt) return;
      const date  = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      const key   = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
      if (!months[key]) months[key] = { label: key, revenue: 0, expenses: 0, profit: 0 };
      months[key].revenue  += Number(s.prixVente) || 0;
      months[key].expenses += (Number(s.prixAchat) || 0) + (Number(s.transport) || 0);
      months[key].profit   += Number(s.profit)    || 0;
    });
    return Object.values(months).slice(-8);
  }, [allSales]);

  if (loading) {
    return (
      <div className="stat-loading">
        <div className="stat-spinner" />
        <p>Chargement des statistiques…</p>
      </div>
    );
  }

  return (
    <div className="stat-root">

      {/* ── KPI Strip ── */}
      <div className="stat-kpi-strip">
        <KpiCard icon={DollarSign}  label="Revenu total"  value={`${kpis.revenue.toLocaleString()} F`}   color="#3b6ef8" />
        <KpiCard icon={TrendingUp}  label="Profit net"    value={`${kpis.profit.toLocaleString()} F`}    color="#10b981" />
        <KpiCard icon={TrendingDown} label="Dépenses"     value={`${kpis.expenses.toLocaleString()} F`}  color="#ef4444" />
        <KpiCard icon={ShoppingBag} label="Total ventes"  value={kpis.count}                             color="#f59e0b" />
      </div>

      {/* ── Grid principale ── */}
      <div className="stat-grid">

        {/* 1. Évolution des ventes — pleine largeur */}
        <ChartCard
          className="stat-full"
          title="Évolution des Ventes"
          subtitle="Revenu & profit sur les 8 derniers mois"
          badge="Temps réel"
        >
          {salesEvolutionData.length > 0
            ? <SalesEvolutionChart data={salesEvolutionData} />
            : <EmptyState />}
        </ChartCard>

        {/* 2. Profit vs Dépenses — pleine largeur */}
        <ChartCard
          className="stat-full"
          title="Profit vs Dépenses"
          subtitle="Analyse financière mensuelle"
          badge="Mensuel"
        >
          {profitExpensesData.length > 0
            ? <ProfitExpensesChart data={profitExpensesData} />
            : <EmptyState />}
        </ChartCard>

        {/* 3. Top articles — moitié gauche */}
        <ChartCard
          title="Top Articles Vendus"
          subtitle="Par quantité vendue"
        >
          {topArticlesData.length > 0
            ? <TopArticlesChart data={topArticlesData} />
            : <EmptyState />}
        </ChartCard>

        {/* 4. Distribution stock — moitié droite */}
        <ChartCard
          title="Distribution du Stock"
          subtitle="État actuel de l'inventaire"
        >
          <StockDistributionChart data={stockData} />
        </ChartCard>

      </div>
    </div>
  );
};

/* ── Placeholder quand pas de données ── */
const EmptyState = () => (
  <div style={{
    height: 200, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  }}>
    <BarChart2 size={32} color="rgba(255,255,255,0.15)" />
    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>
      Aucune donnée disponible
    </p>
  </div>
);

export default Statistics;