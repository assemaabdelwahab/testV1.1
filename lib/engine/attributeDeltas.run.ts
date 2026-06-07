import { simulate } from './engine';
import { attributeDeltas } from './attributeDeltas';
import { EVENTS, POSITION, ASSUMPTIONS } from './scenarios';

const baseline = simulate(EVENTS, POSITION, ASSUMPTIONS);
console.log('Baseline freedom date:', baseline.freedomDate, `(${baseline.monthsToFreedom} months)`);

const impacts = attributeDeltas(EVENTS, POSITION, ASSUMPTIONS, baseline);
console.log('\nEvent attribution:');
for (const imp of impacts) {
  const direction = imp.freedomDeltaMonths >= 0 ? '+' : '';
  console.log(
    `  ${imp.eventName}: ${direction}${imp.freedomDeltaMonths} months (${imp.pctOfTotalDelta}% of total delay)`,
  );
}
