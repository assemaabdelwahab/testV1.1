'use client';

import { useState } from 'react';
import '@/styles/tokens.css';
import ScenarioProvider, { useScenario } from '@/components/scenario/ScenarioProvider';
import FreedomHeadline from '@/components/scenario/FreedomHeadline';
import CurrencyWeather from '@/components/scenario/CurrencyWeather';
import FactCheckRibbon from '@/components/scenario/FactCheckRibbon';
import NetWorthChart from '@/components/scenario/NetWorthChart';
import ComfortChart from '@/components/scenario/ComfortChart';
import EventCard from '@/components/scenario/EventCard';
import StatChip from '@/components/scenario/StatChip';
import PositionDrawer from '@/components/scenario/PositionDrawer';
import AssumptionsDrawer from '@/components/scenario/AssumptionsDrawer';
import { fmtUSD, fmtDuration } from '@/lib/format';

export default function ScenarioPage() {
  return (
    <ScenarioProvider>
      <Workbench />
    </ScenarioProvider>
  );
}

function Workbench() {
  const { result, events, assumptions } = useScenario();
  const [posOpen, setPosOpen] = useState(false);
  const [assOpen, setAssOpen] = useState(false);

  const nonBaseEvents = events.filter(e => e.id !== 'base');

  return (
    <div className="scenario min-h-screen" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--brand)' }}>
          Scenario
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPosOpen(true)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--text-2)', fontSize: 'var(--fs-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            Holdings
          </button>
          <button
            onClick={() => setAssOpen(true)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--text-2)', fontSize: 'var(--fs-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            ⚙ Assumptions
          </button>
        </div>
      </header>

      {/* Workbench scroll */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>

        {/* Zone 1 — Headline */}
        <section className="scenario-card flex flex-col gap-6">
          <FreedomHeadline />
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CurrencyWeather />
            <FactCheckRibbon />
          </div>
        </section>

        {/* Zone 2 — Net-worth trajectory */}
        <section className="scenario-card">
          <NetWorthChart />
          <div
            className="grid gap-3 mt-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
          >
            <StatChip
              label="Net worth today"
              value={fmtUSD(result.netWorthT0)}
              tag="measured"
            />
            <StatChip
              label="Monthly surplus"
              value={fmtUSD(result.surplusT0)}
              tag="measured"
            />
            <StatChip
              label="Debt-service"
              value={`${result.debtServicePctT0.toFixed(1)}%`}
              tag="measured"
              sub="of gross income"
            />
            <StatChip
              label="Savings rate"
              value={`${result.comfortTimeline[0] ? result.comfortTimeline[0].savingsRate.toFixed(0) : '—'}%`}
              tag="measured"
            />
          </div>
        </section>

        {/* Zone 3 — Comfort */}
        <section className="scenario-card">
          <ComfortChart />
        </section>

        {/* Zone 4 — Event rail */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="scenario-h2">Life events</span>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
              Toggle to see the cost in freedom months
            </span>
          </div>
          {nonBaseEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>

      </div>

      {/* Drawers */}
      <PositionDrawer open={posOpen} onClose={() => setPosOpen(false)} />
      <AssumptionsDrawer open={assOpen} onClose={() => setAssOpen(false)} />
    </div>
  );
}
