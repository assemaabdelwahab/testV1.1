/** "5y 4m" from a raw month count. */
export function fmtDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}m`;
  if (m === 0) return `${y}y`;
  return `${y}y ${m}m`;
}

/** "$461k" / "$1.2M" abbreviated USD. */
export function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

/** Full "$461,538" with commas. */
export function fmtUSDFull(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

/** "Oct 2031" from "2031-10". */
export function fmtMonth(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  const name = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
  return `${name} ${y}`;
}

/** "+2mo" / "+1y 3m" retirement delta chip text. */
export function fmtDelta(months: number): string {
  if (months === 0) return 'no change';
  const sign = months > 0 ? '+' : '−';
  return `${sign}${fmtDuration(Math.abs(months))}`;
}
