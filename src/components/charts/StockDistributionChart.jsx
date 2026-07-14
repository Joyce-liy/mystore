// src/components/charts/StockDistributionChart.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload }) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{
      background: 'rgba(13,25,48,0.95)',
      border: `1px solid ${item.payload.fill}44`,
      borderRadius: '10px',
      padding: '10px 14px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: item.payload.fill, fontSize: '0.82rem', fontWeight: 700 }}>{item.name}</p>
      <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700 }}>
        {item.value} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: '0.75rem' }}>{t('statistics_articles')}</span>
      </p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>
        {item.payload.percent}%
      </p>
    </div>
  );
};

/* ── Custom Legend ── */
const CustomLegend = ({ payload }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
    {payload?.map((p, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.payload.fill, flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{p.value}</span>
        </div>
        <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
          {p.payload.percent}%
        </span>
      </div>
    ))}
  </div>
);

/* ── Center label ── */
const CenterLabel = ({ cx, cy, total, label }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10} fontWeight={600} letterSpacing={1}>
      {label}
    </text>
    <text x={cx} y={cy + 14} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700}>
      {total}
    </text>
  </>
);

const StockDistributionChart = ({ data = [] }) => {
  const { t } = useTranslation();
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  const labels = [
    t('statistics_in_stock'),
    t('statistics_low_stock'),
    t('statistics_out_of_stock')
  ];

  // Ajouter pourcentage à chaque item
  const enriched = data.map((d, index) => ({
    ...d,
    name: labels[index] || d.name,
    percent: total > 0 ? Math.round((d.value / total) * 100) : 0
  }));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: '0 0 200px', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enriched}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
            >
              {enriched.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COLORS[i % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {total > 0 && (
              <CenterLabel cx={100} cy={100} total={total} label={t('statistics_total')} />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Légende custom à droite */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {enriched.map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>{item.name}</span>
              </div>
              <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>
                {item.value} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: '0.7rem' }}>({item.percent}%)</span>
              </span>
            </div>
            {/* Barre de progression */}
            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                width: `${item.percent}%`,
                height: '100%',
                background: COLORS[i],
                borderRadius: 99,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockDistributionChart;