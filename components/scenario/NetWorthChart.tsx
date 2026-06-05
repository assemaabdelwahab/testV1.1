'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Label,
} from 'recharts';
import { useScenario } from './ScenarioProvider';
import { ageAt } from '@/lib/age';
import { fmtUSD, fmtMonth } from '@/lib/format';

const SAMPLE_EVERY = 3; // show every 3rd month in chart for perf

export default function NetWorthChart() {
  const { result, assumptions } = useScenario();
  const { netWorthPath, freedomDate, freedomDateM1, freedomDateM2 } = result;
  const { birthDate } = assumptions;

  const mathTarget = netWorthPath[0]?.retirementTargetUSD ?? 0;

  // Cap Y axis so reference lines near the target are visible.
  // Show up to 3× the retirement target or $2M, whichever is larger.
  const yMax = Math.max(mathTarget * 3, 2_000_000);

  // Sample the path for chart rendering, clamped to yMax so the axis stays readable
  const data = netWorthPath
    .filter((_, i) => i % SAMPLE_EVERY === 0)
    .map(pt => ({
      month: pt.month,
      age: ageAt(pt.month, birthDate),
      nw: Math.min(Math.round(pt.netWorthUSD), yMax),
      target: Math.round(pt.retirementTargetUSD),
    }));

  return (
    <div className="flex flex-col gap-4">
      <span className="scenario-label">net worth trajectory</span>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--brand)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--brand)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            domain={[0, yMax]}
            tickFormatter={v => fmtUSD(v)}
            tick={{ fill: 'var(--text-3)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }}
            labelFormatter={age => `Age ${age}`}
            formatter={(v: number | undefined, name: string | undefined) => [fmtUSD(v ?? 0), (name ?? '') === 'nw' ? 'Net worth' : 'Target'] as [string, string]}
          />

          {/* Computed target (flat line) */}
          <ReferenceLine y={mathTarget} stroke="var(--positive)" strokeDasharray="4 3" strokeOpacity={0.7}>
            <Label value={`target · ${fmtUSD(mathTarget)}`} position="insideTopLeft" fill="var(--positive)" fontSize={11} />
          </ReferenceLine>

          {/* $1M guardrail */}
          <ReferenceLine y={1_000_000} stroke="var(--brand)" strokeDasharray="4 3" strokeOpacity={0.5}>
            <Label value={`$1M · age ${freedomDateM1 ? ageAt(freedomDateM1, birthDate) : '—'}`} position="insideTopLeft" fill="var(--brand)" fontSize={11} />
          </ReferenceLine>

          {/* Freedom vertical line */}
          {freedomDate && (
            <ReferenceLine
              x={ageAt(freedomDate, birthDate)}
              stroke="var(--positive)"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
            >
              <Label value={`free · age ${ageAt(freedomDate, birthDate)}`} position="top" fill="var(--positive)" fontSize={11} />
            </ReferenceLine>
          )}

          <Area
            type="monotone"
            dataKey="nw"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#nwGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--brand)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
