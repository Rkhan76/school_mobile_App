const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats an ISO date (`yyyy-mm-dd` or full ISO) as `dd Mon yyyy`. */
export function formatDate(iso: string): string {
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

/** `daysRemaining` comes straight from the backend — negative means already held. */
export function examStatusLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return 'Completed';
  if (daysRemaining === 0) return 'Today';
  return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`;
}
