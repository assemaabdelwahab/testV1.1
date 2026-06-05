'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { simulate } from '@/lib/engine/engine';
import { canAfford } from '@/lib/engine/affordability';
import { EVENTS, POSITION, ASSUMPTIONS } from '@/lib/engine/scenarios';
import { WEATHER_RATES } from '@/lib/engine/types';
import type { ScenarioEvent, Assumptions, SimResult, AffordabilityReport, WeatherBand } from '@/lib/engine/types';

const STORAGE_KEY = 'scenario:v4';

interface StoredState {
  enabledEvents: Record<string, boolean>;
  assumptions: Partial<Assumptions>;
}

interface ScenarioCtx {
  events: ScenarioEvent[];
  toggleEvent: (id: string, enabled: boolean) => void;
  updateEventDate: (id: string, newDate: string) => void;
  assumptions: Assumptions;
  updateAssumptions: (patch: Partial<Assumptions>) => void;
  setWeather: (band: WeatherBand) => void;
  result: SimResult;
  getAffordability: (eventId: string) => AffordabilityReport | null;
}

const Ctx = createContext<ScenarioCtx | null>(null);

export function useScenario(): ScenarioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useScenario must be used inside ScenarioProvider');
  return ctx;
}

export default function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<ScenarioEvent[]>(EVENTS);
  const [assumptions, setAssumptions] = useState<Assumptions>(ASSUMPTIONS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StoredState = JSON.parse(raw);
        setEvents(prev =>
          prev.map(e => ({
            ...e,
            enabled: stored.enabledEvents?.[e.id] ?? e.enabled,
          }))
        );
        if (stored.assumptions) {
          setAssumptions(prev => ({ ...prev, ...stored.assumptions }));
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    const stored: StoredState = {
      enabledEvents: Object.fromEntries(events.map(e => [e.id, e.enabled])),
      assumptions: {
        retirementMonthlySpendEGP: assumptions.retirementMonthlySpendEGP,
        egpDevaluationRate: assumptions.egpDevaluationRate,
        weatherBand: assumptions.weatherBand,
        surplusReturnRate: assumptions.surplusReturnRate,
        birthDate: assumptions.birthDate,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [events, assumptions, hydrated]);

  // Re-simulate on every change (pure function, <10ms)
  const result = useMemo(
    () => simulate(events, POSITION, assumptions),
    [events, assumptions]
  );

  // Affordability cache — computed lazily per event id
  const affordCache = useRef<Map<string, AffordabilityReport>>(new Map());
  const getAffordability = useCallback(
    (eventId: string): AffordabilityReport | null => {
      const event = events.find(e => e.id === eventId);
      if (!event || event.id === 'base') return null;
      if (!affordCache.current.has(eventId)) {
        const report = canAfford(event, events, POSITION, assumptions);
        affordCache.current.set(eventId, report);
      }
      return affordCache.current.get(eventId)!;
    },
    [events, assumptions]
  );

  // Invalidate affordability cache whenever events or assumptions change
  useEffect(() => { affordCache.current.clear(); }, [events, assumptions]);

  const toggleEvent = useCallback((id: string, enabled: boolean) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, enabled } : e));
  }, []);

  const updateEventDate = useCallback((id: string, newDate: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      return {
        ...e,
        blocks: e.blocks.map(b => {
          if (b.type === 'OneTimeCashflow') return { ...b, date: newDate };
          if (b.type === 'RecurringCashflow') return { ...b, startDate: newDate };
          return b;
        }),
      };
    }));
  }, []);

  const updateAssumptions = useCallback((patch: Partial<Assumptions>) => {
    setAssumptions(prev => ({ ...prev, ...patch }));
  }, []);

  const setWeather = useCallback((band: WeatherBand) => {
    setAssumptions(prev => ({
      ...prev,
      weatherBand: band,
      egpDevaluationRate: WEATHER_RATES[band],
    }));
  }, []);

  return (
    <Ctx.Provider value={{ events, toggleEvent, updateEventDate, assumptions, updateAssumptions, setWeather, result, getAffordability }}>
      {children}
    </Ctx.Provider>
  );
}
