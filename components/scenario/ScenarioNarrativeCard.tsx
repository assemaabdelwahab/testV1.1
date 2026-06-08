'use client';

import { useState, useEffect } from 'react';
import { useParallelScenario } from './ParallelScenarioProvider';

export default function ScenarioNarrativeCard() {
  const { activeScenario, scenarioNarrative } = useParallelScenario();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (activeScenario) setCollapsed(false);
  }, [activeScenario?.id]);

  if (!activeScenario || !scenarioNarrative) return null;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '14px 16px',
    }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
          fontFamily: 'var(--font-body)', fontWeight: 600, padding: 0, marginBottom: collapsed ? 0 : 10,
        }}
      >
        <span>Scenario summary</span>
        <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{collapsed ? '›' : '‹'}</span>
      </button>
      {!collapsed && (
        <p style={{
          fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6,
          fontFamily: 'var(--font-body)', margin: 0,
        }}>
          {scenarioNarrative}
        </p>
      )}
    </div>
  );
}
