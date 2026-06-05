'use client';

import { useScenario } from './ScenarioProvider';

interface Props { open: boolean; onClose: () => void; }

export default function AssumptionsDrawer({ open, onClose }: Props) {
  const { assumptions, updateAssumptions, result } = useScenario();
  if (!open) return null;

  const target = (assumptions.retirementMonthlySpendEGP * 12 / assumptions.egpUsdToday) / assumptions.swr;

  const sliders: {
    key: keyof typeof assumptions;
    label: string;
    min: number; max: number; step: number;
    format: (v: number) => string;
    tag: 'assumed';
  }[] = [
    {
      key: 'retirementMonthlySpendEGP', label: 'Retirement spend',
      min: 40_000, max: 200_000, step: 5_000,
      format: v => `EGP ${v.toLocaleString()}/mo`,
      tag: 'assumed',
    },
    {
      key: 'surplusReturnRate', label: 'Surplus return',
      min: 0.04, max: 0.18, step: 0.01,
      format: v => `${(v * 100).toFixed(0)}%/yr`,
      tag: 'assumed',
    },
    {
      key: 'swr', label: 'Safe withdrawal rate',
      min: 0.03, max: 0.06, step: 0.005,
      format: v => `${(v * 100).toFixed(1)}%`,
      tag: 'assumed',
    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480, background: 'var(--surface)',
        borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: 24,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div className="flex items-center justify-between">
          <span className="scenario-h2">Assumptions</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Dominant lever — pinned at top with live target readout */}
        <div style={{ padding: '16px', background: 'rgba(235,181,77,0.08)', borderRadius: 12, border: '1px solid rgba(235,181,77,0.2)' }}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--text)' }}>Retirement spend</span>
            <span style={{ fontSize: 12, padding: '1px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(235,181,77,0.12)', color: 'var(--brand-dim)' }}>assumed</span>
          </div>
          <div className="scenario-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)', marginBottom: 4 }}>
            EGP {assumptions.retirementMonthlySpendEGP.toLocaleString()}/mo
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginBottom: 12 }}>
            → target ${Math.round(target).toLocaleString()} · free {result.freedomDate ?? '—'}
          </div>
          <input
            type="range"
            min={40_000} max={200_000} step={5_000}
            value={assumptions.retirementMonthlySpendEGP}
            onChange={e => updateAssumptions({ retirementMonthlySpendEGP: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--brand)' }}
          />
          <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            <span>EGP 40k</span><span>EGP 200k</span>
          </div>
        </div>

        {/* Other sliders */}
        {sliders.slice(1).map(s => (
          <div key={s.key} className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--text-2)' }}>{s.label}</span>
              <span className="scenario-mono" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
                {s.format(assumptions[s.key] as number)}
              </span>
            </div>
            <input
              type="range"
              min={s.min} max={s.max} step={s.step}
              value={assumptions[s.key] as number}
              onChange={e => updateAssumptions({ [s.key]: Number(e.target.value) } as Partial<typeof assumptions>)}
              style={{ width: '100%', accentColor: 'var(--brand)' }}
            />
          </div>
        ))}

        {/* Birth date */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--text-2)' }}>Birth date</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>shifts all age labels</span>
          </div>
          <input
            type="date"
            value={assumptions.birthDate}
            onChange={e => updateAssumptions({ birthDate: e.target.value })}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '6px 10px', color: 'var(--text)', fontFamily: 'var(--font-body)',
              fontSize: 'var(--fs-sm)', width: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
