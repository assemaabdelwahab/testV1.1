#!/usr/bin/env ts-node
import { simulate, addMonths } from './engine';
import { canAfford } from './affordability';
import { EVENTS, POSITION, ASSUMPTIONS } from './scenarios';

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtUSD(n: number): string { return `$${fmt(Math.round(n))}`; }
function fmtPct(n: number): string { return `${fmt(n, 1)}%`; }

// ── Run baseline simulation ────────────────────────────────────────────────────

const result = simulate(EVENTS, POSITION, ASSUMPTIONS);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  SCENARIO MODELER — BASELINE (2026-06)');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('── POSITION AT T=0 ──────────────────────────────────────');
console.log(`  Net worth today:     ${fmtUSD(result.netWorthT0)}`);
console.log(`  Monthly surplus:     ${fmtUSD(result.surplusT0)}`);
console.log(`  Debt-service ratio:  ${fmtPct(result.debtServicePctT0)}`);
console.log('');

console.log('── FREEDOM DATES ────────────────────────────────────────');
console.log(`  Computed target (25× spend): ${result.freedomDate ?? 'not reached'} ${result.monthsToFreedom != null ? `(${Math.floor(result.monthsToFreedom / 12)}y ${result.monthsToFreedom % 12}m)` : ''}`);
console.log(`  $1M guardrail:               ${result.freedomDateM1 ?? 'not reached'}`);
console.log(`  $2M guardrail:               ${result.freedomDateM2 ?? 'not reached'}`);
console.log(`  Coast point:                 ${result.coastPoint ?? 'not reached'}`);
if (result.solvencyBreaks.length > 0) {
  console.log(`  ⚠ Solvency breaks:          ${result.solvencyBreaks.slice(0, 5).join(', ')}${result.solvencyBreaks.length > 5 ? '...' : ''}`);
} else {
  console.log('  ✓ No solvency breaks in baseline');
}
console.log('');

console.log('── COMFORT TIMELINE (annual, % of income) ───────────────');
console.log('  Year       Debt-svc  Savings   Liquidity');
for (const pt of result.comfortTimeline) {
  const liq = pt.liquidityMonths >= 99 ? '99+ mo' : `${fmt(pt.liquidityMonths, 1)} mo`;
  const debtFlag = pt.debtServicePct > 45 ? ' ●RED' : pt.debtServicePct > 35 ? ' ◑AMBER' : '';
  console.log(`  ${pt.month}    ${fmtPct(pt.debtServicePct).padStart(7)}${debtFlag.padEnd(7)}  ${fmtPct(pt.savingsRate).padStart(7)}   ${liq}`);
}
console.log('');

// ── Net worth milestones ───────────────────────────────────────────────────────

console.log('── NET WORTH TRAJECTORY (every 3 years) ────────────────');
console.log('  Year       Net Worth     Target        EGP/USD');
for (let t = 0; t < result.netWorthPath.length; t += 36) {
  const pt = result.netWorthPath[t];
  console.log(`  ${pt.month}    ${fmtUSD(pt.netWorthUSD).padStart(12)}  ${fmtUSD(pt.retirementTargetUSD).padStart(12)}  ${fmt(pt.egpUsdRate, 0)}`);
}
console.log('');

// ── Affordability checks for all non-base events ──────────────────────────────

const nonBaseEvents = EVENTS.filter(e => e.id !== 'base');

if (nonBaseEvents.length > 0) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  AFFORDABILITY ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const event of nonBaseEvents) {
    const report = canAfford(event, EVENTS, POSITION, ASSUMPTIONS);

    const verdict = report.canAffordNow === 'yes' ? '✓ YES'
      : report.canAffordNow === 'tight' ? '◑ TIGHT'
      : '✗ NO';

    console.log(`── ${event.name.toUpperCase()} ──────────────────────────────────`);
    console.log(`  Proposed date:       ${report.proposedDate}`);
    console.log(`  Can afford now:      ${verdict}`);
    if (report.solvencyBreaksIfNow.length > 0) {
      console.log(`  ⚠ Solvency breaks:   ${report.solvencyBreaksIfNow.slice(0, 3).join(', ')}`);
    }
    console.log(`  Earliest affordable: ${report.earliestAffordableDate ?? 'never within 10yr'}`);
    console.log(`  Debt-service after:  ${fmtPct(report.debtServicePctAfter)}`);
    console.log('');
    console.log('  Funding options:');
    for (const opt of report.fundingBreakdown) {
      console.log(`    [${opt.method.padEnd(14)}] ${opt.note}`);
    }
    console.log('');
    console.log('  Retirement impact:');
    console.log(`    Baseline freedom:  ${report.baselineFreedomDate ?? 'not reached'}`);
    console.log(`    With event:        ${report.withEventFreedomDate ?? 'not reached'}`);
    const delta = report.retirementDeltaMonths;
    const deltaStr = delta === 0 ? 'no change'
      : delta > 0 ? `+${Math.floor(delta / 12)}y ${delta % 12}m (pushed out)`
      : `-${Math.floor(-delta / 12)}y ${(-delta) % 12}m (pulled in)`;
    console.log(`    Delta at ${report.proposedDate}: ${deltaStr}`);
    if (report.retirementDeltaAtEarliest != null && report.earliestAffordableDate !== report.proposedDate) {
      const d2 = report.retirementDeltaAtEarliest;
      const d2Str = d2 === 0 ? 'no change'
        : d2 > 0 ? `+${Math.floor(d2 / 12)}y ${d2 % 12}m`
        : `-${Math.floor(-d2 / 12)}y ${(-d2) % 12}m`;
      console.log(`    Delta at earliest: ${d2Str}`);
    }
    console.log('');
  }
}
