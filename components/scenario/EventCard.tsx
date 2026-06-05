'use client';

import { useState, useCallback } from 'react';
import { useScenario } from './ScenarioProvider';
import { ageAt } from '@/lib/age';
import { fmtDelta, fmtMonth, fmtUSD } from '@/lib/format';
import type { ScenarioEvent } from '@/lib/engine/types';

interface Props { event: ScenarioEvent; }

export default function EventCard({ event }: Props) {
  const { toggleEvent, updateEventDate, getAffordability, assumptions } = useScenario();
  const [expanded, setExpanded] = useState(false);
  const [dateInput, setDateInput] = useState(() => getProposedDate(event));

  const report = expanded ? getAffordability(event.id) : null;

  const delta = report?.retirementDeltaMonths ?? 0;
  const deltaColor = delta <= 3 ? 'var(--positive)' : delta <= 12 ? 'var(--brand)' : 'var(--negative)';

  const verdictColor = report?.canAffordNow === 'yes' ? 'var(--positive)'
    : report?.canAffordNow === 'tight' ? 'var(--brand)'
    : 'var(--negative)';
  const verdictLabel = report?.canAffordNow === 'yes' ? '✓ YES'
    : report?.canAffordNow === 'tight' ? '◑ TIGHT'
    : '✗ NO';

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "YYYY-MM"
    setDateInput(val);
    if (/^\d{4}-\d{2}$/.test(val)) updateEventDate(event.id, val);
  }, [event.id, updateEventDate]);

  return (
    <div
      className="rounded-[14px] transition-all"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${event.enabled ? 'var(--border)' : 'var(--surface-2)'}`,
        opacity: event.enabled ? 1 : 0.55,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        {/* Toggle */}
        <button
          onClick={() => toggleEvent(event.id, !event.enabled)}
          style={{
            width: 40, height: 22, borderRadius: 11,
            background: event.enabled ? 'var(--positive)' : 'var(--surface-2)',
            border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
            transition: 'background 200ms',
          }}
          aria-label={event.enabled ? 'Disable event' : 'Enable event'}
        >
          <div style={{
            width: 16, height: 16, borderRadius: '50%', background: 'var(--text)',
            position: 'absolute', top: 3, left: event.enabled ? 21 : 3,
            transition: 'left 200ms',
          }} />
        </button>

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--text)' }}>
            {event.name}
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
            {fmtMonth(getProposedDate(event))} · age {ageAt(getProposedDate(event), assumptions.birthDate)}
          </div>
        </div>

        {/* Impact chip */}
        {event.enabled && delta !== 0 && (
          <span style={{
            fontSize: 13, fontWeight: 600, color: deltaColor,
            background: `${deltaColor}18`, padding: '3px 10px',
            borderRadius: 'var(--radius-pill)', flexShrink: 0,
          }}>
            {fmtDelta(delta)}
          </span>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(p => !p)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, padding: '0 4px' }}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      {/* Expanded affordability detail */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {/* Date editor */}
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>When</span>
            <input
              type="month"
              value={dateInput}
              onChange={handleDateChange}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '4px 10px', color: 'var(--text)',
                fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', cursor: 'pointer',
              }}
            />
          </div>

          {report ? (
            <>
              {/* Verdict + pushes freedom to */}
              <div className="flex flex-wrap gap-3">
                <span style={{
                  fontSize: 13, fontWeight: 700, color: verdictColor,
                  background: `${verdictColor}18`, padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                }}>
                  {verdictLabel}
                </span>
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', alignSelf: 'center' }}>
                  {delta === 0 ? 'no change to freedom date'
                    : `pushes freedom to age ${report.withEventFreedomDate ? ageAt(report.withEventFreedomDate, assumptions.birthDate) : '—'} (+${delta}mo)`}
                </span>
              </div>

              {/* Funding options */}
              {report.fundingBreakdown.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="scenario-label">how to fund it</span>
                  {report.fundingBreakdown.map(opt => (
                    <div
                      key={opt.method}
                      style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8 }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: 6, textTransform: 'capitalize' }}>
                        {opt.method}
                      </span>
                      {opt.note}
                    </div>
                  ))}
                </div>
              )}

              {/* Earliest affordable date */}
              {report.earliestAffordableDate && report.earliestAffordableDate !== report.proposedDate && (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
                  Earliest affordable: {fmtMonth(report.earliestAffordableDate)} (age {ageAt(report.earliestAffordableDate, assumptions.birthDate)})
                  {report.retirementDeltaAtEarliest != null && ` · ${fmtDelta(report.retirementDeltaAtEarliest)} at that date`}
                </p>
              )}
            </>
          ) : (
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>Computing…</span>
          )}
        </div>
      )}
    </div>
  );
}

function getProposedDate(event: ScenarioEvent): string {
  for (const b of event.blocks) {
    if (b.type === 'OneTimeCashflow') return b.date;
    if (b.type === 'RecurringCashflow') return b.startDate;
  }
  return '2026-06';
}

