// src/components/charts/SalesEvolutionChart.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Area, AreaChart
} from 'recharts';

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(13, 25, 48, 0.95)',
      border: '1px solid rgba(59,110,248,0.3)',
      borderRadius: '10px',
      padding: '10px 14px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 700, margin: '2px 0' }}>
          {p.name}: <span style={{ color: '#fff' }}>{(p.value || 0).toLocaleString()} F</span>
        </p>
      ))}
    </div>
  );
};

/* ── Custom Legend ── */
const CustomLegend = ({ payload }) => (
  <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
    {payload?.map((p, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{p.value}</span>
      </div>
    ))}
  </div>
);

const SalesEvolutionChart = ({ data = [] }) => {
  const { t } = useTranslation();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b6ef8" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b6ef8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(255,255,255,0.05)"
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          tickFormatter={v => `${(v/1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />

        <Area
          type="monotone"
          dataKey="revenue"
          name={t('statistics_revenue')}
          stroke="#3b6ef8"
          strokeWidth={2.5}
          fill="url(#gradRevenue)"
          dot={false}
          activeDot={{ r: 5, fill: '#3b6ef8', strokeWidth: 0 }}
          animationDuration={1200}
        />
        <Area
          type="monotone"
          dataKey="profit"
          name={t('statistics_profit')}
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#gradProfit)"
          dot={false}
          activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
          animationDuration={1400}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SalesEvolutionChart;