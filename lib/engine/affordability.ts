import type {
  ScenarioEvent, Position, Assumptions, AffordabilityReport, FundingOption, SimResult,
} from './types';
import { simulate, addMonths, monthsBetween } from './engine';

/**
 * Assess whether a specific event can be afforded, when it can first be afforded,
 * and what it costs in retirement-delay months.
 *
 * The event is evaluated at `proposedDate`. The baseline sim (without the event)
 * is compared to a sim with the event inserted at `proposedDate`.
 */
export function canAfford(
  event: ScenarioEvent,
  baseEvents: ScenarioEvent[],
  position: Position,
  assumptions: Assumptions,
): AffordabilityReport {
  const { modelStart, egpUsdToday, egpDevaluationRate } = assumptions;

  // Baseline sim (event disabled)
  const baselineEvents = baseEvents.map(e => ({ ...e }));
  const baseline = simulate(baselineEvents, position, assumptions);

  // Sim with event at proposed date
  const proposedDate = getEventProposedDate(event);
  const withEventNow = simulate(
    [...baseEvents, { ...event, enabled: true }],
    position,
    assumptions,
  );

  // Solvency breaks introduced by this event
  const baseBreaks = new Set(baseline.solvencyBreaks);
  const solvencyBreaksIfNow = withEventNow.solvencyBreaks.filter(m => !baseBreaks.has(m));

  // Affordability verdict
  const monthsFromNow = monthsBetween(modelStart, proposedDate);
  const egpUsdAtProposed = egpUsdToday * Math.pow(1 + egpDevaluationRate, monthsFromNow / 12);

  const oneTimeUSD = getOneTimeCostUSD(event, proposedDate, egpUsdAtProposed);
  const recurringDebtServiceIncrease = getRecurringDebtServiceUSD(event, proposedDate, egpUsdAtProposed);

  // Get invested pool value at proposed date from the with-event sim path
  const poolAtProposed = withEventNow.netWorthPath[Math.min(monthsFromNow, withEventNow.netWorthPath.length - 1)];

  // Debt-service % after event (use t=0 income as proxy, grown to proposed date)
  const incomeAtProposed = baseline.surplusT0 > 0
    ? (baseline.surplusT0 / (1 - baseline.debtServicePctT0 / 100)) *
      Math.pow(1 + assumptions.surplusReturnRate / 12, monthsFromNow)
    : 5500; // fallback
  const debtServicePctAfter = incomeAtProposed > 0
    ? ((baseline.debtServicePctT0 / 100) * incomeAtProposed + recurringDebtServiceIncrease) / incomeAtProposed * 100
    : 0;

  // Funding options using simulated EGX value at proposed date
  const fundingBreakdown = buildFundingOptions(oneTimeUSD, position, baseline, assumptions, egpUsdAtProposed, monthsFromNow);

  // Can afford now?
  // Trust the engine's solvency check — if no new breaks, the pool can cover the cost.
  let canAffordNow: 'yes' | 'tight' | 'no';
  if (solvencyBreaksIfNow.length > 0) {
    canAffordNow = 'no';
  } else if (debtServicePctAfter > 45) {
    canAffordNow = 'tight'; // recurring debt crosses red threshold
  } else {
    canAffordNow = 'yes';
  }

  // Binary search: earliest affordable date
  const earliestAffordableDate = findEarliestAffordableDate(
    event, baseEvents, position, assumptions, solvencyBreaksIfNow.length > 0,
  );

  // Retirement delta at proposed date
  const retirementDeltaMonths = computeDelta(baseline.freedomDate, withEventNow.freedomDate);

  // Retirement delta at earliest affordable date
  let retirementDeltaAtEarliest: number | null = null;
  if (earliestAffordableDate && earliestAffordableDate !== proposedDate) {
    const shiftedEvent = shiftEventDate(event, earliestAffordableDate);
    const withEarliest = simulate([...baseEvents, shiftedEvent], position, assumptions);
    retirementDeltaAtEarliest = computeDelta(baseline.freedomDate, withEarliest.freedomDate);
  } else if (earliestAffordableDate === proposedDate) {
    retirementDeltaAtEarliest = retirementDeltaMonths;
  }

  return {
    eventId: event.id,
    eventName: event.name,
    proposedDate,
    canAffordNow,
    fundingBreakdown,
    earliestAffordableDate,
    retirementDeltaMonths,
    retirementDeltaAtEarliest,
    solvencyBreaksIfNow,
    debtServicePctAfter,
    baselineFreedomDate: baseline.freedomDate,
    withEventFreedomDate: withEventNow.freedomDate,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEventProposedDate(event: ScenarioEvent): string {
  for (const b of event.blocks) {
    if (b.type === 'OneTimeCashflow') return b.date;
    if (b.type === 'RecurringCashflow') return b.startDate;
    if (b.type === 'Liability') return '2026-06';
  }
  return '2026-06';
}

function getOneTimeCostUSD(event: ScenarioEvent, month: string, egpUsd: number): number {
  let total = 0;
  for (const b of event.blocks) {
    if (b.type === 'OneTimeCashflow' && b.date === month && b.amount < 0) {
      total += b.currency === 'USD' ? -b.amount : -b.amount / egpUsd;
    }
  }
  return total;
}

function getRecurringDebtServiceUSD(event: ScenarioEvent, month: string, egpUsd: number): number {
  let total = 0;
  for (const b of event.blocks) {
    if (b.type === 'Liability') {
      total += b.currency === 'USD' ? b.monthlyPayment : b.monthlyPayment / egpUsd;
    }
    if (b.type === 'RecurringCashflow' && b.amount < 0 && b.startDate <= month) {
      const monthly = b.currency === 'USD' ? -b.amount : -b.amount / egpUsd;
      total += monthly;
    }
  }
  return total;
}

function getMonthlyOutflowT0(events: ScenarioEvent[], position: Position, assumptions: Assumptions): number {
  const result = simulate(events, position, { ...assumptions, horizonMonths: 1 });
  return result.surplusT0 < 0 ? Math.abs(result.surplusT0) : 0;
}

function buildFundingOptions(
  oneTimeCostUSD: number,
  position: Position,
  baseline: SimResult,
  assumptions: Assumptions,
  egpUsdAtDate: number,
  monthsFromNow: number,
): FundingOption[] {
  if (oneTimeCostUSD <= 0) return [];

  // Use net worth at proposed date to estimate available pool
  const ptAtDate = baseline.netWorthPath[Math.min(monthsFromNow, baseline.netWorthPath.length - 1)];
  const poolAtDate = Math.max(0, ptAtDate?.netWorthUSD ?? position.cashUSD);

  const options: FundingOption[] = [];

  // Option A: draw from invested pool (cash + accumulated surplus)
  options.push({
    method: 'cash',
    amountUSD: Math.min(oneTimeCostUSD, poolAtDate),
    remainingCashUSD: poolAtDate - oneTimeCostUSD,
    note: poolAtDate >= oneTimeCostUSD
      ? `Pool at ${ptAtDate?.month ?? 'now'}: ~$${Math.round(poolAtDate).toLocaleString()}. Fully covered, $${Math.round(poolAtDate - oneTimeCostUSD).toLocaleString()} remains.`
      : `Pool at ${ptAtDate?.month ?? 'now'}: ~$${Math.round(poolAtDate).toLocaleString()} — short by $${Math.round(oneTimeCostUSD - poolAtDate).toLocaleString()}.`,
  });

  // Option B: liquidate EGX — value grown to proposed date (20%/yr EGP, net of devaluation)
  const egxValueAtDate = (460_000 / assumptions.egpUsdToday) *
    Math.pow(1 + 0.20, monthsFromNow / 12) /
    Math.pow(1 + assumptions.egpDevaluationRate, monthsFromNow / 12);
  if (egxValueAtDate > 0) {
    const pctLiquidated = Math.min(1, oneTimeCostUSD / egxValueAtDate);
    options.push({
      method: 'liquidate-egx',
      amountUSD: Math.min(oneTimeCostUSD, egxValueAtDate),
      egxRemainingUSD: egxValueAtDate - Math.min(oneTimeCostUSD, egxValueAtDate),
      note: `Liquidate ${(pctLiquidated * 100).toFixed(0)}% of EGX at ${ptAtDate?.month ?? 'now'} (~$${Math.round(Math.min(oneTimeCostUSD, egxValueAtDate)).toLocaleString()}). Reduces long-term compounding.`,
    });
  }

  // Option C: take an EGP loan at prevailing rate
  const loanPrincipalEGP = oneTimeCostUSD * egpUsdAtDate;
  const r = 0.02285; // ~27.4%/yr, consistent with existing mortgage
  const n = 60;
  const monthlyPayment = loanPrincipalEGP * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  options.push({
    method: 'loan',
    amountUSD: oneTimeCostUSD,
    loanMonthlyPaymentEGP: Math.round(monthlyPayment),
    loanTermMonths: n,
    note: `60-month EGP loan at ~27.4%/yr. Monthly installment: EGP ${Math.round(monthlyPayment).toLocaleString()}.`,
  });

  return options;
}

function findEarliestAffordableDate(
  event: ScenarioEvent,
  baseEvents: ScenarioEvent[],
  position: Position,
  assumptions: Assumptions,
  needsSearch: boolean,
): string | null {
  if (!needsSearch) return getEventProposedDate(event);

  const { modelStart } = assumptions;

  // Linear scan up to 10 years (120 months) — find first month with no solvency breaks
  for (let offset = 0; offset <= 120; offset++) {
    const testDate = addMonths(modelStart, offset);
    const shifted = shiftEventDate(event, testDate);
    const result = simulate([...baseEvents, shifted], position, assumptions);

    // No new solvency breaks introduced in the 12 months following the event
    const baselineResult = simulate(baseEvents, position, assumptions);
    const baseSolvencySet = new Set(baselineResult.solvencyBreaks);
    const newBreaks = result.solvencyBreaks.filter(m => m >= testDate && !baseSolvencySet.has(m));

    if (newBreaks.length === 0) return testDate;
  }

  return null; // never affordable within 10 years
}

function shiftEventDate(event: ScenarioEvent, newDate: string): ScenarioEvent {
  return {
    ...event,
    enabled: true,
    blocks: event.blocks.map(b => {
      if (b.type === 'OneTimeCashflow') return { ...b, date: newDate };
      if (b.type === 'RecurringCashflow') return { ...b, startDate: newDate };
      return b;
    }),
  };
}

function computeDelta(baseDate: string | null, withDate: string | null): number {
  if (!baseDate && !withDate) return 0;
  if (!baseDate) return 0;
  if (!withDate) return 999; // never reaches freedom
  const [by, bm] = baseDate.split('-').map(Number);
  const [wy, wm] = withDate.split('-').map(Number);
  return (wy - by) * 12 + (wm - bm);
}
