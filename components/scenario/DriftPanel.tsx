'use client';

import { useScenario } from './ScenarioProvider';
import { usePrivacy } from '@/components/PrivacyProvider';
import { fmtUSD } from '@/lib/format';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DriftChip({ deltaUsd, deltaPct }: { deltaUsd: number; deltaPct: number }) {
  const abs = Math.abs(deltaUsd);
  const absPct = Math.abs(deltaPct);
  const { s } = usePrivacy();

  if (abs < 500) {
    return (
      <span style={{ color: 'var(--positive)', fontWeight: 700, fontSize: 13 }}>
        ✓ On track
      </span>
    );
  }

  const color = deltaUsd >= 0 ? 'var(--positive)' : 'var(--negative)';
  const icon  = deltaUsd >= 0 ? '↑' : '↓';
  const label = deltaUsd >= 0 ? 'ahead' : 'behind';

  return (
    <span style={{ color, fontWeight: 700, fontSize: 13 }}>
      {icon} {s(fmtUSD(abs))} {label} ({absPct.toFixed(1)}%)
    </span>
  );
}

export default function DriftPanel() {
  const { checkins, latestDrift } = useScenario();
  const { s } = usePrivacy();

  if (checkins.length === 0) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 12,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        fontSize: 'var(--fs-sm)', color: 'var(--text-3)',
      }}>
        No check-ins yet. Open Holdings → Update actuals to record your first snapshot.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Current drift banner */}
      {latestDrift && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: latestDrift.deltaUsd >= 0 ? 'rgba(111,185,140,0.1)' : 'rgba(220,60,60,0.08)',
          border: `1px solid ${latestDrift.deltaUsd >= 0 ? 'rgba(111,185,140,0.3)' : 'rgba(220,60,60,0.25)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              vs plan · {fmtDate(checkins[0].checkedAt)}
            </span>
            <DriftChip deltaUsd={latestDrift.deltaUsd} deltaPct={latestDrift.deltaPct} />
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>projected</span>
            <span className="scenario-mono" style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {s(fmtUSD(latestDrift.projectedNwUsd))}
            </span>
          </div>
        </div>
      )}

      {/* Check-in history table */}
      <div className="flex flex-col gap-1">
        {checkins.map((c, i) => {
          const isAhead = c.deltaUsd >= 0;
          const color = Math.abs(c.deltaUsd) < 500 ? 'var(--text-3)' : isAhead ? 'var(--positive)' : 'var(--negative)';
          return (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 8,
                background: i === 0 ? 'var(--surface-2)' : 'transparent',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtDate(c.checkedAt)}</span>
                {c.notes && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>{c.notes}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="scenario-mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  {s(fmtUSD(c.actualNwUsd))}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 80, textAlign: 'right' }}>
                  {Math.abs(c.deltaUsd) < 500 ? '— on track' : `${isAhead ? '+' : '−'}${s(fmtUSD(Math.abs(c.deltaUsd)))}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
