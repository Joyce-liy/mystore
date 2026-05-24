// src/components/charts/TopArticlesChart.jsx
import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from 'recharts';

const COLORS = ['#3b6ef8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(13,25,48,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700 }}>
        {payload[0]?.value} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>vendus</span>
      </p>
    </div>
  );
};

/* ── Custom Bar Label ── */
const CustomBarLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text
      x={x + width / 2} y={y - 6}
      fill="rgba(255,255,255,0.45)"
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
    >
      {value}
    </text>
  );
};

const TopArticlesChart = ({ data = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(255,255,255,0.05)"
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
          interval={0}
          // Tronquer les noms longs
          tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar
          dataKey="quantite"
          radius={[6, 6, 0, 0]}
          barSize={32}
          label={<CustomBarLabel />}
          onMouseEnter={(_, i) => setActiveIndex(i)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
              style={{ transition: 'opacity 0.2s ease' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopArticlesChart;