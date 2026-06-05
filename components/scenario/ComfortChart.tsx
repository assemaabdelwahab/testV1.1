'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useScenario } from './ScenarioProvider';
import { ageAt, ageLabel } from '@/lib/age';
import { fmtMonth } from '@/lib/format';

const SAMPLE_EVERY = 3;

export default function ComfortChart() {
  const { result, assumptions } = useScenario();
  const { comfortTimeline } = result;
  const { birthDate } = assumptions;

  const data = comfortTimeline
    .filter((_, i) => i % SAMPLE_EVERY === 0)
    .map(pt => {
      const ds = Math.min(pt.debtServicePct, 100);
      const sav = Math.min(pt.savingsRate, 100 - ds);
      const living = Math.max(0, 100 - ds - sav);
      return {
        month: pt.month,
        age: ageAt(pt.month, birthDate),
        debtService: Math.round(ds * 10) / 10,
        savings: Math.round(sav * 10) / 10,
        living: Math.round(living * 10) / 10,
        raw: pt,
      };
    });

  // Find mortgage payoff month (first month debt-service = 0)
  const payoffPoint = comfortTimeline.find(pt => pt.debtServicePct < 0.5 && comfortTimeline.indexOf(pt) > 0);

  return (
    <div className="flex flex-col gap-4">
      <span className="scenario-label">comfort timeline · income composition</span>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} stackOffset="none">
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
            formatter={(v: number | undefined, name: string | undefined) => {
              const labels: Record<string, string> = { debtService: 'Debt service', savings: 'Savings', living: 'Lifestyle' };
              return [`${v ?? 0}%`, labels[name ?? ''] ?? (name ?? '')] as [string, string];
            }}
          />

          {/* 35% caution threshold */}
          <ReferenceLine y={35} stroke="var(--brand)" strokeDasharray="3 3" strokeOpacity={0.5} />
          {/* 45% danger threshold */}
          <ReferenceLine y={45} stroke="var(--negative)" strokeDasharray="3 3" strokeOpacity={0.5} />

          <Area type="monotone" dataKey="debtService" stackId="1" stroke="var(--brand)" fill="rgba(235,181,77,0.35)" dot={false} />
          <Area type="monotone" dataKey="living"      stackId="1" stroke="var(--text-3)" fill="rgba(138,128,113,0.2)" dot={false} />
          <Area type="monotone" dataKey="savings"     stackId="1" stroke="var(--positive)" fill="rgba(111,185,140,0.3)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { color: 'var(--brand)', label: 'Debt service' },
          { color: 'var(--text-3)', label: 'Lifestyle' },
          { color: 'var(--positive)', label: 'Savings' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div style={{ width: 20, height: 2, background: 'var(--brand)', borderTop: '1px dashed' }} />
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>35% caution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 20, height: 2, background: 'var(--negative)', borderTop: '1px dashed' }} />
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>45% danger</span>
        </div>
      </div>

      {/* Computed narrative */}
      {payoffPoint && (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
          Both mortgages clear around {fmtMonth(payoffPoint.month)} (age {ageAt(payoffPoint.month, birthDate)}).
          Debt service drops to 0 — surplus jumps ~$630/mo.
        </p>
      )}
    </div>
  );
}
