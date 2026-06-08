'use client';

import { fmtMonth } from '@/lib/format';

interface Props {
  firstBreakMonth: string;
  totalBreaks: number;
}

export default function SolvencyBreakHeadline({ firstBreakMonth, totalBreaks }: Props) {
  return (
    <div style={{
      background: 'rgba(220,60,60,0.08)', border: '1px solid rgba(220,60,60,0.3)',
      borderRadius: 12, padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>⚠</span>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
          color: 'var(--negative)',
        }}>
          Plan breaks in {fmtMonth(firstBreakMonth)}
        </span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
        This scenario goes cash-negative {totalBreaks === 1 ? 'once' : `${totalBreaks} times`}.
        No freedom date is reachable in this configuration.
        Delay the most expensive event or adjust your assumptions to restore solvency.
      </p>
    </div>
  );
}
