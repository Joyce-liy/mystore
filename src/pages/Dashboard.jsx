import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import {
  ShoppingCart, Package, BarChart2, FileDown,
  TrendingUp, TrendingDown, Plus, ArrowRight
} from 'lucide-react';
import '../styles/dashboard.css';

/* ── Circular progress SVG ── */
const CircleProgress = ({ value = 87, label = 'Stock OK', size = 96, stroke = 6 }) => {
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="db-circle-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="#10b981" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="db-circle-text">
        <span className="db-circle-val">{value}%</span>
        <span className="db-circle-sub">{label}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  const [kpis,     setKpis]     = useState({ totalSales: 0, revenue: 0, profit: 0 });
  const [stockOk,  setStockOk]  = useState(87);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');

  /* Salutation traduite */
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
  }, [t]);  // re-run when language changes

  /* KPIs Firestore */
  useEffect(() => {
    const q = query(collection(db, 'sales'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => d.data());
      let rev = 0, prof = 0;
      all.forEach(s => {
        rev  += Number(s.prixVente) || 0;
        prof += Number(s.profit)   || 0;
      });
      setKpis({ totalSales: all.length, revenue: rev, profit: prof });
    });
    return () => unsub();
  }, []);

  const modules = [
    { icon: ShoppingCart, name: t('sales'),             desc: t('module_sales_desc'),     color: '#3b6ef8', path: '/sales'      },
    { icon: Package,      name: t('inventory'),         desc: t('module_inventory_desc'), color: '#10b981', path: '/inventory'  },
    { icon: BarChart2,    name: t('module_charts'),     desc: t('module_charts_desc'),    color: '#f59e0b', path: '/statistics' },
    { icon: FileDown,     name: t('module_exports'),    desc: t('module_exports_desc'),   color: '#ef4444', path: '/sales'      },
  ];

  return (
    <div className="db-root">
      <div className="db-hero">
        <div className="db-hero-blob1" />
        <div className="db-hero-blob2" />

        <div className="db-hero-inner">

          {/* ── Gauche ── */}
          <div className="db-hero-left">
            <p className="db-greeting">
              {greeting}{userName ? `, ${userName}` : ''} 👋
            </p>
            <h1 className="db-hero-title">
              {t('welcome_title')}<br />MyStore
            </h1>
            <p className="db-hero-sub">{t('welcome_sub')}</p>

            <div className="db-hero-actions">
              <button className="db-btn-primary" onClick={() => navigate('/sales')}>
                <Plus size={15} /> {t('new_sale')}
              </button>
              <button className="db-btn-ghost" onClick={() => navigate('/inventory')}>
                {t('see_inventory')} <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* ── Droite : cercle + KPIs ── */}
          <div className="db-hero-right">
            <CircleProgress value={stockOk} label={t('stock_ok')} size={96} stroke={6} />

            <div className="db-mini-kpis">
              <div className="db-mini-kpi">
                <TrendingUp size={14} color="#10b981" />
                <div>
                  <div className="db-mini-val">{kpis.totalSales}</div>
                  <div className="db-mini-lbl">{t('kpi_sales')}</div>
                </div>
              </div>
              <div className="db-mini-kpi">
                <TrendingUp size={14} color="#10b981" />
                <div>
                  <div className="db-mini-val">{kpis.revenue.toLocaleString()} F</div>
                  <div className="db-mini-lbl">{t('kpi_revenue')}</div>
                </div>
              </div>
              <div className="db-mini-kpi">
                <TrendingDown size={14} color="#ef4444" />
                <div>
                  <div className="db-mini-val">{kpis.profit.toLocaleString()} F</div>
                  <div className="db-mini-lbl">{t('kpi_profit')}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Modules ── */}
        <div className="db-modules">
          {modules.map((m, i) => (
            <button key={i} className="db-module" onClick={() => navigate(m.path)}>
              <div className="db-module-dot" style={{ background: m.color }} />
              <div className="db-module-body">
                <div className="db-module-name">{m.name}</div>
                <div className="db-module-desc">{m.desc}</div>
              </div>
              <ArrowRight size={13} className="db-module-arrow" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;