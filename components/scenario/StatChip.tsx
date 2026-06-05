interface Props {
  label: string;
  value: string;
  tag?: 'assumed' | 'measured';
  sub?: string;
}

export default function StatChip({ label, value, tag, sub }: Props) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-[12px]" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 'var(--fs-label)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
          {label}
        </span>
        {tag && (
          <span style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 'var(--radius-pill)',
            background: tag === 'measured' ? 'rgba(111,185,140,0.15)' : 'rgba(235,181,77,0.12)',
            color: tag === 'measured' ? 'var(--positive)' : 'var(--brand-dim)',
            fontWeight: 500,
          }}>
            {tag}
          </span>
        )}
      </div>
      <span className="scenario-mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>{sub}</span>}
    </div>
  );
}
