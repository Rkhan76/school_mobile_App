import { useEffect, useState } from 'react';

export type Decision = 'promote' | 'repeat' | 'skip' | 'graduate' | 'transfer' | 'withdraw';
export type PromoteOutcome = 'promoted' | 'failed' | 'graduated' | 'transferred' | 'withdrawn' | 'repeated';

export interface PromoteItem {
  studentId: string;
  outcome: PromoteOutcome;
  targetClassId?: string;
  reason?: string;
}

export interface Option { value: string; label: string }

export interface PromotionStudent {
  id: string;
  name: string;
  admissionNo: string;
  roll: number;
  section: string;
}

export interface PromotionRow {
  decision: Decision;
  targetClassId?: string;
  reason?: string;
}

export interface PromotionFailure { studentId: string; error: string }
export interface PromotionResult { succeeded: number; failed: PromotionFailure[] }

/** Mock permission flag; the real value comes from the user's permissions later. */
export const CAN_SKIP_CLASS = true;
export const CHUNK_SIZE = 50;

export const FROM_YEARS: Option[] = [
  { value: '2025-2026', label: '2025-2026' },
  { value: '2026-2027', label: '2026-2027' },
];
export const TO_YEARS: Option[] = [
  { value: '2027-2028', label: '2027-2028' },
  { value: '2028-2029', label: '2028-2029' },
];
export const CLASSES: Option[] = Array.from({ length: 12 }, (_, i) => ({ value: `c${i + 1}`, label: `Class ${i + 1}` }));
export const SECTIONS: Option[] = ['A', 'B', 'C'].map((s) => ({ value: s, label: s }));

export const DECISIONS: { value: Decision; label: string }[] = [
  { value: 'promote', label: 'Promote' },
  { value: 'repeat', label: 'Repeat (detained)' },
  { value: 'skip', label: 'Skip class' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'withdraw', label: 'Withdraw' },
];

export const needsTarget = (d: Decision): boolean => d === 'promote' || d === 'repeat' || d === 'skip';

const classNo = (id: string): number => Number(id.replace('c', ''));
const classIdAt = (n: number): string | undefined => (n >= 1 && n <= 12 ? `c${n}` : undefined);

/** Default target class for a decision, given the student's current class. */
export function defaultTarget(decision: Decision, classId: string): string | undefined {
  const n = classNo(classId);
  if (decision === 'promote') return classIdAt(n + 1) ?? classId;
  if (decision === 'skip') return classIdAt(n + 2) ?? classIdAt(n + 1) ?? classId;
  if (decision === 'repeat') return classId;
  return undefined;
}

export function initialRow(classId: string): PromotionRow {
  return { decision: 'promote', targetClassId: defaultTarget('promote', classId) };
}

const NAMES: [string, number][] = [
  ['Anika Nair', 126], ['Avni Rao', 129], ['Kiara Sharma', 125], ['Laksh Nair', 130], ['Mahi Reddy', 128],
  ['Siya Sharma', 124], ['Siya Singh', 123], ['Test Student', 1], ['Veer Gupta', 127], ['Veer Singh', 122], ['Zara Nair', 121],
];
const ROLLS = [7, 10, 6, 11, 9, 5, 4, 1, 8, 3, 2];

function buildStudents(classId: string, sectionId: string): PromotionStudent[] {
  const n = classNo(classId);
  const count = n === 10 && sectionId === 'A' ? 11 : 5 + ((n + sectionId.charCodeAt(0)) % 6);
  return NAMES.slice(0, count).map(([name, no], i) => ({
    id: `${classId}-${sectionId}-s${i}`,
    name,
    admissionNo: name === 'Test Student' ? 'TEST-STU-0001' : `ADM-2026-0${no}`,
    roll: ROLLS[i],
    section: sectionId,
  }));
}

export function usePromotionStudents(classId?: string, sectionId?: string) {
  const [state, setState] = useState<{ key: string; students: PromotionStudent[] } | null>(null);
  const key = classId && sectionId ? `${classId}|${sectionId}` : '';

  useEffect(() => {
    if (!classId || !sectionId) return;
    const t = setTimeout(() => setState({ key, students: buildStudents(classId, sectionId) }), 700);
    return () => clearTimeout(t);
  }, [classId, sectionId, key]);

  const ready = key !== '' && state?.key === key;
  return { students: ready && state ? state.students : [], isLoading: key !== '' && !ready };
}

/** Splits payload items into batches (API accepts at most `size` per request). */
export function buildPromotionChunks<T>(items: readonly T[], size: number = CHUNK_SIZE): T[][] {
  const step = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += step) chunks.push(items.slice(i, i + step));
  return chunks;
}

export function toOutcome(d: Decision): PromoteOutcome {
  switch (d) {
    case 'promote':
    case 'skip': return 'promoted';
    case 'repeat': return 'repeated';
    case 'graduate': return 'graduated';
    case 'transfer': return 'transferred';
    case 'withdraw': return 'withdrawn';
  }
}

/** Simulated API: processes chunk by chunk; mocks one failure on the 4th student. */
export async function submitPromotion(
  chunks: PromoteItem[][],
  _toYear: string,
  onProgress?: (done: number, total: number) => void,
): Promise<PromotionResult> {
  const failed: PromotionFailure[] = [];
  let succeeded = 0;
  for (let i = 0; i < chunks.length; i++) {
    await new Promise<void>((r) => setTimeout(r, 700));
    for (const item of chunks[i]) {
      if (item.studentId.endsWith('-s3') && item.outcome === 'promoted') {
        failed.push({ studentId: item.studentId, error: 'Target class has no seat available in this section.' });
      } else succeeded += 1;
    }
    onProgress?.(i + 1, chunks.length);
  }
  return { succeeded, failed };
}
