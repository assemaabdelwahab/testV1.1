'use client';

import { useScenario } from './ScenarioProvider';
import { usePrivacy } from '@/components/PrivacyProvider';
import { ageAt } from '@/lib/age';
import { fmtMonth, fmtDuration, fmtUSD } from '@/lib/format';

export default function FreedomHeadline() {
  const { result, assumptions } = useScenario();
  const { s } = usePrivacy();
  const { freedomDate, monthsToFreedom, freedomDateM1, freedomDateM2 } = result;
  const { birthDate } = assumptions;

  const mathAge    = freedomDate  ? ageAt(freedomDate, birthDate)  : null;
  const cushionAge = freedomDateM1 ? ageAt(freedomDateM1, birthDate) : null;
  const m2Age      = freedomDateM2 ? ageAt(freedomDateM2, birthDate) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero age */}
      <div className="flex flex-col gap-1">
        <span className="scenario-label">financial freedom</span>
        {mathAge != null ? (
          <>
            <div className="scenario-hero">{mathAge}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)', color: 'var(--text-2)', fontWeight: 400 }}>
              {freedomDate ? fmtMonth(freedomDate) : ''}{' '}
              <span style={{ color: 'var(--text-3)' }}>
                · {monthsToFreedom != null ? fmtDuration(monthsToFreedom) : ''} from now
              </span>
            </div>
          </>
        ) : (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h1)', color: 'var(--text-3)' }}>
            Not reached in 30yr
          </div>
        )}
      </div>

      {/* Two clocks */}
      <div className="flex gap-3 flex-wrap">
        <Clock
          name="by the math"
          desc={`25× retirement spend (${s(fmtUSD((assumptions.retirementMonthlySpendEGP * 12 / assumptions.egpUsdToday) / assumptions.swr))})`}
          age={mathAge}
          date={freedomDate}
          color="var(--positive)"
        />
        <Clock
          name="with a cushion"
          desc="$2M guardrail"
          age={m2Age}
          date={freedomDateM2}
          color="var(--brand)"
        />
        {cushionAge && cushionAge !== mathAge && (
          <Clock
            name="$1M milestone"
            desc="en route"
            age={cushionAge}
            date={freedomDateM1}
            color="var(--text-3)"
          />
        )}
      </div>

      {/* Cushion gap */}
      {mathAge != null && m2Age != null && (
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
          {m2Age - mathAge}yr gap between the two clocks — that's the cushion.
        </div>
      )}
    </div>
  );
}

function Clock({ name, desc, age, date, color }: {
  name: string; desc: string; age: number | null; date: string | null; color: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 flex-1 min-w-[140px] p-4 rounded-[12px]"
      style={{ background: 'var(--surface-2)', border: `1px solid ${color}30` }}
    >
      <span className="scenario-label">{name}</span>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color, lineHeight: 1.1 }}>
        {age != null ? `age ${age}` : '—'}
      </div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-3)' }}>
        {date ? fmtMonth(date) : '—'}
      </div>
      <div style={{ fontSize: 'var(--fs-label)', color: 'var(--text-3)', marginTop: 2 }}>
        {desc}
      </div>
    </div>
  );
}
