'use client';

import { POSITION } from '@/lib/engine/scenarios';
import { fmtUSD } from '@/lib/format';
import { useScenario } from './ScenarioProvider';

interface Props { open: boolean; onClose: () => void; }

export default function PositionDrawer({ open, onClose }: Props) {
  const { result } = useScenario();

  if (!open) return null;

  const rows = [
    { label: 'EGX stocks', value: 'EGP 460,000', note: '20%/yr growth', tag: 'assumed' },
    { label: 'Gold (46g)', value: '$6,578', note: '8%/yr · 24k assumed', tag: 'assumed' },
    { label: '2nd house', value: 'EGP 1,500,000', note: '12%/yr · net of mortgage', tag: 'assumed' },
    { label: '2nd house mortgage', value: 'EGP 906,000 remaining', note: '27.4%/yr · payoff May 2030', tag: 'assumed' },
    { label: 'Residence mortgage', value: 'EGP 10,333/mo', note: 'Until Apr 2030', tag: 'assumed' },
    { label: 'USD cash', value: `$${POSITION.cashUSD.toLocaleString()}`, note: 'liquid', tag: 'assumed' },
    { label: 'Net worth today', value: fmtUSD(result.netWorthT0), note: 'from simulation', tag: 'measured' },
    { label: 'Monthly surplus', value: fmtUSD(result.surplusT0), note: 'invested at 10%/yr', tag: 'measured' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480, background: 'var(--surface)',
        borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div className="flex items-center justify-between">
          <span className="scenario-h2">Position</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>Read-only in Phase 1. All inputs locked as of 2026-06-03.</p>

        <div className="flex flex-col gap-3">
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.note}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="scenario-mono" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>{r.value}</span>
                <span style={{
                  fontSize: 11, padding: '1px 6px', borderRadius: 'var(--radius-pill)',
                  background: r.tag === 'measured' ? 'rgba(111,185,140,0.15)' : 'rgba(235,181,77,0.12)',
                  color: r.tag === 'measured' ? 'var(--positive)' : 'var(--brand-dim)',
                }}>
                  {r.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
          Editing coming in Phase 2.
        </div>
      </div>
    </div>
  );
}
