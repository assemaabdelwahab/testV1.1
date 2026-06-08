'use client';

import { useState } from 'react';
import { useParallelScenario } from './ParallelScenarioProvider';
import { fmtMonth } from '@/lib/format';

export default function ComparisonBar() {
  const { activeScenario, scenarioDelta, exitComparison, renameScenario } = useParallelScenario();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');

  if (!activeScenario || !scenarioDelta) return null;

  const { freedomDeltaMonths, baselineFreedomDate, scenarioFreedomDate } = scenarioDelta;

  const deltaColor = freedomDeltaMonths === null ? 'var(--text-3)'
    : freedomDeltaMonths > 0 ? 'var(--negative)'
    : freedomDeltaMonths < 0 ? 'var(--positive)'
    : 'var(--text-3)';

  const deltaLabel = freedomDeltaMonths === null ? '—'
    : freedomDeltaMonths === 0 ? '±0 months'
    : freedomDeltaMonths > 0 ? `▲ +${freedomDeltaMonths} months to freedom`
    : `▼ ${Math.abs(freedomDeltaMonths)} months to freedom`;

  function startRename() {
    setNameInput(activeScenario!.name);
    setEditing(true);
  }

  function commitRename() {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== activeScenario!.name) {
      renameScenario(activeScenario!.id, trimmed);
    }
    setEditing(false);
  }

  return (
    <div style={{
      position: 'sticky', top: 56, zIndex: 9,
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '10px 20px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Baseline</div>
          <div style={{ color: 'var(--text-2)', fontWeight: 600 }}>
            {baselineFreedomDate ? fmtMonth(baselineFreedomDate) : '—'}
          </div>
        </div>
        <div style={{ color: 'var(--text-3)', fontSize: 11 }}>vs</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scenario</span>
            <button onClick={startRename} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 10, padding: 0, lineHeight: 1 }}>✎</button>
          </div>
          {editing ? (
            <input
              autoFocus
              value={nameInput}
              maxLength={60}
              onChange={e => setNameInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--brand)', borderRadius: 4,
                color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-mono)',
                padding: '2px 6px', width: '100%',
              }}
            />
          ) : (
            <div style={{ color: 'var(--brand)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              {scenarioFreedomDate ? fmtMonth(scenarioFreedomDate) : '—'}
            </div>
          )}
        </div>
        <button onClick={exitComparison} title="Exit comparison" style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 6,
          color: 'var(--text-3)', fontSize: 14, cursor: 'pointer', padding: '2px 8px', lineHeight: 1,
        }}>×</button>
      </div>
      {!editing && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Editing: <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{activeScenario.name}</span>
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: deltaColor, fontFamily: 'var(--font-mono)' }}>
        {deltaLabel}
      </div>
    </div>
  );
}
