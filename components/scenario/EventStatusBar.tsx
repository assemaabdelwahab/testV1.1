'use client';

import { useCallback } from 'react';
import { useScenario } from './ScenarioProvider';
import type { EventStatus } from '@/lib/engine/types';

const STATUS_CYCLE: EventStatus[] = ['hypothetical', 'planning', 'committed'];

const STATUS_STYLE: Record<EventStatus, { color: string; bg: string; border: string }> = {
  committed:   { color: 'var(--positive)', bg: 'rgba(111,185,140,0.15)', border: 'rgba(111,185,140,0.3)' },
  planning:    { color: 'var(--brand)',    bg: 'rgba(235,181,77,0.13)',   border: 'rgba(235,181,77,0.3)'  },
  hypothetical:{ color: 'var(--text-3)',   bg: 'var(--surface-2)',        border: 'var(--border)'          },
};

const SHORT_NAME: Record<string, string> = {
  'apartment-finishing': 'Apartment',
  'marriage':            'Marriage',
  'car-purchase':        'Car',
  'kid-1':               '1st child',
  'kid-2':               '2nd child',
};

export default function EventStatusBar() {
  const { events, updateEventStatus } = useScenario();
  const nonBase = events.filter(e => e.id !== 'base');

  const cycle = useCallback((id: string, current: EventStatus) => {
    const idx = STATUS_CYCLE.indexOf(current);
    updateEventStatus(id, STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
  }, [updateEventStatus]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 0' }}>
      {nonBase.map(e => {
        const status = e.status ?? 'hypothetical';
        const st = STATUS_STYLE[status];
        const label = SHORT_NAME[e.id] ?? e.name;
        return (
          <button
            key={e.id}
            onClick={() => cycle(e.id, status)}
            title={`Click to cycle status · currently ${status}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
              background: st.bg, border: `1px solid ${st.border}`,
              color: st.color, fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-body)', transition: 'opacity 150ms',
            }}
          >
            <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {status === 'committed' ? '●' : status === 'planning' ? '◐' : '○'}
            </span>
            {label}
          </button>
        );
      })}
      <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center', marginLeft: 4 }}>
        click to cycle
      </span>
    </div>
  );
}
