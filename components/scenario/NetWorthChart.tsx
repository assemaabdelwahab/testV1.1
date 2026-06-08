'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useScenario } from './ScenarioProvider';
import { usePrivacy } from '@/components/PrivacyProvider';
import { ageAt } from '@/lib/age';
import { fmtUSD, fmtMonth } from '@/lib/format';
import type { MonthPoint } from '@/lib/engine/types';

const SAMPLE_EVERY = 3;

export default function NetWorthChart({ secondaryPath }: { secondaryPath?: MonthPoint[] }) {
  const { result, assumptions } = useScenario();
  const { s } = usePrivacy();
  const { netWorthPath, freedomDate, freedomDateM1 } = result;
  const { birthDate } = assumptions;
  const [mode, setMode] = useState<'total' | 'composition'>('total');

  const mathTarget = netWorthPath[0]?.retirementTargetUSD ?? 0;
  const yMax = Math.max(mathTarget * 3, 2_000_000);

  const data = netWorthPath
    .filter((_, i) => i % SAMPLE_EVERY === 0)
    .map(pt => ({
      month: pt.month,
      age: ageAt(pt.month, birthDate),
      nw: Math.min(Math.round(pt.netWorthUSD), yMax),
      target: Math.round(pt.retirementTargetUSD),
      cash: Math.min(Math.round(pt.cashUSD), yMax),
      egx:  Math.min(Math.round(pt.egxUSD),  yMax),
      gold: Math.min(Math.round(pt.goldUSD),  yMax),
      house:Math.min(Math.round(pt.houseUSD), yMax),
      debt: Math.round(pt.debtUSD),
    }));

  const secondaryData = secondaryPath
    ? secondaryPath
        .filter((_, i) => i % SAMPLE_EVERY === 0)
        .map(pt => ({
          month: pt.month,
          age: ageAt(pt.month, birthDate),
          nw2: Math.min(Math.round(pt.netWorthUSD), yMax),
        }))
    : null;

  const mergedData = data.map((pt, i) => ({
    ...pt,
    nw2: secondaryData?.[i]?.nw2,
  }));

  const btnStyle = (active: boolean) => ({
    padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
    fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
    background: active ? 'rgba(235,181,77,0.15)' : 'var(--surface-2)',
    border: `1px solid ${active ? 'rgba(235,181,77,0.4)' : 'var(--border)'}`,
    color: active ? 'var(--brand)' : 'var(--text-3)',
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="scenario-label">net worth trajectory</span>
        <div className="flex gap-1">
          <button style={btnStyle(mode === 'total')}       onClick={() => setMode('total')}>Total</button>
          <button style={btnStyle(mode === 'composition')} onClick={() => setMode('composition')}>Composition</button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {mode === 'total' ? (
          <AreaChart data={mergedData} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--brand)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--brand)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="age" tickFormatter={v => `${v}`} tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={Math.floor(data.length / 6)} />
            <YAxis domain={[0, yMax]} tickFormatter={v => fmtUSD(v)} tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }}
              labelFormatter={age => `Age ${age}`}
              formatter={(v: number | undefined, name: string | undefined) => [s(fmtUSD(v ?? 0)), (name ?? '') === 'nw' ? 'Net worth' : 'Target'] as [string, string]}
            />
            <ReferenceLine y={mathTarget} stroke="var(--positive)" strokeDasharray="4 3" strokeOpacity={0.7}
              label={{ value: `target · ${s(fmtUSD(mathTarget))}`, position: 'insideTopRight', fill: 'var(--positive)', fontSize: 11, dy: -4 }} />
            <ReferenceLine y={1_000_000} stroke="var(--brand)" strokeDasharray="4 3" strokeOpacity={0.5}
              label={{ value: `$1M · age ${freedomDateM1 ? ageAt(freedomDateM1, birthDate) : '—'}`, position: 'insideTopRight', fill: 'var(--brand)', fontSize: 11, dy: 12 }} />
            {freedomDate && (
              <ReferenceLine x={ageAt(freedomDate, birthDate)} stroke="var(--positive)" strokeDasharray="4 3" strokeOpacity={0.6}
                label={{ value: `free · age ${ageAt(freedomDate, birthDate)}`, position: 'insideTopLeft', fill: 'var(--positive)', fontSize: 11, dy: -16 }} />
            )}
            <Area type="monotone" dataKey="nw" stroke="var(--brand)" strokeWidth={2} fill="url(#nwGrad)" dot={false} activeDot={{ r: 4, fill: 'var(--brand)' }} />
            {secondaryData && (
              <Area
                type="monotone"
                dataKey="nw2"
                stroke="rgba(235,181,77,0.6)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="none"
                dot={false}
                activeDot={false}
                name="Scenario"
              />
            )}
          </AreaChart>
        ) : (
          <AreaChart data={data} margin={{ top: 24, right: 16, left: 8, bottom: 8 }} stackOffset="none">
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8a8071" stopOpacity={0.5} /><stop offset="95%" stopColor="#8a8071" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="egxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.6} /><stop offset="95%" stopColor="var(--brand)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.55} /><stop offset="95%" stopColor="#d97706" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="houseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.45} /><stop offset="95%" stopColor="#6b7280" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey="age" tickFormatter={v => `${v}`} tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={Math.floor(data.length / 6)} />
            <YAxis tickFormatter={v => fmtUSD(v)} tick={{ fill: 'var(--text-3)', fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12 }}
              labelFormatter={age => `Age ${age}`}
              formatter={(v: number | undefined, name: string | undefined) => {
                const labels: Record<string, string> = { cash: 'Cash + invested', egx: 'EGX stocks', gold: 'Gold', house: '2nd house', debt: 'Debt (−)' };
                return [s(fmtUSD(v ?? 0)), labels[name ?? ''] ?? (name ?? '')] as [string, string];
              }}
            />
            {freedomDate && (
              <ReferenceLine x={ageAt(freedomDate, birthDate)} stroke="var(--positive)" strokeDasharray="4 3" strokeOpacity={0.6}
                label={{ value: `free · age ${ageAt(freedomDate, birthDate)}`, position: 'insideTopLeft', fill: 'var(--positive)', fontSize: 11, dy: -16 }} />
            )}
            <Area type="monotone" dataKey="house" stackId="1" stroke="#6b7280" fill="url(#houseGrad)" dot={false} />
            <Area type="monotone" dataKey="gold"  stackId="1" stroke="#d97706" fill="url(#goldGrad)"  dot={false} />
            <Area type="monotone" dataKey="egx"   stackId="1" stroke="var(--brand)" fill="url(#egxGrad)"  dot={false} />
            <Area type="monotone" dataKey="cash"  stackId="1" stroke="#8a8071" fill="url(#cashGrad)" dot={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Composition legend */}
      {mode === 'composition' && (
        <div className="flex gap-4 flex-wrap">
          {[
            { color: '#6b7280', label: '2nd house' },
            { color: '#d97706', label: 'Gold' },
            { color: 'var(--brand)', label: 'EGX stocks' },
            { color: '#8a8071', label: 'Cash + invested' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
