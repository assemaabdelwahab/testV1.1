'use client';

import { useState } from 'react';
import { useParallelScenario } from './ParallelScenarioProvider';
import type { ScenarioEvent, Assumptions, EventStatus } from '@/lib/engine/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  baseEvents: ScenarioEvent[];
  baseAssumptions: Assumptions;
}

export function ScenarioCreatorSheet({ open, onClose, onCreated, baseEvents, baseAssumptions }: Props) {
  const { createScenario } = useParallelScenario();
  const [name, setName] = useState('');
  const [eventOverrides, setEventOverrides] = useState<Record<string, EventStatus>>({});

  const nonBaseEvents = baseEvents.filter(e => e.id !== 'base');

  function getEffectiveStatus(event: ScenarioEvent): EventStatus {
    return (eventOverrides[event.id] ?? event.status) as EventStatus;
  }

  function cycleStatus(eventId: string, current: EventStatus) {
    const order: EventStatus[] = ['committed', 'planning', 'hypothetical'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    setEventOverrides(prev => ({ ...prev, [eventId]: next }));
  }

  // Auto-suggest name from changed events
  const changedEvents = nonBaseEvents.filter(e => eventOverrides[e.id] !== undefined);
  const suggest = changedEvents.length > 0
    ? changedEvents.slice(0, 2).map(e => e.name).join(' + ')
    : null;

  const changedCount = changedEvents.length;

  function handleCreate() {
    const finalName = name.trim() || suggest || 'Unnamed scenario';
    const finalEvents = baseEvents.map(e => {
      const status = getEffectiveStatus(e);
      return { ...e, status, enabled: status !== 'hypothetical' };
    });
    const scenario = createScenario(finalName, finalEvents, baseAssumptions);
    setName('');
    setEventOverrides({});
    onCreated(scenario.id);
  }

  if (!open) return null;

  const statusColor: Record<EventStatus, string> = {
    committed: 'var(--positive)',
    planning: 'var(--brand)',
    hypothetical: 'var(--text-3)',
  };

  const statusLabel: Record<EventStatus, string> = {
    committed: 'COMMITTED',
    planning: 'PLANNING',
    hypothetical: 'HYPOTHETICAL',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        background: 'var(--surface)', borderRadius: '16px 16px 0 0',
        padding: '24px 20px 0', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
            New scenario
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 20 }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Name input */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Name
            </label>
            <input
              value={name}
              maxLength={60}
              onChange={e => setName(e.target.value)}
              placeholder={suggest ?? 'e.g. No car, early kids'}
              style={{
                width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-body)',
                padding: '10px 12px', boxSizing: 'border-box',
              }}
            />
            {/* Auto-suggest chips */}
            {suggest && !name && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <button onClick={() => setName(suggest)} style={{
                  background: 'rgba(235,181,77,0.1)', border: '1px solid rgba(235,181,77,0.3)',
                  borderRadius: 6, color: 'var(--brand)', fontSize: 12,
                  cursor: 'pointer', padding: '3px 10px', fontFamily: 'var(--font-body)',
                }}>
                  {suggest}
                </button>
              </div>
            )}
          </div>

          {/* Events */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Events
              </label>
              {changedCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>
                  {changedCount} changed vs baseline
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nonBaseEvents.map(evt => {
                const status = getEffectiveStatus(evt);
                const isChanged = eventOverrides[evt.id] !== undefined;
                return (
                  <div key={evt.id} style={{
                    background: 'var(--surface-2)',
                    border: `1px solid ${isChanged ? 'rgba(235,181,77,0.4)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{evt.name}</span>
                    <button
                      onClick={() => cycleStatus(evt.id, status)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                        color: statusColor[status], fontFamily: 'var(--font-body)', padding: '2px 0',
                      }}
                    >
                      {statusLabel[status]}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div style={{
          position: 'sticky', bottom: 0, background: 'var(--surface)',
          padding: '16px 0 32px', borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={handleCreate}
            style={{
              width: '100%', background: 'var(--brand)', border: 'none', borderRadius: 10,
              color: '#15120E', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              padding: '14px', fontFamily: 'var(--font-display)',
            }}
          >
            Run this scenario
          </button>
        </div>
      </div>
    </>
  );
}
