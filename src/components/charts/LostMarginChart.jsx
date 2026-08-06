import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList
} from 'recharts';

// Tooltip custom : affiche la perte en F + le nombre de ventes concernées
// pour le mois survolé.
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const { perte, count } = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff',
    }}>
      <p style={{ margin: 0, fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ margin: 0, color: '#ef4444' }}>
        Marge perdue : {perte.toLocaleString()} F
      </p>
      <p style={{ margin: 0, opacity: 0.7 }}>
        {count} vente{count > 1 ? 's' : ''} sous le plancher
      </p>
    </div>
  );
};

// data attendu : [{ label: 'Jan 2026', perte: 12000, count: 3 }, ...]
const LostMarginChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={48}
      />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
      <Bar dataKey="perte" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={44}>
        <LabelList
          dataKey="perte"
          position="top"
          formatter={(v) => v > 0 ? `${v.toLocaleString()} F` : ''}
          style={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default LostMarginChart;