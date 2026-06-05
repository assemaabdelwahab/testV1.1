import type {
  ScenarioEvent, Position, Assumptions, SimResult,
  MonthPoint, ComfortPoint, Block, RateSchedule, Currency,
} from './types';

// ── Date helpers ──────────────────────────────────────────────────────────────

export function addMonths(yyyyMM: string, n: number): string {
  const [y, m] = yyyyMM.split('-').map(Number);
  const date = new Date(y, m - 1 + n, 1);
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  return `${yr}-${mo}`;
}

export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

// ── Rate helpers ──────────────────────────────────────────────────────────────

function getRateForMonth(schedule: RateSchedule, month: string): number {
  if (!schedule.length) return 0;
  const sorted = [...schedule].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  let active = sorted[0].rate;
  for (const seg of sorted) {
    if (seg.effectiveFrom <= month) active = seg.rate;
    else break;
  }
  return active;
}

/** Compound a base amount from startDate to currentMonth using a piecewise rateSchedule. */
function growAmount(
  base: number,
  schedule: RateSchedule | undefined,
  startDate: string,
  currentMonth: string,
): number {
  if (!schedule || !schedule.length || currentMonth <= startDate) return base;
  const sorted = [...schedule].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  let value = base;
  for (let i = 0; i < sorted.length; i++) {
    const segStart = i === 0 ? startDate : (sorted[i].effectiveFrom > startDate ? sorted[i].effectiveFrom : startDate);
    const segEnd = i + 1 < sorted.length ? sorted[i + 1].effectiveFrom : currentMonth;
    if (segStart >= currentMonth) break;
    const clampedEnd = segEnd > currentMonth ? currentMonth : segEnd;
    const months = monthsBetween(segStart, clampedEnd);
    if (months > 0) value *= Math.pow(1 + sorted[i].rate / 12, months);
  }
  return value;
}

function toUSD(amount: number, currency: Currency, egpUsd: number): number {
  return currency === 'USD' ? amount : amount / egpUsd;
}

// ── Main simulation ────────────────────────────────────────────────────────────

