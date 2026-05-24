// src/components/charts/ProfitExpensesChart.jsx
import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const colors = { revenue: '#3b6ef8', expenses: '#ef4444', profit: '#10b981' };
  const labels = { revenue: 'Revenu', expenses: 'Dépenses', profit: 'Profit' };
  return (
    <div style={{
      background: 'rgba(10,18,38,0.97)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '12px 16px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      minWidth: 160,
    }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginBottom: 8, letterSpacing: '0.05em' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[p.dataKey] || p.color }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{labels[p.dataKey] || p.dataKey}</span>
          </div>
          <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>
            {(p.value || 0).toLocaleString()} F
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Custom Legend ── */
const CustomLegend = ({ payload }) => {
  const labels = { revenue: 'Revenu', expenses: 'Dépenses', profit: 'Profit' };
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 10 }}>
      {payload?.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 2, background: p.color, borderRadius: 2 }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
            {labels[p.dataKey] || p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ProfitExpensesChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b6ef8" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#3b6ef8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradProf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
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

        <Area type="monotone" dataKey="revenue"  name="revenue"
          stroke="#3b6ef8" strokeWidth={2} fill="url(#gradRev)"
          dot={false} activeDot={{ r: 4, fill: '#3b6ef8', strokeWidth: 0 }}
          animationDuration={1000} />

        <Area type="monotone" dataKey="expenses" name="expenses"
          stroke="#ef4444" strokeWidth={2} fill="url(#gradExp)"
          dot={false} activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
          animationDuration={1200} />

        <Area type="monotone" dataKey="profit"   name="profit"
          stroke="#10b981" strokeWidth={2.5} fill="url(#gradProf)"
          dot={false} activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
          animationDuration={1400} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ProfitExpensesChart;