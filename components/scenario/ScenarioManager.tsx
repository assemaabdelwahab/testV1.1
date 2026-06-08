'use client';

import { useState } from 'react';
import { useScenario } from './ScenarioProvider';
import { useParallelScenario } from './ParallelScenarioProvider';
import { MAX_SCENARIOS } from '@/lib/scenario/storage';
import { ScenarioCreatorSheet } from './ScenarioCreatorSheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ScenarioManager({ open, onClose }: Props) {
  const { events: baseEvents, assumptions: baseAssumptions } = useScenario();
  const {
    scenarios, activeScenarioId, atMaxScenarios,
    loadScenario, exitComparison, deleteScenarioById, duplicateScenarioById,
  } = useParallelScenario();
  const [creatorOpen, setCreatorOpen] = useState(false);

  if (!open) return null;

  function handleLoad(id: string) {
    loadScenario(id);
    onClose();
  }

  function handleDelete(id: string) {
    if (confirm('Delete this scenario permanently?')) {
      deleteScenarioById(id);
    }
  }

  function handleDuplicate(id: string) {
    const copy = duplicateScenarioById(id);
    if (copy) loadScenario(copy.id);
    onClose();
  }

  function handleExitBaseline() {
    exitComparison();
    onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)', borderRadius: '16px 16px 0 0',
        padding: '24px 20px 40px', maxHeight: '80vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
            Scenarios
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 20 }}>×</button>
        </div>

        {/* Baseline card */}
        <div style={{
          background: 'var(--surface-2)',
          border: `1px solid ${activeScenarioId === null ? 'var(--brand)' : 'var(--border)'}`,
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Current plan</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Baseline — always intact</div>
          </div>
          {activeScenarioId !== null ? (
            <button onClick={handleExitBaseline} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', padding: '4px 10px', fontFamily: 'var(--font-body)',
            }}>
              Return to baseline
            </button>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>Active</span>
          )}
        </div>

        {/* Empty state */}
        {scenarios.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>
            No scenarios yet. Branch from your current plan to explore a different future.
          </p>
        )}

        {/* Scenario cards */}
        {scenarios.map(s => (
          <div key={s.id} style={{
            background: 'var(--surface-2)',
            border: `1px solid ${activeScenarioId === s.id ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Updated {new Date(s.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => handleLoad(s.id)} style={{
                background: activeScenarioId === s.id ? 'rgba(235,181,77,0.15)' : 'var(--surface)',
                border: `1px solid ${activeScenarioId === s.id ? 'rgba(235,181,77,0.5)' : 'var(--border)'}`,
                borderRadius: 6, padding: '4px 10px',
                color: activeScenarioId === s.id ? 'var(--brand)' : 'var(--text-2)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
              }}>
                {activeScenarioId === s.id ? 'Active' : 'Load'}
              </button>
              <button onClick={() => handleDuplicate(s.id)} title="Duplicate" style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', padding: '4px 8px',
              }}>⧉</button>
              <button onClick={() => handleDelete(s.id)} title="Delete" style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                color: 'var(--negative)', fontSize: 12, cursor: 'pointer', padding: '4px 8px',
              }}>✕</button>
            </div>
          </div>
        ))}

        {/* New scenario CTA */}
        <button
          onClick={() => !atMaxScenarios && setCreatorOpen(true)}
          disabled={atMaxScenarios}
          title={atMaxScenarios ? `Maximum ${MAX_SCENARIOS} scenarios reached` : undefined}
          style={{
            background: atMaxScenarios ? 'var(--surface-2)' : 'rgba(235,181,77,0.1)',
            border: `1px dashed ${atMaxScenarios ? 'var(--border)' : 'rgba(235,181,77,0.4)'}`,
            borderRadius: 10, padding: '14px',
            color: atMaxScenarios ? 'var(--text-3)' : 'var(--brand)',
            fontSize: 14, cursor: atMaxScenarios ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 600, width: '100%',
          }}
        >
          {atMaxScenarios ? `Max ${MAX_SCENARIOS} scenarios reached` : '+ New scenario'}
        </button>
      </div>

      <ScenarioCreatorSheet
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={(id) => { setCreatorOpen(false); loadScenario(id); onClose(); }}
        baseEvents={baseEvents}
        baseAssumptions={baseAssumptions}
      />
    </>
  );
}