export function simulate(
  events: ScenarioEvent[],
  position: Position,
  assumptions: Assumptions,
): SimResult {
  const { modelStart, egpUsdToday, egpDevaluationRate, surplusReturnRate,
          swr, retirementMonthlySpendEGP, horizonMonths } = assumptions;

  const enabledBlocks: Block[] = events.filter(e => e.enabled).flatMap(e => e.blocks);

  // Mutable state
  let cashUSD = position.cashUSD;
  let investedUSD = position.investedUSD;

  // Per-block mutable state keyed by block id
  const assetValues = new Map<string, number>();
  const liabilityBalances = new Map<string, number>();

  for (const b of enabledBlocks) {
    if (b.type === 'Asset') assetValues.set(b.id, b.value);
    if (b.type === 'Liability') liabilityBalances.set(b.id, b.outstandingBalance);
  }

  const netWorthPath: MonthPoint[] = [];
  const comfortTimeline: ComfortPoint[] = [];
  const solvencyBreaks: string[] = [];

  let freedomDate: string | null = null;
  let freedomDateM1: string | null = null;
  let freedomDateM2: string | null = null;
  let coastPoint: string | null = null;

  let netWorthT0 = 0;
  let surplusT0 = 0;
  let debtServicePctT0 = 0;

  for (let t = 0; t < horizonMonths; t++) {
    const month = addMonths(modelStart, t);
    const egpUsd = egpUsdToday * Math.pow(1 + egpDevaluationRate, t / 12);

    // 1. Grow assets
    for (const b of enabledBlocks) {
      if (b.type !== 'Asset') continue;
      if (b.saleDate && month > b.saleDate) continue;
      const rate = getRateForMonth(b.rateSchedule, month);
      const cur = assetValues.get(b.id) ?? 0;
      assetValues.set(b.id, cur * (1 + rate / 12));
    }

    // 2. Amortize liabilities
    let totalDebtServiceUSD = 0;
    for (const b of enabledBlocks) {
      if (b.type !== 'Liability') continue;
      const balance = liabilityBalances.get(b.id) ?? 0;
      if (balance <= 0) continue;
      const interest = balance * b.monthlyRate;
      const payment = Math.min(b.monthlyPayment, balance + interest);
      const principal = payment - interest;
      liabilityBalances.set(b.id, Math.max(0, balance - principal));
      totalDebtServiceUSD += toUSD(payment, b.currency, egpUsd);
    }

    // 3. Income waterfall
    let totalIncomeUSD = 0;
    let totalExpenseUSD = 0;

    for (const b of enabledBlocks) {
      if (b.type === 'RecurringCashflow') {
        if (month < b.startDate) continue;
        if (b.endDate && month > b.endDate) continue;
        const grown = growAmount(b.amount, b.rateSchedule, b.startDate, month);
        const usd = toUSD(grown, b.currency, egpUsd);
        if (usd >= 0) totalIncomeUSD += usd;
        else totalExpenseUSD += -usd;
      }
      if (b.type === 'OneTimeCashflow' && b.date === month) {
        const usd = toUSD(b.amount, b.currency, egpUsd);
        if (usd >= 0) totalIncomeUSD += usd;
        else totalExpenseUSD += -usd;
      }
    }

    const totalOutflowUSD = totalExpenseUSD + totalDebtServiceUSD;
    const surplus = totalIncomeUSD - totalOutflowUSD;

    if (t === 0) {
      surplusT0 = surplus;
    }

    // Apply surplus / deficit — draw invested pool before flagging insolvency
    if (surplus < 0) {
      cashUSD += surplus;
      if (cashUSD < 0) {
        investedUSD += cashUSD; // cashUSD is negative → reduces invested pool
        cashUSD = 0;
        if (investedUSD < 0) {
          solvencyBreaks.push(month);
          investedUSD = 0;
        }
      }
    } else {
      investedUSD += surplus;
    }

    // Grow invested pool
    investedUSD *= 1 + surplusReturnRate / 12;

    // 4. Net worth
    let assetsUSD = cashUSD + investedUSD;
    for (const b of enabledBlocks) {
      if (b.type !== 'Asset') continue;
      if (b.saleDate && month > b.saleDate) continue;
      assetsUSD += toUSD(assetValues.get(b.id) ?? 0, b.currency, egpUsd);
    }

    let liabilitiesUSD = 0;
    for (const b of enabledBlocks) {
      if (b.type !== 'Liability') continue;
      liabilitiesUSD += toUSD(liabilityBalances.get(b.id) ?? 0, b.currency, egpUsd);
    }

    const netWorth = assetsUSD - liabilitiesUSD;
    if (t === 0) netWorthT0 = netWorth;

    // Retirement target: 25× annual spend in USD (devaluation tailwind baked in)
    const retirementSpendEGP = retirementMonthlySpendEGP * Math.pow(1 + egpDevaluationRate, t / 12);
    const retirementTargetUSD = (retirementSpendEGP * 12 / egpUsd) / swr;

    netWorthPath.push({ month, netWorthUSD: netWorth, egpUsdRate: egpUsd, surplusUSD: surplus, retirementTargetUSD });

    // 5. Freedom checks
    if (!freedomDate && netWorth >= retirementTargetUSD) freedomDate = month;
    if (!freedomDateM1 && netWorth >= 1_000_000) freedomDateM1 = month;
    if (!freedomDateM2 && netWorth >= 2_000_000) freedomDateM2 = month;

    // 6. Comfort — monthly recording, with debt-like recurring cashflows included in ratio
    let debtLikeUSD = 0;
    for (const b of enabledBlocks) {
      if (b.type === 'RecurringCashflow' && b.isDebtLike && b.amount < 0) {
        if (month < b.startDate) continue;
        if (b.endDate && month > b.endDate) continue;
        const grown = growAmount(b.amount, b.rateSchedule, b.startDate, month);
        debtLikeUSD += Math.abs(toUSD(grown, b.currency, egpUsd));
      }
    }
    const totalDebtRatioUSD = totalDebtServiceUSD + debtLikeUSD;
    const debtServicePct = totalIncomeUSD > 0 ? (totalDebtRatioUSD / totalIncomeUSD) * 100 : 0;
    const savingsRate = totalIncomeUSD > 0 ? (Math.max(0, surplus) / totalIncomeUSD) * 100 : 0;
    const liquidityMonths = totalOutflowUSD > 0 ? investedUSD / totalOutflowUSD : 99;
    comfortTimeline.push({ month, debtServicePct, savingsRate, liquidityMonths });

    if (t === 0) debtServicePctT0 = debtServicePct;
  }

  // Coast point: earliest t where investedUSD alone (no more contributions),
  // compounding at surplusReturnRate to freedomDate, reaches retirementTarget.
  if (freedomDate) {
    const monthsToFreedom = monthsBetween(modelStart, freedomDate);
    // Re-scan the path to find coast point
    for (let t = 0; t < netWorthPath.length && t < monthsToFreedom; t++) {
      const remaining = monthsToFreedom - t;
      const pt = netWorthPath[t];
      // Rough coast check: can current netWorth compound to freedom target with 0 surplus?
      const projectedAtFreedom = pt.netWorthUSD * Math.pow(1 + surplusReturnRate / 12, remaining);
      if (projectedAtFreedom >= pt.retirementTargetUSD && !coastPoint) {
        coastPoint = pt.month;
      }
    }
  }

  const monthsToFreedom = freedomDate ? monthsBetween(modelStart, freedomDate) : null;

  return {
    netWorthPath,
    freedomDate,
    freedomDateM1,
    freedomDateM2,
    monthsToFreedom,
    coastPoint,
    comfortTimeline,
    solvencyBreaks,
    netWorthT0,
    surplusT0,
    debtServicePctT0,
  };
}
