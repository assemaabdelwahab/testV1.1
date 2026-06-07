import { simulate } from './engine';
import type { ScenarioEvent, Position, Assumptions, SimResult } from './types';

export interface EventImpact {
  eventId: string;
  eventName: string;
  freedomDeltaMonths: number; // positive = this event delays freedom
  pctOfTotalDelta: number;    // share of total delay from all events
}

/**
 * Runs N+1 simulations to attribute how much of the freedom delay
 * each enabled non-base event contributes.
 * Returns [] if baseline has no freedom date.
 */
export function attributeDeltas(
  events: ScenarioEvent[],
  position: Position,
  assumptions: Assumptions,
  baselineResult: SimResult,
): EventImpact[] {
  if (baselineResult.monthsToFreedom === null) return [];

  const nonBaseEnabled = events.filter(e => e.id !== 'base' && e.enabled);
  if (nonBaseEnabled.length === 0) return [];

  const baselineMonths = baselineResult.monthsToFreedom;

  const impacts: EventImpact[] = nonBaseEnabled.map(evt => {
    const withoutEvent = events.map(e =>
      e.id === evt.id ? { ...e, enabled: false } : e,
    );
    const result = simulate(withoutEvent, position, assumptions);
    const withoutMonths = result.monthsToFreedom ?? baselineMonths;
    const delta = baselineMonths - withoutMonths; // positive = this event costs months
    return { eventId: evt.id, eventName: evt.name, freedomDeltaMonths: delta, pctOfTotalDelta: 0 };
  });

  const totalAbsDelta = impacts.reduce((s, x) => s + Math.abs(x.freedomDeltaMonths), 0);
  return impacts.map(imp => ({
    ...imp,
    pctOfTotalDelta: totalAbsDelta > 0
      ? Math.round((Math.abs(imp.freedomDeltaMonths) / totalAbsDelta) * 100)
      : 0,
  }));
}
