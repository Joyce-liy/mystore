import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Tooltip custom : montant en F + nombre de ventes concernées pour la part survolée.
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const { name, value, count, color } = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff',
    }}>
      <p style={{ margin: 0, fontWeight: 700, color, marginBottom: 4 }}>{name}</p>
      <p style={{ margin: 0 }}>{value.toLocaleString()} F</p>
      <p style={{ margin: 0, opacity: 0.7 }}>{count} vente{count > 1 ? 's' : ''}</p>
    </div>
  );
};

const CustomLegend = ({ payload }) => {
  if (!payload || !payload.length) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  );
};

// data attendu : [{ name: 'Marge gagnée', value: 12000, count: 5, color: '#10b981' },
//                 { name: 'Marge perdue', value: 4300,  count: 2, color: '#ef4444' }]
//
// ← FIX : les tranches n'étaient pas colorées. Cause probable : une règle
// CSS globale du type `svg { fill: none !important; }` (souvent utilisée
// pour uniformiser des icônes stroke-only comme lucide-react) qui écrase
// l'attribut `fill` posé sur chaque <Cell>. Un simple attribut/style ne
// peut pas gagner contre un `!important` global — il faut une règle CSS
// scopée, elle aussi en `!important`, avec une spécificité suffisante.
// On pousse la couleur de chaque tranche via une variable CSS par élément
// (--slice-fill) et on la réapplique dans un <style> scopé à ce composant.
const MarginVsFloorPieChart = ({ data = [] }) => (
  <div className="mvf-pie-wrap">
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="46%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={4}
          cornerRadius={6}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          labelLine={false}
          style={{ fontSize: 11, fill: 'rgba(255,255,255,0.85)' }}
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              className="mvf-cell"
              fill={entry.color}
              stroke="none"
              style={{ '--slice-fill': entry.color }}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>

    {/* Règle scopée qui force la couleur, même face à un reset SVG global */}
    <style>{`
      .mvf-pie-wrap .mvf-cell {
        fill: var(--slice-fill) !important;
        stroke: none !important;
      }
    `}</style>
  </div>
);

export default MarginVsFloorPieChart;