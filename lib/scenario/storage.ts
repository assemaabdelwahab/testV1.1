import type { ParallelScenario } from './types';

const STORAGE_KEY = 'scenarios:v1';
const MAX_SCENARIOS = 10;

export function loadScenarios(): ParallelScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ParallelScenario[]) : [];
  } catch {
    return [];
  }
}

export function saveScenario(scenario: ParallelScenario): void {
  const scenarios = loadScenarios();
  const idx = scenarios.findIndex(s => s.id === scenario.id);
  if (idx >= 0) {
    scenarios[idx] = scenario;
  } else {
    if (scenarios.length >= MAX_SCENARIOS) return;
    scenarios.push(scenario);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function deleteScenario(id: string): void {
  const scenarios = loadScenarios().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function duplicateScenario(id: string): ParallelScenario | null {
  const scenarios = loadScenarios();
  const original = scenarios.find(s => s.id === id);
  if (!original) return null;
  const copy: ParallelScenario = {
    ...original,
    id: crypto.randomUUID(),
    name: `Copy of ${original.name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveScenario(copy);
  return copy;
}

export { MAX_SCENARIOS };
