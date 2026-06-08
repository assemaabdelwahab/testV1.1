'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useScenario } from './ScenarioProvider';
import { ageAt } from '@/lib/age';
import { fmtMonth } from '@/lib/format';
import type { ComfortPoint } from '@/lib/engine/types';

const SAMPLE_EVERY = 3;

export default function ComfortChart({ secondaryTimeline }: { secondaryTimeline?: ComfortPoint[] }) {
  const { result, assumptions } = useScenario();
  const { comfortTimeline } = result;
  const { birthDate } = assumptions;

  const data = comfortTimeline
    .filter((_, i) => i % SAMPLE_EVERY === 0)
    .map(pt => {
      const ds   = Math.max(0, Math.min(pt.debtServicePct,   100));
      const liv  = Math.max(0, Math.min(pt.livingExpensesPct, 100 - ds));
      const evt  = Math.max(0, Math.min(pt.eventExpensesPct,  100 - ds - liv));
      const sav  = Math.max(0, 100 - ds - liv - evt);
      return {
        month: pt.month,
        age: ageAt(pt.month, birthDate),
        debt:   Math.round(ds  * 10) / 10,
        living: Math.round(liv * 10) / 10,
        events: Math.round(evt * 10) / 10,
        savings:Math.round(sav * 10) / 10,
        raw: pt,
      };
    });

  const [view, setView] = useState<'baseline' | 'scenario'>('scenario');

  const scenarioData = secondaryTimeline
    ? secondaryTimeline
        .filter((_, i) => i % SAMPLE_EVERY === 0)
        .map(pt => {
          const ds  = Math.max(0, Math.min(pt.debtServicePct,    100));
          const liv = Math.max(0, Math.min(pt.livingExpensesPct, 100 - ds));
          const evt = Math.max(0, Math.min(pt.eventExpensesPct,  100 - ds - liv));
          const sav = Math.max(0, 100 - ds - liv - evt);
          return {
            month: pt.month,
            age: ageAt(pt.month, birthDate),
            debt:   Math.round(ds  * 10) / 10,
            living: Math.round(liv * 10) / 10,
            events: Math.round(evt * 10) / 10,
            savings:Math.round(sav * 10) / 10,
          };
        })
    : null;

  const chartData = secondaryTimeline && view === 'scenario' ? (scenarioData ?? data) : data;

  const payoffPoint = comfortTimeline.find(
    (pt, i) => i > 0 && pt.debtServicePct < 0.5,
  );

  const LAYERS = [
    { key: 'debt',    label: 'Debt service',     color: 'var(--negative)',  fill: 'rgba(220,60,60,0.3)' },
    { key: 'living',  label: 'Living expenses',  color: 'var(--brand)',     fill: 'rgba(235,181,77,0.28)' },
    { key: 'events',  label: 'Event costs',      color: '#6b7280',          fill: 'rgba(107,114,128,0.25)' },
    { key: 'savings', label: 'Savings',          color: 'var(--positive)',  fill: 'rgba(111,185,140,0.3)' },
  ];

  const tooltipLabels = Object.fromEntries(LAYERS.map(l => [l.key, l.label]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="scenario-label">financial comfort</span>
        {secondaryTimeline && (
          <div className="flex gap-1">
            {(['baseline', 'scenario'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                background: view === v ? 'rgba(235,181,77,0.15)' : 'var(--surface-2)',
                border: `1px solid ${view === v ? 'rgba(235,181,77,0.4)' : 'var(--border)'}`,
                color: view === v ? 'var(--brand)' : 'var(--text-3)',
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} stackOffset="none">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="age"
            tickFormatter={v => `${v}`}
            tick={{ fill: 'var(--text-3)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            tickFormatter={v => `${v}%`}
            tick={{ fill: 'var(--text-3)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            width={42}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13 }}
            labelFormatter={age => `Age ${age}`}
            formatter={(v: number | undefined, name: string | undefined) => [`${v ?? 0}%`, tooltipLabels[name ?? ''] ?? (name ?? '')] as [string, string]}
          />
          <ReferenceLine y={35} stroke="var(--brand)"    strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine y={45} stroke="var(--negative)" strokeDasharray="3 3" strokeOpacity={0.4} />

          {LAYERS.map(l => (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stackId="1"
              stroke={l.color}
              fill={l.fill}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {LAYERS.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Narrative */}
      {payoffPoint && (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          Both mortgages clear around {fmtMonth(payoffPoint.month)} (age {ageAt(payoffPoint.month, birthDate)}).
          Debt service drops to 0 — savings rate jumps immediately.
        </p>
      )}
    </div>
  );
}
