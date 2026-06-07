import type { ScenarioEvent, Assumptions, SimResult } from '@/lib/engine/types';
import type { EventImpact } from '@/lib/engine/attributeDeltas';

export interface ParallelScenario {
  id: string;
  name: string;
  events: ScenarioEvent[];
  assumptions: Assumptions;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioDelta {
  freedomDeltaMonths: number | null; // positive = scenario is later, negative = earlier
  baselineFreedomDate: string | null;
  scenarioFreedomDate: string | null;
  solvencyBreaks: string[];
  eventImpacts: EventImpact[];
  comfortOverrunMonths: number; // months where debtServicePct > 40 in scenario
}

export function computeDelta(
  baseline: SimResult,
  scenario: SimResult,
  eventImpacts: EventImpact[],
): ScenarioDelta {
  const freedomDeltaMonths =
    baseline.monthsToFreedom !== null && scenario.monthsToFreedom !== null
      ? scenario.monthsToFreedom - baseline.monthsToFreedom
      : null;

  const comfortOverrunMonths = scenario.comfortTimeline.filter(
    pt => pt.debtServicePct > 40,
  ).length;

  return {
    freedomDeltaMonths,
    baselineFreedomDate: baseline.freedomDate,
    scenarioFreedomDate: scenario.freedomDate,
    solvencyBreaks: scenario.solvencyBreaks,
    eventImpacts,
    comfortOverrunMonths,
  };
}
