'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { simulate } from '@/lib/engine/engine';
import { canAfford } from '@/lib/engine/affordability';
import { EVENTS, POSITION, ASSUMPTIONS } from '@/lib/engine/scenarios';
import { WEATHER_RATES } from '@/lib/engine/types';
import { supabase } from '@/lib/supabase';
import type { ScenarioEvent, Assumptions, SimResult, AffordabilityReport, WeatherBand, EventStatus, Position, Block } from '@/lib/engine/types';

const STORAGE_KEY = 'scenario:v5';

interface StoredState {
  enabledEvents: Record<string, boolean>;
  eventStatuses: Record<string, EventStatus>;
  assumptions: Partial<Assumptions>;
}

interface ScenarioCtx {
  events: ScenarioEvent[];
  toggleEvent: (id: string, enabled: boolean) => void;
  updateEventStatus: (id: string, status: EventStatus) => void;
  updateEventDate: (id: string, newDate: string) => void;
  updateEventBlock: (eventId: string, blockId: string, patch: Partial<Block>) => void;
  assumptions: Assumptions;
  updateAssumptions: (patch: Partial<Assumptions>) => void;
  setWeather: (band: WeatherBand) => void;
  result: SimResult;
  getAffordability: (eventId: string) => AffordabilityReport | null;
  position: Position;
  updatePosition: (patch: Partial<PositionUpdate>) => Promise<void>;
  positionUpdatedAt: string | null;
}

export interface PositionUpdate {
  cashUSD: number;
  egxEGP: number;
  goldGrams: number;
  secondHouseEGP: number;
  notes: string;
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
  const [position, setPosition] = useState<Position>(POSITION);
  const [positionUpdatedAt, setPositionUpdatedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load position from Supabase on mount
  useEffect(() => {
    supabase
      .from('scenario_position')
      .select('*')
      .eq('user_id', 'assem')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPosition({
            cashUSD: data.cash_usd ?? POSITION.cashUSD,
            investedUSD: 0,
          });
          setPositionUpdatedAt(data.updated_at ?? null);
        }
      });
  }, []);

  // Hydrate event statuses + assumptions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StoredState = JSON.parse(raw);
        setEvents(prev =>
          prev.map(e => {
            const status = (stored.eventStatuses?.[e.id] ?? e.status) as EventStatus;
            const enabled = status !== 'hypothetical';
            return { ...e, status, enabled };
          })
        );
        if (stored.assumptions) {
          setAssumptions(prev => ({ ...prev, ...stored.assumptions }));
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist events + assumptions to localStorage
  useEffect(() => {
    if (!hydrated) return;
    const stored: StoredState = {
      enabledEvents: Object.fromEntries(events.map(e => [e.id, e.enabled])),
      eventStatuses: Object.fromEntries(events.map(e => [e.id, e.status])),
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

  // Re-simulate whenever events, assumptions, or position changes
  const result = useMemo(
    () => simulate(events, position, assumptions),
    [events, assumptions, position]
  );

  // Affordability cache — lazily computed per event id, cleared on state change
  const affordCache = useRef<Map<string, AffordabilityReport>>(new Map());
  const getAffordability = useCallback(
    (eventId: string): AffordabilityReport | null => {
      const event = events.find(e => e.id === eventId);
      if (!event || event.id === 'base') return null;
      if (!affordCache.current.has(eventId)) {
        const report = canAfford(event, events, position, assumptions);
        affordCache.current.set(eventId, report);
      }
      return affordCache.current.get(eventId)!;
    },
    [events, assumptions, position]
  );

  useEffect(() => { affordCache.current.clear(); }, [events, assumptions, position]);

  // updatePosition — upserts to Supabase, then updates local state
  const updatePosition = useCallback(async (patch: Partial<PositionUpdate>) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('scenario_position')
      .upsert({
        user_id: 'assem',
        updated_at: now,
        cash_usd: patch.cashUSD ?? position.cashUSD,
        egx_egp: patch.egxEGP,
        gold_grams: patch.goldGrams,
        second_house_egp: patch.secondHouseEGP,
        notes: patch.notes ?? '',
      }, { onConflict: 'user_id' });

    if (!error) {
      setPosition(prev => ({
        ...prev,
        cashUSD: patch.cashUSD ?? prev.cashUSD,
      }));
      setPositionUpdatedAt(now);
    }
  }, [position]);

  const toggleEvent = useCallback((id: string, enabled: boolean) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, enabled } : e));
  }, []);

  const updateEventStatus = useCallback((id: string, status: EventStatus) => {
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, status, enabled: status !== 'hypothetical' } : e
    ));
  }, []);

  const updateEventBlock = useCallback((eventId: string, blockId: string, patch: Partial<Block>) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        blocks: e.blocks.map(b => b.id === blockId ? { ...b, ...patch } as Block : b),
      };
    }));
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
    <Ctx.Provider value={{
      events, toggleEvent, updateEventStatus, updateEventDate, updateEventBlock,
      assumptions, updateAssumptions, setWeather,
      result, getAffordability,
      position, updatePosition, positionUpdatedAt,
    }}>
      {children}
    </Ctx.Provider>
  );
}
