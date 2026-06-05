'use client';

import { useState, useCallback } from 'react';
import { useScenario } from './ScenarioProvider';
import { usePrivacy } from '@/components/PrivacyProvider';
import { EVENTS } from '@/lib/engine/scenarios';
import { ageAt } from '@/lib/age';
import { fmtMonth } from '@/lib/format';
import type { ScenarioEvent, EventStatus, FundingOption, Block } from '@/lib/engine/types';

interface Props { event: ScenarioEvent; }

const STATUS_CYCLE: EventStatus[] = ['hypothetical', 'planning', 'committed'];

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string; border: string; desc: string }> = {
  committed: {
    label: 'COMMITTED',
    color: 'var(--positive)',
    bg: 'rgba(111,185,140,0.15)',
    border: 'rgba(111,185,140,0.35)',
    desc: 'Locked in — included in your trajectory',
  },
  planning: {
    label: 'PLANNING',
    color: 'var(--brand)',
    bg: 'rgba(235,181,77,0.15)',
    border: 'rgba(235,181,77,0.35)',
    desc: 'In progress — included in trajectory',
  },
  hypothetical: {
    label: 'HYPOTHETICAL',
    color: 'var(--text-3)',
    bg: 'var(--surface-2)',
    border: 'var(--border)',
    desc: 'What if — excluded from trajectory',
  },
};

