import { formatDate } from '../../lib/date';

/** Indian digit grouping (12,50,000) implemented manually; Hermes Intl locale support is unreliable. */
export function groupIndian(n: number): string {
  const s = Math.round(Math.abs(n)).toString();
  const sign = n < 0 ? '-' : '';
  if (s.length <= 3) return sign + s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${sign}${parts.join(',')},${last3}`;
}

export function formatINR(n: number): string {
  return `₹${groupIndian(n)}`;
}

/** Compact lakh format, e.g. 531000 -> ₹5.31L */
export function formatINRCompact(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return formatINR(n);
}

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
export function formatHeroDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${formatDate(d)}`;
}
