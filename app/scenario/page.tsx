'use client';

import { useState } from 'react';
import '@/styles/tokens.css';
import ScenarioProvider, { useScenario } from '@/components/scenario/ScenarioProvider';
import PrivacyProvider, { usePrivacy } from '@/components/PrivacyProvider';
import FreedomHeadline from '@/components/scenario/FreedomHeadline';
import CurrencyWeather from '@/components/scenario/CurrencyWeather';
import FactCheckRibbon from '@/components/scenario/FactCheckRibbon';
import NetWorthChart from '@/components/scenario/NetWorthChart';
import ComfortChart from '@/components/scenario/ComfortChart';
import EventCard from '@/components/scenario/EventCard';
import StatChip from '@/components/scenario/StatChip';
import PositionDrawer from '@/components/scenario/PositionDrawer';
import AssumptionsDrawer from '@/components/scenario/AssumptionsDrawer';
import EventStatusBar from '@/components/scenario/EventStatusBar';
import DriftPanel from '@/components/scenario/DriftPanel';
import { fmtUSD } from '@/lib/format';

export default function ScenarioPage() {
  return (
    <PrivacyProvider>
      <ScenarioProvider>
        <Workbench />
      </ScenarioProvider>
    </PrivacyProvider>
  );
}

function Workbench() {
  const { result, events, assumptions, latestDrift } = useScenario();
  const { privacy, togglePrivacy, s } = usePrivacy();
  const [posOpen, setPosOpen] = useState(false);
  const [assOpen, setAssOpen] = useState(false);

  const nonBaseEvents = events.filter(e => e.id !== 'base');
  const totalEventDelta = nonBaseEvents
    .filter(e => e.enabled)
    .reduce((sum, e) => {
      // sum contributed by enabled events — computed live from result
      return sum;
    }, 0);

  return (
    <div className="scenario min-h-screen" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--brand)' }}>
            Scenario
          </span>
          {latestDrift && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: latestDrift.deltaUsd >= 0 ? 'rgba(111,185,140,0.15)' : 'rgba(220,60,60,0.12)',
              color: latestDrift.deltaUsd >= 0 ? 'var(--positive)' : 'var(--negative)',
              border: `1px solid ${latestDrift.deltaUsd >= 0 ? 'rgba(111,185,140,0.3)' : 'rgba(220,60,60,0.25)'}`,
            }}>
              {Math.abs(latestDrift.deltaUsd) < 500
                ? 'on track'
                : `${latestDrift.deltaUsd >= 0 ? '↑' : '↓'} ${Math.abs(latestDrift.deltaPct).toFixed(1)}% vs plan`}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
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
          {/* Privacy toggle */}
          <button
            onClick={togglePrivacy}
            title={privacy ? 'Show numbers' : 'Hide numbers'}
            style={{
              background: privacy ? 'rgba(235,181,77,0.15)' : 'var(--surface)',
              border: `1px solid ${privacy ? 'rgba(235,181,77,0.4)' : 'var(--border)'}`,
              borderRadius: 8, padding: '6px 10px',
              color: privacy ? 'var(--brand)' : 'var(--text-3)',
              fontSize: 16, cursor: 'pointer', lineHeight: 1,
            }}
          >
            {privacy ? '🔒' : '🔓'}
          </button>
        </div>
      </header>

      {/* Workbench scroll */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>

        {/* ── YOUR TRAJECTORY ── */}
        <SectionHeader label="Your Trajectory" />
        <section className="scenario-card flex flex-col gap-6">
          <FreedomHeadline />
          <EventStatusBar />
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CurrencyWeather />
          </div>
        </section>

        <section className="scenario-card">
          <NetWorthChart />
          <div
            className="grid gap-3 mt-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
          >
            <StatChip
              label="Net worth today"
              value={s(fmtUSD(result.netWorthT0))}
              tag="measured"
            />
            <StatChip
              label="Monthly surplus"
              value={s(fmtUSD(result.surplusT0))}
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

        {/* ── FINANCIAL COMFORT ── */}
        <SectionHeader label="Financial Comfort" />
        <section className="scenario-card">
          <ComfortChart />
        </section>

        {/* ── REALITY CHECK ── */}
        <SectionHeader label="Reality Check" />
        <section className="scenario-card">
          <DriftPanel />
        </section>

        {/* ── LIFE EVENTS ── */}
        <SectionHeader label="Life Events" />
        <section className="flex flex-col gap-4">
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)', marginBottom: 4 }}>
            Each event shows its cost in freedom months. COMMITTED and PLANNING events are included in your trajectory above.
          </p>
          {nonBaseEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>

        {/* ── ABOUT THIS MODEL ── */}
        <SectionHeader label="About This Model" />
        <section className="scenario-card">
          <FactCheckRibbon />
        </section>

      </div>

      {/* Drawers */}
      <PositionDrawer open={posOpen} onClose={() => setPosOpen(false)} />
      <AssumptionsDrawer open={assOpen} onClose={() => setAssOpen(false)} />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: -8 }}>
      <span style={{
        fontSize: 'var(--fs-label)', fontWeight: 600,
        color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em',
        fontFamily: 'var(--font-body)',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}
