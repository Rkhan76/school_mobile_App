/** Fixed grade scheme: the integer sent to the backend as gradeOrder, plus its label. */
export const GRADE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Nursery' },
  { value: 1, label: 'LKG' },
  { value: 2, label: 'UKG' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: i + 3, label: `Class ${i + 1}` })),
];

export function gradeLabel(value: number): string {
  return GRADE_OPTIONS.find((g) => g.value === value)?.label ?? String(value);
}
