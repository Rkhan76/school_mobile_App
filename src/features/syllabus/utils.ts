export { formatDate } from '../../lib/date';

/** `daysRemaining` comes straight from the backend — negative means already held. */
export function examStatusLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return 'Completed';
  if (daysRemaining === 0) return 'Today';
  return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`;
}
