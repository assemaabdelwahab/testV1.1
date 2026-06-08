'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { simulate } from '@/lib/engine/engine';
import { attributeDeltas } from '@/lib/engine/attributeDeltas';
import { computeDelta } from '@/lib/scenario/types';
import { buildNarrative } from '@/lib/scenario/narrative';
import { loadScenarios, saveScenario, deleteScenario, duplicateScenario, MAX_SCENARIOS } from '@/lib/scenario/storage';
import type { ParallelScenario, ScenarioDelta } from '@/lib/scenario/types';
import type { SimResult, ScenarioEvent, Assumptions, EventStatus, Block, Position } from '@/lib/engine/types';

interface ParallelScenarioCtx {
  // Scenario list
  scenarios: ParallelScenario[];
  activeScenarioId: string | null;
  atMaxScenarios: boolean;

  // Active scenario derived state
  activeScenario: ParallelScenario | null;
  scenarioResult: SimResult | null;
  scenarioDelta: ScenarioDelta | null;
  scenarioNarrative: string | null;

  // Actions
  createScenario: (name: string, baseEvents: ScenarioEvent[], baseAssumptions: Assumptions) => ParallelScenario;
  loadScenario: (id: string) => void;
  exitComparison: () => void;
  deleteScenarioById: (id: string) => void;
  duplicateScenarioById: (id: string) => ParallelScenario | null;
  renameScenario: (id: string, name: string) => void;
  updateScenarioEvent: (eventId: string, patch: { enabled?: boolean; status?: EventStatus; blocks?: Block[] }) => void;
  updateScenarioAssumptions: (patch: Partial<Assumptions>) => void;
}

const Ctx = createContext<ParallelScenarioCtx | null>(null);

export function useParallelScenario(): ParallelScenarioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useParallelScenario must be used inside ParallelScenarioProvider');
  return ctx;
}

interface Props {
  children: React.ReactNode;
  baselineResult: SimResult;
  baselineEvents: ScenarioEvent[];
  baselineAssumptions: Assumptions;
  baselinePosition: Position;
}

export default function ParallelScenarioProvider({
  children,
  baselineResult,
  baselineEvents,
  baselineAssumptions,
  baselinePosition,
}: Props) {
  const [scenarios, setScenarios] = useState<ParallelScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setScenarios(loadScenarios());
  }, []);

  const activeScenario = useMemo(
    () => scenarios.find(s => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  const scenarioResult = useMemo(
    () => activeScenario
      ? simulate(activeScenario.events, baselinePosition, activeScenario.assumptions)
      : null,
    [activeScenario, baselinePosition],
  );

  const scenarioDelta = useMemo(() => {
    if (!scenarioResult || !activeScenario) return null;
    const impacts = attributeDeltas(activeScenario.events, baselinePosition, activeScenario.assumptions, scenarioResult);
    return computeDelta(baselineResult, scenarioResult, impacts);
  }, [scenarioResult, baselineResult, activeScenario, baselinePosition]);

  const scenarioNarrative = useMemo(() => {
    if (!activeScenario || !scenarioDelta) return null;
    return buildNarrative(activeScenario.name, scenarioDelta);
  }, [activeScenario, scenarioDelta]);

  const persistAndUpdate = useCallback((updated: ParallelScenario) => {
    saveScenario({ ...updated, updatedAt: new Date().toISOString() });
    setScenarios(loadScenarios());
  }, []);

  const createScenario = useCallback((
    name: string,
    baseEvents: ScenarioEvent[],
    baseAssumptions: Assumptions,
  ): ParallelScenario => {
    const scenario: ParallelScenario = {
      id: crypto.randomUUID(),
      name,
      events: baseEvents,
      assumptions: baseAssumptions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistAndUpdate(scenario);
    setActiveScenarioId(scenario.id);
    return scenario;
  }, [persistAndUpdate]);

  const loadScenario = useCallback((id: string) => setActiveScenarioId(id), []);
  const exitComparison = useCallback(() => setActiveScenarioId(null), []);

  const deleteScenarioById = useCallback((id: string) => {
    deleteScenario(id);
    setScenarios(loadScenarios());
    if (activeScenarioId === id) setActiveScenarioId(null);
  }, [activeScenarioId]);

  const duplicateScenarioById = useCallback((id: string): ParallelScenario | null => {
    const copy = duplicateScenario(id);
    setScenarios(loadScenarios());
    return copy;
  }, []);

  const renameScenario = useCallback((id: string, name: string) => {
    const s = scenarios.find(x => x.id === id);
    if (!s) return;
    persistAndUpdate({ ...s, name });
  }, [scenarios, persistAndUpdate]);

  const updateScenarioEvent = useCallback((
    eventId: string,
    patch: { enabled?: boolean; status?: EventStatus; blocks?: Block[] },
  ) => {
    if (!activeScenario) return;
    const updated: ParallelScenario = {
      ...activeScenario,
      events: activeScenario.events.map(e =>
        e.id === eventId ? { ...e, ...patch } : e,
      ),
    };
    persistAndUpdate(updated);
  }, [activeScenario, persistAndUpdate]);

  const updateScenarioAssumptions = useCallback((patch: Partial<Assumptions>) => {
    if (!activeScenario) return;
    persistAndUpdate({ ...activeScenario, assumptions: { ...activeScenario.assumptions, ...patch } });
  }, [activeScenario, persistAndUpdate]);

  return (
    <Ctx.Provider value={{
      scenarios,
      activeScenarioId,
      atMaxScenarios: scenarios.length >= MAX_SCENARIOS,
      activeScenario,
      scenarioResult,
      scenarioDelta,
      scenarioNarrative,
      createScenario,
      loadScenario,
      exitComparison,
      deleteScenarioById,
      duplicateScenarioById,
      renameScenario,
      updateScenarioEvent,
      updateScenarioAssumptions,
    }}>
      {children}
    </Ctx.Provider>
  );
}
