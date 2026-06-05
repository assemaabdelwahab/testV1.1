'use client';

import { useScenario } from './ScenarioProvider';
import { fmtUSD } from '@/lib/format';

export default function FactCheckRibbon() {
  const { assumptions } = useScenario();

  const items: { label: string; value: string; tag: 'assumed' | 'measured' }[] = [
    {
      label: 'Monthly spend',
      value: `EGP ${(98_185).toLocaleString()}`,
      tag: 'assumed',
    },
    {
      label: 'Retirement spend',
      value: `EGP ${assumptions.retirementMonthlySpendEGP.toLocaleString()}`,
      tag: 'assumed',
    },
    {
      label: 'Salary',
      value: '$5,500/mo',
      tag: 'assumed',
    },
    {
      label: 'Tracker burn',
      value: '—',
      tag: 'measured',
    },
  ];

  return (
    <div
      className="flex flex-wrap gap-3 px-4 py-3 rounded-[12px]"
      style={{ background: 'rgba(235,181,77,0.06)', border: '1px solid rgba(235,181,77,0.15)' }}
    >
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span style={{ fontSize: 'var(--fs-label)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {item.label}
          </span>
          <span
            style={{
              fontSize: 12,
              padding: '1px 6px',
              borderRadius: 'var(--radius-pill)',
              background: item.tag === 'measured' ? 'rgba(111,185,140,0.15)' : 'rgba(235,181,77,0.12)',
              color: item.tag === 'measured' ? 'var(--positive)' : 'var(--brand-dim)',
              fontWeight: 500,
            }}
          >
            {item.tag}
          </span>
          <span style={{ fontSize: 'var(--fs-sm)', color: item.tag === 'measured' ? 'var(--text-3)' : 'var(--text-2)' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