export default function EventCard({ event }: Props) {
  const { updateEventStatus, updateEventDate, updateEventBlock, getAffordability, assumptions } = useScenario();
  const { s } = usePrivacy();
  const [expanded, setExpanded] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [dateInput, setDateInput] = useState(() => getProposedDate(event));

  // Default blocks for reset
  const defaultBlocks = EVENTS.find(e => e.id === event.id)?.blocks ?? [];

  const report = expanded ? getAffordability(event.id) : null;
  const status = event.status ?? 'hypothetical';
  const cfg = STATUS_CONFIG[status];

  const delta = report?.retirementDeltaMonths ?? 0;

  const verdictColor = report?.canAffordNow === 'yes' ? 'var(--positive)'
    : report?.canAffordNow === 'tight' ? 'var(--brand)'
    : 'var(--negative)';
  const verdictLabel = report?.canAffordNow === 'yes' ? '✓ Affordable'
    : report?.canAffordNow === 'tight' ? '◑ Tight'
    : '✗ Not affordable';

  const handleStatusCycle = useCallback(() => {
    const idx = STATUS_CYCLE.indexOf(status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    updateEventStatus(event.id, next);
  }, [status, event.id, updateEventStatus]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateInput(val);
    if (/^\d{4}-\d{2}$/.test(val)) updateEventDate(event.id, val);
  }, [event.id, updateEventDate]);

  const recommended = report?.fundingBreakdown.find(o => o.recommended);
  const others = report?.fundingBreakdown.filter(o => !o.recommended) ?? [];

  const eventAge = ageAt(getProposedDate(event), assumptions.birthDate);

  return (
    <div
      className="rounded-[14px] transition-all"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${status === 'hypothetical' ? 'var(--surface-2)' : 'var(--border)'}`,
        opacity: status === 'hypothetical' ? 0.65 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Status badge — clickable to cycle */}
        <button
          onClick={handleStatusCycle}
          title={cfg.desc}
          style={{
            flexShrink: 0, marginTop: 2,
            padding: '3px 8px', borderRadius: 6,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            color: cfg.color, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em', cursor: 'pointer',
            fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
          }}
        >
          {cfg.label}
        </button>

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
            {event.name}
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginTop: 2 }}>
            {fmtMonth(getProposedDate(event))} · age {eventAge}
          </div>
          {/* Impact line — only when included in sim and delta known */}
          {event.enabled && delta !== 0 && (
            <div style={{ fontSize: 'var(--fs-sm)', color: delta <= 3 ? 'var(--positive)' : delta <= 12 ? 'var(--brand)' : 'var(--negative)', marginTop: 4, fontWeight: 500 }}>
              {delta > 0 ? `+${delta} months to freedom` : `${delta} months to freedom`}
              {report?.withEventFreedomDate && ` → age ${ageAt(report.withEventFreedomDate, assumptions.birthDate)}`}
            </div>
          )}
          {event.enabled && delta === 0 && report && (
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginTop: 4 }}>
              No impact on freedom date
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(p => !p)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, padding: '0 4px', flexShrink: 0 }}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      {/* Expanded detail */}
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

          {/* Adjust amounts */}
          <div>
            <button
              onClick={() => setAdjustOpen(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 'var(--fs-sm)', padding: 0, fontFamily: 'var(--font-body)' }}
            >
              {adjustOpen ? '▾' : '▸'} Adjust amounts
            </button>
            {adjustOpen && (
              <div className="flex flex-col gap-3 mt-3">
                {event.blocks.map(block => {
                  const defaultBlock = defaultBlocks.find(b => b.id === block.id);
                  return <BlockEditor key={block.id} block={block} defaultBlock={defaultBlock} eventId={event.id} updateBlock={updateEventBlock} />;
                })}
              </div>
            )}
          </div>

          {report ? (
            <>
              {/* Verdict */}
              <div className="flex flex-wrap gap-2 items-center">
                <span style={{
                  fontSize: 13, fontWeight: 700, color: verdictColor,
                  background: `${verdictColor}18`, padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                }}>
                  {verdictLabel}
                </span>
                {report.debtServicePctAfter > 0 && (
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
                    Debt-service after: {report.debtServicePctAfter.toFixed(1)}% of income
                  </span>
                )}
              </div>

              {/* Earliest affordable date */}
              {report.canAffordNow === 'no' && report.earliestAffordableDate && (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
                  Earliest affordable: {fmtMonth(report.earliestAffordableDate)} (age {ageAt(report.earliestAffordableDate, assumptions.birthDate)})
                  {report.retirementDeltaAtEarliest != null && ` · +${report.retirementDeltaAtEarliest}mo at that date`}
                </p>
              )}

              {/* Funding — only for one-time costs */}
              {report.fundingBreakdown.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="scenario-label">how to fund it</span>

                  {/* Recommended option */}
                  {recommended && (
                    <FundingRow option={recommended} isRecommended s={s} surplusUSD={report.monthlySurplusUSD} />
                  )}

                  {/* Other options */}
                  {others.length > 0 && (
                    <div className="flex flex-col gap-1" style={{ marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        Other options
                      </span>
                      {others.map(opt => (
                        <FundingRow key={opt.method} option={opt} isRecommended={false} s={s} surplusUSD={report.monthlySurplusUSD} />
                      ))}
                    </div>
                  )}
                </div>
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

function FundingRow({ option, isRecommended, s, surplusUSD }: {
  option: FundingOption;
  isRecommended: boolean;
  s: (v: string) => string;
  surplusUSD: number;
}) {
  const methodLabel: Record<string, string> = {
    cash: 'Cash',
    loan: 'Loan',
    'liquidate-egx': 'Liquidate EGX',
  };

  const burdenLabel = option.burdenPct != null && option.burdenPct > 0
    ? `${option.burdenPct}% of surplus/mo`
    : null;

  return (
    <div style={{
      padding: '10px 12px',
      background: isRecommended ? 'rgba(235,181,77,0.07)' : 'var(--surface-2)',
      border: `1px solid ${isRecommended ? 'rgba(235,181,77,0.25)' : 'var(--border)'}`,
      borderRadius: 10,
    }}>
      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: option.rationale ? 6 : 0 }}>
        {isRecommended && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--brand)',
            background: 'rgba(235,181,77,0.15)', padding: '2px 7px',
            borderRadius: 4, letterSpacing: '0.05em',
          }}>
            RECOMMENDED
          </span>
        )}
        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 'var(--fs-sm)' }}>
          {methodLabel[option.method] ?? option.method}
        </span>
        {burdenLabel && (
          <span style={{ fontSize: 12, color: (option.burdenPct ?? 0) > 35 ? 'var(--negative)' : 'var(--text-3)' }}>
            · {burdenLabel}
          </span>
        )}
      </div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>
        {s(option.note)}
      </div>
      {option.rationale && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
          {option.rationale}
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

function BlockEditor({ block, defaultBlock, eventId, updateBlock }: {
  block: Block;
  defaultBlock: Block | undefined;
  eventId: string;
  updateBlock: (eventId: string, blockId: string, patch: Partial<Block>) => void;
}) {
  const inputStyle = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '4px 8px', color: 'var(--text)',
    fontFamily: 'var(--font-mono)', fontSize: 13, width: '100%',
  };

  const isDefault = JSON.stringify(block) === JSON.stringify(defaultBlock);

  if (block.type === 'OneTimeCashflow') {
    const currency = block.currency;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Cost ({currency})
          </span>
          {!isDefault && (
            <button
              onClick={() => defaultBlock && updateBlock(eventId, block.id, defaultBlock)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: 11, padding: 0 }}
            >
              reset
            </button>
          )}
        </div>
        <input
          type="number"
          value={Math.abs(block.amount)}
          style={inputStyle}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBlock(eventId, block.id, { amount: -Math.abs(v) } as Partial<Block>);
          }}
        />
      </div>
    );
  }

  if (block.type === 'RecurringCashflow') {
    const currency = block.currency;
    const rate = block.rateSchedule?.[0]?.rate ?? 0;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Monthly cost ({currency})</span>
          {!isDefault && (
            <button
              onClick={() => defaultBlock && updateBlock(eventId, block.id, defaultBlock)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: 11, padding: 0 }}
            >
              reset
            </button>
          )}
        </div>
        <input
          type="number"
          value={Math.abs(block.amount)}
          style={inputStyle}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) updateBlock(eventId, block.id, { amount: -Math.abs(v) } as Partial<Block>);
          }}
        />
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Growth %/yr</span>
          <input
            type="number"
            min={0} max={30} step={1}
            value={Math.round(rate * 100)}
            style={{ ...inputStyle, width: 80 }}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) {
                const newSchedule = [{ effectiveFrom: block.startDate, rate: v / 100 }];
                updateBlock(eventId, block.id, { rateSchedule: newSchedule } as Partial<Block>);
              }
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>%</span>
        </div>
      </div>
    );
  }

  return null;
}
