import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot
} from 'recharts';
import {
  TrendingUp, TrendingDown, Plus, ArrowRight,
  Receipt, Banknote, ShoppingBag, Wallet,
  Footprints, Shirt, Smartphone, Hash
} from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import '../styles/dashboard.css';

const CAT_ICON = { chaussures: Footprints, habit: Shirt, electronique: Smartphone };
const getCatIcon = (nom) => CAT_ICON[(nom || '').toLowerCase()] || ShoppingBag;

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

const relativeTime = (date, t) => {
  if (!date) return '-';
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1)  return t('time_now', "à l'instant");
  if (diffMin < 60) return t('time_min_ago', { count: diffMin, defaultValue: `Il y a ${diffMin} min` });
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return t('time_h_ago', { h, m, defaultValue: `Il y a ${h}h${m ? m : ''}` });
};

/* ── Séries du graphe selon la période ── */
const RANGES = ['today', 'week', 'month', 'year'];

const buildSeries = (range, sales, locale) => {
  const now = new Date();
  const dated = sales
    .map(s => ({ d: toDate(s.createdAt), amount: Number(s.prixVente) || 0 }))
    .filter(x => x.d);

  if (range === 'today') {
    const buckets = {};
    for (let h = 8; h <= 22; h += 2) {
      buckets[h] = { label: `${String(h).padStart(2, '0')}:00`, montant: 0, articles: 0 };
    }
    dated.filter(x => isSameDay(x.d, now)).forEach(x => {
      const h = Math.max(8, Math.min(22, Math.round(x.d.getHours() / 2) * 2));
      buckets[h].montant  += x.amount;
      buckets[h].articles += 1;
    });
    return Object.keys(buckets).sort((a, b) => a - b).map(k => buckets[k]);
  }

  if (range === 'week') {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({ date: d, label: d.toLocaleDateString(locale, { weekday: 'short' }), montant: 0, articles: 0 });
    }
    dated.forEach(x => {
      const b = days.find(day => isSameDay(day.date, x.d));
      if (b) { b.montant += x.amount; b.articles += 1; }
    });
    return days;
  }

  if (range === 'month') {
    const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: dim }, (_, i) => ({ label: String(i + 1), montant: 0, articles: 0 }));
    dated.forEach(x => {
      if (x.d.getFullYear() === now.getFullYear() && x.d.getMonth() === now.getMonth()) {
        const b = days[x.d.getDate() - 1];
        b.montant += x.amount;
        b.articles += 1;
      }
    });
    return days;
  }

  // year
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(now.getFullYear(), i, 1).toLocaleDateString(locale, { month: 'short' }),
    montant: 0,
    articles: 0,
  }));
  dated.forEach(x => {
    if (x.d.getFullYear() === now.getFullYear()) {
      const b = months[x.d.getMonth()];
      b.montant += x.amount;
      b.articles += 1;
    }
  });
  return months;
};

