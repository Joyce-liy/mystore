// src/pages/statistics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, BarChart2, Tag } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

// ── Composants de charts ──
import SalesEvolutionChart  from '../components/charts/SalesEvolutionChart';
import TopArticlesChart     from '../components/charts/TopArticlesChart';
import StockDistributionChart from '../components/charts/StockDistributionChart';
import ProfitExpensesChart  from '../components/charts/ProfitExpensesChart';
import { usePacket } from '../contexts/PacketContext';
import { useCategory } from '../contexts/CategoryContext';
import { useCurrency } from '../contexts/CurrencyContext';

import '../styles/statistics.css';

/* ══════════════════════════════════════
   Couleur stable par catégorie (basée sur le nom)
══════════════════════════════════════ */
const CATEGORY_COLORS = ['#3b6ef8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const colorForCategory = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
};

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
  const { currentPacket } = usePacket();
  const { availableCategories } = useCategory();
  const { formatAmount } = useCurrency();
  const packetId = currentPacket?.id || null;
  const [allSales,   setAllSales]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [packetsMap, setPacketsMap] = useState({});

  // Lookup packetId -> données packet (pour récupérer transportCost sans le
  // dupliquer sur chaque vente)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'packets'), snap => {
      const map = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      setPacketsMap(map);
    });
    return () => unsub();
  }, []);

  // Ventes affichées dans les KPIs/graphiques : toutes les ventes du packet
  // (déjà filtré côté requête), puis si choisi, restreintes à une catégorie
  // (côté client — c'est un filtre d'analyse, pas une restriction de saisie)
  const displaySales = useMemo(() => (
    categoryFilter ? allSales.filter(s => (s.categorie || '') === categoryFilter) : allSales
  ), [allSales, categoryFilter]);

  // Répartition par catégorie : toujours calculée sur l'ensemble du packet,
  // indépendamment du filtre, pour comparer les catégories entre elles
  const statsByCategory = useMemo(() => {
    const map = {};
    allSales.forEach(s => {
      const cat = s.categorie || t('statistics_no_category', 'Sans catégorie');
      if (!map[cat]) map[cat] = { count: 0, revenue: 0, profit: 0 };
      map[cat].count   += 1;
      map[cat].revenue += Number(s.prixVente) || 0;
      map[cat].profit  += (Number(s.prixVente) || 0) - (Number(s.prixAchat) || 0);
    });
    return Object.entries(map)
      .map(([nom, stat]) => ({ nom, ...stat }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [allSales, t]);

  // ── Fetch Firestore ──
  useEffect(() => {
    const q = packetId
      ? query(collection(db, 'sales'), where('packetId', '==', packetId))
      : query(collection(db, 'sales'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (packetId) {
        list.sort((a, b) => {
          const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dbt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return da - dbt;
        });
      }
      setAllSales(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [packetId]);

  // Coût de transport à retenir pour les KPIs : celui du packet actif si un
  // packet est sélectionné, sinon la somme des transportCost de chaque packet
  // réellement représenté dans les ventes affichées (une fois par packet, pas
  // par article)
  const transportTotal = useMemo(() => {
    if (packetId) {
      return Number(packetsMap[packetId]?.transportCost) || 0;
    }
    const uniquePacketIds = new Set(displaySales.map(s => s.packetId).filter(Boolean));
    let total = 0;
    uniquePacketIds.forEach(pid => { total += Number(packetsMap[pid]?.transportCost) || 0; });
    return total;
  }, [packetId, packetsMap, displaySales]);

  // ── KPIs globaux ──
  const kpis = useMemo(() => {
    let revenue = 0, cogs = 0;
    displaySales.forEach(s => {
      revenue += Number(s.prixVente) || 0;
      cogs    += Number(s.prixAchat) || 0;
    });
    const expenses = cogs + transportTotal;
    const profit = revenue - expenses;
    return { revenue, expenses, profit, count: displaySales.length };
  }, [displaySales, transportTotal]);

  // ── 1. Évolution des ventes par mois ──
  const salesEvolutionData = useMemo(() => {
    const months = {};
    const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    displaySales.forEach(s => {
      if (!s.createdAt) return;
      const date = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      const key  = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
      if (!months[key]) months[key] = { label: key, revenue: 0, profit: 0 };
      months[key].revenue += Number(s.prixVente) || 0;
      months[key].profit  += Number(s.profit)    || 0;
    });
    return Object.values(months).slice(-8); // 8 derniers mois
  }, [displaySales]);

  // ── 2. Top articles par quantité vendue ──
  const topArticlesData = useMemo(() => {
    const articles = {};
    displaySales.forEach(s => {
      if (!s.designation) return;
      const key = s.designation;
      articles[key] = (articles[key] || 0) + 1;
    });
    return Object.entries(articles)
      .map(([name, quantite]) => ({ name, quantite }))
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 6);
  }, [displaySales]);

  // ── 3. Distribution du stock ──
  const stockData = useMemo(() => {
    const seen = new Map();
    displaySales.forEach(s => {
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
  }, [displaySales]);

  // ── 4. Profit vs Dépenses par mois ──
  const profitExpensesData = useMemo(() => {
    const months = {};
    const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    displaySales.forEach(s => {
      if (!s.createdAt) return;
      const date  = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      const key   = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
      if (!months[key]) months[key] = { label: key, revenue: 0, expenses: 0, profit: 0 };
      months[key].revenue  += Number(s.prixVente) || 0;
      months[key].expenses += Number(s.prixAchat) || 0;
      months[key].profit   += (Number(s.prixVente) || 0) - (Number(s.prixAchat) || 0);
    });
    return Object.values(months).slice(-8);
  }, [displaySales]);

  if (loading) {
    return (
      <div className="stat-loading">
        <div className="stat-spinner" />
        <p>{t('statistics_loading')}</p>
      </div>
    );
  }

  return (
    <div className="stat-root">

      {/* ── Filtre catégorie (analyse uniquement ; se combine avec le packet déjà sélectionné) ── */}
      {availableCategories.length > 0 && (
        <div className="stat-category-filter">
          <span className="stat-category-filter-label">
            <Tag size={12} /> {t('statistics_filter_category', 'Catégorie')}
          </span>
          <div className="stat-category-chips">
            <button
              className={`stat-category-chip ${categoryFilter === '' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('')}
            >
              {t('statistics_all_categories', 'Toutes')}
            </button>
            {availableCategories.map(c => (
              <button
                key={c.id}
                className={`stat-category-chip ${categoryFilter === c.nom ? 'active' : ''}`}
                onClick={() => setCategoryFilter(c.nom)}
              >
                <span className="dot" style={{ background: colorForCategory(c.nom) }} />
                {c.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Strip ── */}
      <div className="stat-kpi-strip">
        <KpiCard icon={DollarSign}  label={t('statistics_revenue_total')}  value={formatAmount(kpis.revenue)}   color="#3b6ef8" />
        <KpiCard icon={TrendingUp}  label={t('statistics_net_profit')}     value={formatAmount(kpis.profit)}    color="#10b981" />
        <KpiCard icon={TrendingDown} label={t('statistics_expenses')}       value={formatAmount(kpis.expenses)}  color="#ef4444" />
        <KpiCard icon={ShoppingBag} label={t('statistics_total_sales')}     value={kpis.count}                             color="#f59e0b" />
      </div>

      {/* ── Grid principale ── */}
      <div className="stat-grid">

        {/* 1. Évolution des ventes — pleine largeur */}
        <ChartCard
          className="stat-full"
          title={t('statistics_sales_evolution')}
          subtitle={t('statistics_sales_evolution_sub')}
          badge={t('statistics_badge_realtime')}
        >
          {salesEvolutionData.length > 0
            ? <SalesEvolutionChart data={salesEvolutionData} />
            : <EmptyState text={t('statistics_empty_data')} />}
        </ChartCard>

        {/* 2. Profit vs Dépenses — pleine largeur */}
        <ChartCard
          className="stat-full"
          title={t('statistics_profit_vs_expenses')}
          subtitle={t('statistics_profit_vs_expenses_sub')}
          badge={t('statistics_badge_monthly')}
        >
          {profitExpensesData.length > 0
            ? <ProfitExpensesChart data={profitExpensesData} />
            : <EmptyState text={t('statistics_empty_data')} />}
        </ChartCard>

        {/* 3. Top articles — moitié gauche */}
        <ChartCard
          title={t('statistics_top_articles')}
          subtitle={t('statistics_top_articles_sub')}
        >
          {topArticlesData.length > 0
            ? <TopArticlesChart data={topArticlesData} />
            : <EmptyState text={t('statistics_empty_data')} />}
        </ChartCard>

        {/* 4. Distribution stock — moitié droite */}
        <ChartCard
          title={t('statistics_stock_distribution')}
          subtitle={t('statistics_stock_distribution_sub')}
        >
          <StockDistributionChart data={stockData} />
        </ChartCard>

        {/* 5. Répartition par catégorie — pleine largeur */}
        <ChartCard
          className="stat-full"
          title={t('statistics_by_category', 'Répartition par catégorie')}
          subtitle={t('statistics_by_category_sub', 'Ventes, CA et profit par catégorie (hors transport, comptabilisé une fois par packet)')}
        >
          {statsByCategory.length > 0 ? (
            (() => {
              const maxRevenue = Math.max(...statsByCategory.map(r => r.revenue), 1);
              return (
                <div className="stat-category-list">
                  <div className="stat-category-header-row">
                    <span>{t('statistics_col_category', 'Catégorie')}</span>
                    <span>{t('statistics_col_share', 'Répartition')}</span>
                    <span>{t('statistics_col_revenue', 'CA')}</span>
                    <span>{t('statistics_col_profit', 'Profit')}</span>
                  </div>
                  {statsByCategory.map(row => {
                    const color = colorForCategory(row.nom);
                    const widthPct = Math.max(4, Math.round((row.revenue / maxRevenue) * 100));
                    return (
                      <div className="stat-category-row" key={row.nom}>
                        <div className="stat-category-name">
                          <span className="dot" style={{ background: color }} />
                          <span>{row.nom}</span>
                          <span className="count-badge">{row.count}</span>
                        </div>
                        <div className="stat-category-bar-track">
                          <div className="stat-category-bar-fill" style={{ width: `${widthPct}%`, background: color }} />
                        </div>
                        <div className="stat-category-revenue">{formatAmount(row.revenue)}</div>
                        <div className={`stat-category-profit ${row.profit >= 0 ? 'pos' : 'neg'}`}>
                          {formatAmount(row.profit)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            <EmptyState text={t('statistics_empty_data')} />
          )}
        </ChartCard>

      </div>
    </div>
  );
};

/* ── Placeholder quand pas de données ── */
const EmptyState = ({ text }) => (
  <div style={{
    height: 200, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  }}>
    <BarChart2 size={32} color="rgba(255,255,255,0.15)" />
    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>
      {text}
    </p>
  </div>
);

export default Statistics;