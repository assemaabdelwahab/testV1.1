'use client';

import { useScenario } from './ScenarioProvider';
import type { WeatherBand } from '@/lib/engine/types';

const BANDS: { id: WeatherBand; label: string; desc: string }[] = [
  { id: 'stable',  label: 'Stable',  desc: '3%/yr' },
  { id: 'gradual', label: 'Gradual', desc: '8%/yr' },
  { id: 'shock',   label: 'Shock',   desc: '20%/yr' },
];

export default function CurrencyWeather() {
  const { assumptions, setWeather } = useScenario();
  const active = assumptions.weatherBand;

  return (
    <div className="flex flex-col gap-2">
      <span className="scenario-label">EGP/USD devaluation</span>
      <div className="flex gap-1 p-1 rounded-[12px]" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {BANDS.map(b => (
          <button
            key={b.id}
            onClick={() => setWeather(b.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--fs-sm)',
              fontWeight: active === b.id ? 600 : 400,
              background: active === b.id ? 'var(--surface)' : 'transparent',
              color: active === b.id ? 'var(--text)' : 'var(--text-3)',
              transition: 'all 150ms ease',
            }}
          >
            <div>{b.label}</div>
            <div style={{ fontSize: 11, color: active === b.id ? 'var(--brand-dim)' : 'var(--text-3)' }}>{b.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
