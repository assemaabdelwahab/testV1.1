/** Integer years old at a given ISO month (YYYY-MM). */
export function ageAt(monthISO: string, birthDate: string): number {
  const [by, bm] = birthDate.split('-').map(Number);
  const [y, m] = monthISO.split('-').map(Number);
  return y - by - (m < bm ? 1 : 0);
}

/** "free · age 36" string for a given month and birthDate. */
export function ageLabel(monthISO: string, birthDate: string): string {
  return `age ${ageAt(monthISO, birthDate)}`;
}
