export type Currency = 'USD' | 'EGP';

export interface RateSegment {
  effectiveFrom: string; // 'YYYY-MM'
  rate: number; // annual decimal, e.g. 0.10 = 10%/yr
}

export type RateSchedule = RateSegment[];

export interface OneTimeCashflow {
  type: 'OneTimeCashflow';
  id: string;
  currency: Currency;
  date: string; // 'YYYY-MM' when this occurs
  amount: number; // negative = outflow (e.g. wedding cost)
}

export interface RecurringCashflow {
  type: 'RecurringCashflow';
  id: string;
  currency: Currency;
  startDate: string; // 'YYYY-MM'
  endDate?: string; // 'YYYY-MM', open-ended if omitted
  amount: number; // positive = income, negative = expense
  rateSchedule?: RateSchedule; // annual growth rate (compounding)
  isDebtLike?: boolean; // true = count in debt-service ratio (e.g. residence mortgage installment)
}

export interface Asset {
  type: 'Asset';
  id: string;
  currency: Currency;
  value: number; // current value at model start (2026-06)
  rateSchedule: RateSchedule;
  saleDate?: string; // 'YYYY-MM' — asset removed after this
}

export interface Liability {
  type: 'Liability';
  id: string;
  currency: Currency;
  outstandingBalance: number; // at model start (2026-06)
  monthlyPayment: number; // fixed monthly installment
  monthlyRate: number; // monthly interest rate, e.g. 0.02285 for ~27.4%/yr
}

export type Block = OneTimeCashflow | RecurringCashflow | Asset | Liability;

export type EventStatus = 'committed' | 'planning' | 'hypothetical';

export interface ScenarioEvent {
  id: string;
  name: string;
  enabled: boolean;
  status: EventStatus;
  blocks: Block[];
}

export interface Position {
  cashUSD: number;
  investedUSD: number; // pre-existing investment pool (usually 0 at start)
}

export type WeatherBand = 'stable' | 'gradual' | 'shock';

export const WEATHER_RATES: Record<WeatherBand, number> = {
  stable:  0.03,
  gradual: 0.08,
  shock:   0.20,
};

export interface Assumptions {
  modelStart: string; // 'YYYY-MM', e.g. '2026-06'
  egpUsdToday: number; // spot rate at modelStart, e.g. 52
  egpDevaluationRate: number; // annual, e.g. 0.08
  weatherBand: WeatherBand; // UI control — sets egpDevaluationRate
  surplusReturnRate: number; // annual USD return on invested surplus, e.g. 0.10
  swr: number; // safe withdrawal rate, e.g. 0.04
  retirementMonthlySpendEGP: number; // forward assumption for retirement lifestyle
  targetBandMin: number; // guardrail floor, e.g. 1_000_000 (USD)
  targetBandMax: number; // guardrail ceiling, e.g. 2_000_000 (USD)
  horizonMonths: number; // simulation horizon, e.g. 360 (30 years)
  birthDate: string; // 'YYYY-MM-DD', for age labels
}

export interface MonthPoint {
  month: string; // 'YYYY-MM'
  netWorthUSD: number;
  egpUsdRate: number;
  surplusUSD: number;
  retirementTargetUSD: number;
  // Composition breakdown
  cashUSD: number;
  egxUSD: number;
  goldUSD: number;
  houseUSD: number;
  debtUSD: number;
}

export interface ComfortPoint {
  month: string;
  debtServicePct: number; // debt payments / gross income %
  savingsRate: number; // surplus / gross income %
  liquidityMonths: number; // rough months of expenses covered by liquid pool
  livingExpensesPct: number; // base living-expenses block as % of income
  eventExpensesPct: number; // recurring event costs (kids etc) as % of income
}

export interface SimResult {
  netWorthPath: MonthPoint[];
  freedomDate: string | null; // computed 25x target hit
  freedomDateM1: string | null; // $1M guardrail
  freedomDateM2: string | null; // $2M guardrail
  monthsToFreedom: number | null;
  coastPoint: string | null; // earliest month contributions can stop
  comfortTimeline: ComfortPoint[]; // annual snapshots
  solvencyBreaks: string[]; // months where cash pool goes negative
  netWorthT0: number;
  surplusT0: number;
  debtServicePctT0: number;
}

export interface FundingOption {
  method: 'cash' | 'loan' | 'liquidate-egx';
  amountUSD: number;
  remainingCashUSD?: number; // after funding (for 'cash')
  egxRemainingUSD?: number; // after liquidation (for 'liquidate-egx')
  loanMonthlyPaymentEGP?: number; // for 'loan'
  loanTermMonths?: number;
  note: string;
  recommended?: boolean; // highest-ranked option
  burdenPct?: number; // monthly installment / monthly surplus × 100
  freedomDeltaMonths?: number; // retirement delay specific to this funding approach
  rationale?: string; // why this is recommended (or why not)
}

export interface AffordabilityReport {
  eventId: string;
  eventName: string;
  proposedDate: string;
  canAffordNow: 'yes' | 'tight' | 'no';
  fundingBreakdown: FundingOption[];
  recommendedMethod: 'cash' | 'loan' | 'liquidate-egx' | null;
  earliestAffordableDate: string | null;
  retirementDeltaMonths: number; // positive = retirement pushed out
  retirementDeltaAtEarliest: number | null;
  solvencyBreaksIfNow: string[];
  debtServicePctAfter: number;
  baselineFreedomDate: string | null;
  withEventFreedomDate: string | null;
  monthlySurplusUSD: number; // for burden % context in UI
}