/* ── Bulle "Pic de vente" affichée sur la ligne pointillée ── */
const PeakLabel = ({ viewBox, line1, line2, align }) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  const w = Math.max(line1.length, line2.length) * 6.4 + 28;
  const h = 40;
  const bx = align === 'left' ? x - w + 8 : align === 'right' ? x - 8 : x - w / 2;
  return (
    <g pointerEvents="none">
      <rect x={bx} y={y} width={w} height={h} rx={8} className="db-peak-box" />
      <text x={bx + 12} y={y + 16} className="db-peak-title">{line1}</text>
      <text x={bx + 12} y={y + 32} className="db-peak-sub">{line2}</text>
    </g>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { formatAmount } = useCurrency();
  const locale = (i18n?.language || 'fr').startsWith('en') ? 'en-US' : 'fr-FR';

  const [allSales, setAllSales] = useState([]);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [range, setRange] = useState('today');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12)      setGreeting(t('greeting_morning'));
    else if (h < 18) setGreeting(t('greeting_afternoon'));
    else             setGreeting(t('greeting_evening'));

    if (auth.currentUser) {
      const email = auth.currentUser.email || '';
      setUserName(email.split('@')[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    const q = query(collection(db, 'sales'));
    const unsub = onSnapshot(
      q,
      (snap) => setAllSales(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Firestore sales error:', err.code, err.message)
    );
    return () => unsub();
  }, []);

  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; }, []);

  const todaySales     = useMemo(() => allSales.filter(s => { const d = toDate(s.createdAt); return d && isSameDay(d, today); }), [allSales, today]);
  const yesterdaySales = useMemo(() => allSales.filter(s => { const d = toDate(s.createdAt); return d && isSameDay(d, yesterday); }), [allSales, yesterday]);

  /* ── KPIs globaux (toutes ventes) ── */
  const kpis = useMemo(() => {
    let rev = 0, prof = 0, exp = 0;
    allSales.forEach(s => {
      rev  += Number(s.prixVente) || 0;
      prof += Number(s.profit)   || 0;
      exp  += (Number(s.prixAchat) || 0) + (Number(s.transport) || 0);
    });
    return { totalSales: allSales.length, revenue: rev, expenses: exp, profit: prof };
  }, [allSales]);

  const salesDeltaPct = useMemo(() => {
    if (yesterdaySales.length === 0) return null;
    return Math.round(((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100);
  }, [todaySales, yesterdaySales]);

  /* ── Séries : aujourd'hui (pour le KPI) + période choisie (pour le graphe) ── */
  const todaySeries = useMemo(() => buildSeries('today', allSales, locale), [allSales, locale]);
  const chartData = useMemo(
    () => (range === 'today' ? todaySeries : buildSeries(range, allSales, locale)),
    [range, todaySeries, allSales, locale]
  );

  const peakHour = useMemo(() => {
    if (todaySeries.every(d => d.articles === 0)) return null;
    return todaySeries.reduce((max, d) => d.montant > max.montant ? d : max, todaySeries[0]);
  }, [todaySeries]);

  const peak = useMemo(() => {
    const best = chartData.reduce((m, d) => d.montant > m.montant ? d : m, chartData[0]);
    return best && best.montant > 0 ? best : null;
  }, [chartData]);

  const peakIdx = peak ? chartData.indexOf(peak) : -1;
  const peakRatio = chartData.length > 1 && peakIdx >= 0 ? peakIdx / (chartData.length - 1) : 0.5;
  const peakAlign = peakRatio > 0.66 ? 'left' : peakRatio < 0.34 ? 'right' : 'center';

  const rangeSub = {
    today: t('activity_sub', "Flux horaire des ventes d'aujourd'hui"),
    week:  t('activity_sub_week', 'Ventes des 7 derniers jours'),
    month: t('activity_sub_month', 'Ventes du mois en cours'),
    year:  t('activity_sub_year', "Ventes par mois sur l'année"),
  }[range];

  const rangeLabel = {
    today: t('range_today', "Aujourd'hui"),
    week:  t('range_week', '7 Jours'),
    month: t('range_month', 'Ce Mois'),
    year:  t('range_year', 'Année'),
  };

  /* Étiquette de l'axe X : le pic est mis en évidence en vert */
  const renderTick = ({ x, y, payload }) => {
    const isPeak = peak && payload.value === peak.label;
    return (
      <text x={x} y={y} dy={14} textAnchor="middle" className={isPeak ? 'db-tick peak' : 'db-tick'}>
        {isPeak ? `${payload.value} (${t('peak_short', 'Pic')})` : payload.value}
      </text>
    );
  };

  /* ── Répartition par catégorie (top 3, sur l'ensemble des ventes) ── */
  const categoryStats = useMemo(() => {
    const map = {};
    let total = 0;
    allSales.forEach(s => {
      const cat = s.categorie || null;
      if (!cat) return;
      map[cat] = (map[cat] || 0) + 1;
      total += 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nom, count]) => ({ nom, count, pct: total ? Math.round((count / total) * 100) : 0 }));
  }, [allSales]);

  /* ── Répartition par indice (champ `indice` de chaque vente) ── */
  const indexStats = useMemo(() => {
    const map = {};
    allSales.forEach(s => {
      const idx = (s.indice || '').trim();
      if (!idx) return;
      map[idx] = (map[idx] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([indice, count]) => ({ indice, count }));
  }, [allSales]);

  /* ── Ventes récentes (4 dernières, triées par date réelle) ── */
  const recentSales = useMemo(() => {
    return [...allSales]
      .filter(s => toDate(s.createdAt))
      .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
      .slice(0, 4);
  }, [allSales]);

  return (
    <div className="db-root">
      {/* ══ HERO ══ */}
      <div className="db-hero">
        <div className="db-hero-blob1" />
        <div className="db-hero-blob2" />
        <div className="db-hero-inner">
          <div className="db-hero-left">
            <p className="db-greeting">{greeting}{userName ? `, ${userName}` : ''} 👋</p>
            <h1 className="db-hero-title">{t('welcome_title')} MyStore</h1>
            <p className="db-hero-sub">{t('welcome_sub')}</p>
          </div>

          <div className="db-hero-right">
            <button className="db-btn-primary" onClick={() => navigate('/sales')}>
              <Plus size={15} /> {t('new_sale')}
            </button>
            <button className="db-btn-ghost" onClick={() => navigate('/inventory')}>
              {t('see_inventory')} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="db-kpi-row">
        <div className="db-kpi-card">
          <div className="db-kpi-top">
            <span className="db-kpi-label">{t('kpi_sales_total', 'Ventes totales')}</span>
            <div className="db-kpi-icon blue"><Receipt size={14} /></div>
          </div>
          <div className="db-kpi-val">{kpis.totalSales}</div>
          <div className="db-kpi-sub">
            {salesDeltaPct !== null ? (
              <span className={salesDeltaPct >= 0 ? 'db-kpi-delta up' : 'db-kpi-delta down'}>
                {salesDeltaPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {salesDeltaPct}%
              </span>
            ) : null}
            {t('kpi_sales_sub', { count: yesterdaySales.length, defaultValue: `vs ${yesterdaySales.length} hier` })}
          </div>
          <div className="db-kpi-bar"><div className="db-kpi-bar-fill blue" style={{ width: '65%' }} /></div>
        </div>

        <div className="db-kpi-card">
          <div className="db-kpi-top">
            <span className="db-kpi-label">{t('kpi_revenue', 'Revenu brut')}</span>
            <div className="db-kpi-icon green"><Banknote size={14} /></div>
          </div>
          <div className="db-kpi-val">{formatAmount(kpis.revenue)}</div>
          <div className="db-kpi-sub">
            {peakHour
              ? t('kpi_peak_hour', { hour: peakHour.label, defaultValue: `Pic de trafic à ${peakHour.label}` })
              : t('kpi_no_activity_today', "Pas encore d'activité aujourd'hui")}
          </div>
          <div className="db-kpi-bar"><div className="db-kpi-bar-fill green" style={{ width: '80%' }} /></div>
        </div>

        <div className="db-kpi-card">
          <div className="db-kpi-top">
            <span className="db-kpi-label">{t('kpi_expenses', 'Dépenses opérationnelles')}</span>
            <div className="db-kpi-icon red"><ShoppingBag size={14} /></div>
          </div>
          <div className="db-kpi-val">{formatAmount(kpis.expenses)}</div>
          <div className="db-kpi-sub">{t('kpi_expenses_sub', 'Achat + transport, cumulé')}</div>
          <div className="db-kpi-bar"><div className="db-kpi-bar-fill red" style={{ width: '55%' }} /></div>
        </div>

        <div className="db-kpi-card">
          <div className="db-kpi-top">
            <span className="db-kpi-label">{t('kpi_profit', 'Profit net')}</span>
            <div className="db-kpi-icon purple"><Wallet size={14} /></div>
          </div>
          <div className={`db-kpi-val ${kpis.profit < 0 ? 'negative' : ''}`}>{formatAmount(kpis.profit)}</div>
          <div className="db-kpi-sub">{t('kpi_profit_sub', 'Cumulé, toutes ventes')}</div>
          <div className="db-kpi-bar"><div className={`db-kpi-bar-fill ${kpis.profit < 0 ? 'red' : 'green'}`} style={{ width: '55%' }} /></div>
        </div>
      </div>

      {/* ══ CHART + ACTIVITÉ PAR INDICE ══ */}
      <div className="db-main-row">
        <div className="db-chart-card">
          <div className="db-card-head">
            <div>
              <h3>{t('activity_title', 'Activité et Dynamique des Ventes')}</h3>
              <p>{rangeSub}</p>
            </div>
            <div className="db-range-tabs" role="tablist">
              {RANGES.map(r => (
                <button
                  key={r}
                  role="tab"
                  aria-selected={range === r}
                  className={`db-range-btn ${range === r ? 'active' : ''}`}
                  onClick={() => setRange(r)}
                >
                  {rangeLabel[r]}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="dbAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b6ef8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b6ef8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dbStroke" gradientUnits="userSpaceOnUse" x1="0%" y1="0" x2="100%" y2="0">
                  <stop offset="0%"   stopColor="#6f9bff" />
                  <stop offset="65%"  stopColor="#3b6ef8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={renderTick}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={14}
                padding={{ left: 16, right: 16 }}
              />
              <YAxis hide domain={[0, (max) => Math.max(max * 1.6, 1)]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-main)' }}
                labelStyle={{ color: 'var(--text-heading)', fontWeight: 700 }}
                formatter={(v, name, item) => [
                  `${formatAmount(v)} • ${item?.payload?.articles ?? 0} ${t('articles', 'articles')}`,
                  t('kpi_revenue', 'Revenu'),
                ]}
              />
              <Area
                type="monotone"
                dataKey="montant"
                stroke="url(#dbStroke)"
                strokeWidth={2.5}
                fill="url(#dbAreaFill)"
                dot={false}
              />
              {peak && (
                <ReferenceLine
                  x={peak.label}
                  stroke="#34d399"
                  strokeDasharray="2 3"
                  strokeWidth={1.5}
                  label={
                    <PeakLabel
                      line1={`${peak.label} — ${t('peak_label', 'Pic de vente')}`}
                      line2={`${peak.articles} ${t('articles', 'articles')} • ${formatAmount(peak.montant)}`}
                      align={peakAlign}
                    />
                  }
                />
              )}
              {peak && (
                <ReferenceDot x={peak.label} y={peak.montant} r={5} fill="#34d399" className="db-peak-dot" />
              )}
            </AreaChart>
          </ResponsiveContainer>

          {/* Répartition catégories — données réelles */}
          <div className="db-cat-row">
            {categoryStats.length > 0 ? categoryStats.map((c, i) => {
              const Icon = getCatIcon(c.nom);
              return (
                <div className="db-cat-chip" key={c.nom}>
                  <div className={`db-cat-icon tone-${i % 3}`}><Icon size={15} /></div>
                  <div>
                    <span className="db-cat-name">{c.nom}</span>
                    <span className="db-cat-val">{c.count} {t('sold', 'vendus')} • {c.pct}%</span>
                  </div>
                </div>
              );
            }) : (
              <p className="db-empty-inline">{t('no_category_data', 'Pas encore de catégories vendues')}</p>
            )}
          </div>
        </div>

        <div className="db-right-col">
          {/* ── Activité par indice ── */}
          <div className="db-index-card">
            <div className="db-card-head">
              <h3>{t('index_activity', 'Activité par Indice')}</h3>
              <span className="db-live-dot-label">{t('live', 'En direct')}</span>
            </div>
            {indexStats.length === 0 ? (
              <p className="db-empty-inline">{t('no_index_data', "Pas encore d'articles indexés")}</p>
            ) : (
              <div className="db-index-list">
                {indexStats.map(i => (
                  <div className="db-index-row" key={i.indice}>
                    <span className="db-index-dot" />
                    <div className="db-index-body">
                      <span className="db-index-name"><Hash size={12} /> {i.indice}</span>
                      <span className="db-index-sub">{t('indice_label', 'Indice')}</span>
                    </div>
                    <div className="db-index-count">
                      {i.count}
                      <span>{t('articles', 'articles')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ VENTES RÉCENTES ══ */}
      <div className="db-bottom-row">
        <div className="db-recent-card full">
          <div className="db-card-head">
            <div>
              <h3>{t('recent_sales', 'Ventes Récentes')}</h3>
              <p>{t('recent_sales_sub', 'Dernières transactions validées')}</p>
            </div>
            <button className="db-link-btn" onClick={() => navigate('/sales')}>
              {t('see_all_history', "Voir tout l'historique")} <ArrowRight size={13} />
            </button>
          </div>
          {recentSales.length === 0 ? (
            <p className="db-empty-inline">{t('no_sales_yet', 'Aucune vente enregistrée')}</p>
          ) : (
            <table className="db-recent-table">
              <thead>
                <tr>
                  <th>{t('sales_col_item')}</th>
                  <th>{t('recent_col_time', 'Heure')}</th>
                  <th>{t('recent_col_amount', 'Montant')}</th>
                  <th>{t('recent_col_status', 'Statut')}</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="db-recent-item">{s.designation || t('sales_no_name')}</div>
                      {s.categorie && <div className="db-recent-cat">{s.categorie}</div>}
                    </td>
                    <td>{relativeTime(toDate(s.createdAt), t)}</td>
                    <td>{formatAmount(s.prixVente || 0)}</td>
                    <td>
                      <span className={`db-status-badge ${s.status === 'termine' ? 'ok' : 'pending'}`}>
                        {s.status === 'termine' ? t('saved_sales_status_sold') : t('saved_sales_status_pending')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;