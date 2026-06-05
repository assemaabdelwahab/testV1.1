import type { ScenarioEvent, Position, Assumptions } from './types';

// ── Baseline position (2026-06-03) ────────────────────────────────────────────

export const POSITION: Position = {
  cashUSD: 2_000,
  investedUSD: 0,
};

export const ASSUMPTIONS: Assumptions = {
  modelStart: '2026-06',
  egpUsdToday: 52,
  egpDevaluationRate: 0.08,
  weatherBand: 'gradual',
  surplusReturnRate: 0.00, // surplus held as USD cash, not invested
  swr: 0.04,
  retirementMonthlySpendEGP: 234_000, // $4,500/mo USD × 52 EGP/USD
  targetBandMin: 1_000_000,
  targetBandMax: 2_000_000,
  horizonMonths: 360,
  birthDate: '1995-05-01',
};

// ── Scenario events ────────────────────────────────────────────────────────────

export const EVENTS: ScenarioEvent[] = [
  {
    id: 'base',
    name: 'Base (always on)',
    enabled: true,
    status: 'committed' as const,
    blocks: [
      // ── Assets ──
      {
        type: 'Asset',
        id: 'egx-stocks',
        currency: 'EGP',
        value: 460_000,
        rateSchedule: [{ effectiveFrom: '2026-06', rate: 0.20 }],
      },
      {
        type: 'Asset',
        id: 'gold',
        currency: 'USD',
        value: 6_578, // 46g × $143/g (24k assumed)
        rateSchedule: [{ effectiveFrom: '2026-06', rate: 0.08 }],
      },
      {
        type: 'Asset',
        id: 'house-2nd',
        currency: 'EGP',
        value: 1_500_000,
        rateSchedule: [{ effectiveFrom: '2026-06', rate: 0.12 }],
      },

      // ── Liabilities ──
      {
        // 1,015,000 EGP loan opened 2025-06, 60-month term, 31,131.99/mo
        // After 12 payments → outstanding ~906,000 EGP
        // Implied monthly rate ~2.285% (~27.4%/yr)
        type: 'Liability',
        id: 'mortgage-2nd-house',
        currency: 'EGP',
        outstandingBalance: 906_000,
        monthlyPayment: 31_131.99,
        monthlyRate: 0.02285,
      },

      // ── Income ──
      {
        type: 'RecurringCashflow',
        id: 'salary',
        currency: 'USD',
        startDate: '2026-06',
        amount: 5_500,
        rateSchedule: [{ effectiveFrom: '2026-06', rate: 0.07 }],
      },

      // ── Expenses ──
      // True non-debt spend (avg Oct'25–May'26 minus mortgage installments):
      // 139,650 total avg − 31,132 (2nd house mortgage) − 10,333 (residence mortgage) ≈ 98,185 EGP/mo
      {
        type: 'RecurringCashflow',
        id: 'living-expenses',
        currency: 'EGP',
        startDate: '2026-06',
        amount: -98_185,
        rateSchedule: [{ effectiveFrom: '2026-06', rate: 0.08 }],
      },
      // Residence mortgage: 31K EGP/quarter = ~10,333/mo flat until 2030-04
      // isDebtLike = true so the comfort layer counts it in debt-service ratio.
      {
        type: 'RecurringCashflow',
        id: 'residence-mortgage',
        currency: 'EGP',
        startDate: '2026-06',
        endDate: '2030-04',
        amount: -10_333,
        isDebtLike: true,
      },
    ],
  },

  {
    id: 'apartment-finishing',
    name: 'Apartment finishing',
    enabled: true,
    status: 'committed' as const,
    blocks: [
      {
        type: 'OneTimeCashflow',
        id: 'apartment-finishing-cost',
        currency: 'EGP',
        date: '2026-09',       // ASAP — adjust via EventCard date picker
        amount: -650_000,      // midpoint of 600–700K range
      },
    ],
  },

  {
    id: 'marriage',
    name: 'Marriage (~Dec 2027)',
    enabled: true,
    status: 'planning' as const,
    blocks: [
      {
        type: 'OneTimeCashflow',
        id: 'marriage-cost',
        currency: 'EGP',
        date: '2027-12',
        amount: -1_000_000,
      },
    ],
  },

  {
    id: 'car-purchase',
    name: 'Car purchase',
    enabled: false,
    status: 'hypothetical' as const,
    blocks: [
      {
        type: 'OneTimeCashflow',
        id: 'car-purchase-cost',
        currency: 'EGP',
        date: '2028-06',       // placeholder — check earliest affordable date
        amount: -1_500_000,
      },
    ],
  },

  {
    id: 'kid-1',
    name: 'First child',
    enabled: false,
    status: 'hypothetical' as const,
    blocks: [
      {
        type: 'RecurringCashflow',
        id: 'kid-1-cost',
        currency: 'EGP',
        startDate: '2029-06',  // ~3 years from now
        amount: -25_000,
        rateSchedule: [{ effectiveFrom: '2029-06', rate: 0.08 }],
      },
    ],
  },

  {
    id: 'kid-2',
    name: 'Second child',
    enabled: false,
    status: 'hypothetical' as const,
    blocks: [
      {
        type: 'RecurringCashflow',
        id: 'kid-2-cost',
        currency: 'EGP',
        startDate: '2031-06',  // ~5 years from now
        amount: -25_000,
        rateSchedule: [{ effectiveFrom: '2031-06', rate: 0.08 }],
      },
    ],
  },
];
