import type { ScenarioDelta } from './types';
import { fmtMonth } from '@/lib/format';

function pluralMonths(n: number): string {
  const abs = Math.abs(n);
  return `${abs} month${abs === 1 ? '' : 's'}`;
}

/**
 * Produces a 3–5 sentence deterministic narrative from simulation deltas.
 * No LLM calls. Template-driven with ~12 conditional branches.
 */
export function buildNarrative(
  scenarioName: string,
  delta: ScenarioDelta,
): string {
  const sentences: string[] = [];

  // ── Sentence 1: headline ──────────────────────────────────────────────────
  if (delta.scenarioFreedomDate === null) {
    sentences.push(
      `"${scenarioName}" does not reach a freedom date within the 30-year horizon — the plan is financially broken.`,
    );
  } else if (delta.freedomDeltaMonths === null) {
    sentences.push(
      `Your baseline has no computed freedom date, so the delta can't be compared — but "${scenarioName}" reaches freedom in ${fmtMonth(delta.scenarioFreedomDate)}.`,
    );
  } else if (delta.freedomDeltaMonths === 0) {
    sentences.push(
      `"${scenarioName}" reaches freedom on the same date as your baseline (${fmtMonth(delta.scenarioFreedomDate)}) — no material change.`,
    );
  } else if (delta.freedomDeltaMonths > 0) {
    sentences.push(
      `In "${scenarioName}", retirement arrives in ${fmtMonth(delta.scenarioFreedomDate)} — ${pluralMonths(delta.freedomDeltaMonths)} later than your current plan.`,
    );
  } else {
    sentences.push(
      `"${scenarioName}" accelerates retirement to ${fmtMonth(delta.scenarioFreedomDate)} — ${pluralMonths(delta.freedomDeltaMonths)} earlier than your current plan.`,
    );
  }

  // ── Sentence 2: top event drivers ─────────────────────────────────────────
  const topImpacts = delta.eventImpacts
    .filter(e => Math.abs(e.freedomDeltaMonths) >= 1)
    .sort((a, b) => Math.abs(b.freedomDeltaMonths) - Math.abs(a.freedomDeltaMonths))
    .slice(0, 2);

  if (topImpacts.length > 0 && delta.freedomDeltaMonths !== null && delta.freedomDeltaMonths !== 0) {
    const parts = topImpacts.map(
      e =>
        `${e.eventName} (${e.freedomDeltaMonths > 0 ? '+' : ''}${e.freedomDeltaMonths}mo, ${e.pctOfTotalDelta}% of total drag)`,
    );
    sentences.push(`The main drivers: ${parts.join(' and ')}.`);
  }

  // ── Sentence 3: solvency ──────────────────────────────────────────────────
  if (delta.solvencyBreaks.length > 0) {
    const first = fmtMonth(delta.solvencyBreaks[0]);
    if (delta.solvencyBreaks.length === 1) {
      sentences.push(`Warning: the plan goes cash-negative in ${first} — consider delaying the most expensive event or adding a 6-month buffer.`);
    } else {
      sentences.push(`Warning: the plan breaks solvency in ${delta.solvencyBreaks.length} months (first: ${first}) — significant cash-flow gaps exist that need restructuring.`);
    }
  } else if (delta.scenarioFreedomDate !== null) {
    sentences.push(`Solvency holds throughout — no months go cash-negative.`);
  }

  // ── Sentence 4: comfort overrun ───────────────────────────────────────────
  if (delta.comfortOverrunMonths > 24) {
    sentences.push(`Debt-service exceeds 40% of income for ${delta.comfortOverrunMonths} months — a sustained squeeze worth reviewing in the Comfort chart.`);
  } else if (delta.comfortOverrunMonths > 0) {
    sentences.push(`There are ${delta.comfortOverrunMonths} months where debt-service crests 40% of income — tight but manageable.`);
  }

  return sentences.join(' ');
}
