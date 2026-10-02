import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import {
  bulkSubmitResults,
  createExamSchedule,
  deleteExamSchedule,
  listExamSchedules,
  listExamTypes,
  listResultsForSchedule,
  lockResults,
  lookupStudentsForClass,
  updateExamSchedule,
} from './api';
import {
  deriveStatus,
  markError,
  type ApiExamSchedule,
  type ExamInput,
  type ExamSchedule,
  type ExamsParams,
  type ExamStats,
  type ExamStudent,
  type ExamType,
  type MutationResult,
  type ResultSummary,
} from './types';

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
}

function toView(s: ApiExamSchedule): ExamSchedule {
  return {
    id: s.id,
    examTypeId: s.examTypeId,
    examType: s.examType?.name ?? '—',
    title: s.title,
    classId: s.classId,
    className: s.class?.name ?? '—',
    sectionId: s.sectionId,
    sectionName: s.section?.name ?? 'Whole class',
    subjectId: s.subjectId,
    subject: s.subject?.name ?? '—',
    examDate: s.examDate,
    maxMarks: s.maxMarks,
    passingMarks: s.passingMarks,
    durationMinutes: s.durationMinutes,
    invigilatorId: s.invigilatorId,
    academicYearId: s.academicYearId,
    academicYear: s.academicYear?.label ?? '—',
    status: deriveStatus(s.examDate),
    daysRemaining: s.daysRemaining,
  };
}

/**
 * Fetches exam schedules (server-filtered by class/exam-type when given —
 * status and free-text search aren't backend query params, so those are
 * applied client-side on top) plus the exam-type catalog once. There's no
 * pagination on `/exams/schedules` — it's a plain array, so the full
 * (filtered) result set is rendered with no infinite-scroll.
 */
export function useExams(params: ExamsParams) {
  const [raw, setRaw] = useState<ExamSchedule[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const fetchSchedules = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    listExamSchedules({
      classId: params.classId !== 'all' ? params.classId : undefined,
      examTypeId: params.examTypeId !== 'all' ? params.examTypeId : undefined,
    })
      .then((rows) => {
        if (requestId.current !== id) return;
        setRaw(rows.map(toView));
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      })
      .finally(() => {
        if (requestId.current === id) setIsLoading(false);
      });
  }, [params.classId, params.examTypeId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    listExamTypes()
      .then(setExamTypes)
      .catch(() => {
        /* the type picker just stays empty; the list below still works */
      });
  }, []);

  const refetch = useCallback(() => fetchSchedules(), [fetchSchedules]);

  const stats = useMemo<ExamStats>(
    () => ({
      total: raw.length,
      upcoming: raw.filter((e) => e.status === 'upcoming').length,
      completed: raw.filter((e) => e.status === 'completed').length,
      examTypes: new Set(raw.map((e) => e.examTypeId)).size,
    }),
    [raw]
  );

  const data = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    return raw.filter(
      (e) =>
        (params.status === 'all' || e.status === params.status) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          `${e.className} - ${e.sectionName}`.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q))
    );
  }, [raw, params.search, params.status]);

  const add = useCallback(
    async (input: ExamInput): Promise<MutationResult> => {
      try {
        await createExamSchedule(input);
        refetch();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: errorMessage(err) };
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, input: ExamInput): Promise<MutationResult> => {
      try {
        await updateExamSchedule(id, input);
        refetch();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: errorMessage(err) };
      }
    },
    [refetch]
  );

  const remove = useCallback(
    (id: string) => {
      deleteExamSchedule(id)
        .then(refetch)
        .catch((err) => Alert.alert('Error', errorMessage(err)));
    },
    [refetch]
  );

  return { data, all: raw, examTypes, total: data.length, stats, isLoading, refetch, add, update, remove };
}

/* ---------------- results ---------------- */

type ResultsState = {
  students: ExamStudent[];
  marks: Record<string, string>;
  resultIds: Record<string, string>;
  locked: boolean;
};

const EMPTY_STATE: ResultsState = { students: [], marks: {}, resultIds: {}, locked: false };

/**
 * There's no dedicated "roster for a schedule" endpoint, so the student list
 * is derived from the schedule's own classId/sectionId (GET
 * /students/class/:classId?sectionId=...) and merged with whatever results
 * already exist for that schedule, so every enrolled student shows a row
 * even before marks are entered.
 */
export function useExamResults(exam: ExamSchedule | null) {
  const scheduleId = exam?.id ?? null;
  const classId = exam?.classId ?? null;
  const sectionId = exam?.sectionId ?? null;
  const max = exam?.maxMarks ?? 0;
  const passing = exam?.passingMarks ?? 0;

  const [state, setState] = useState<ResultsState>(EMPTY_STATE);
  const [isLoading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!scheduleId || !classId) {
      setState(EMPTY_STATE);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setDirty(false);
    Promise.all([lookupStudentsForClass(classId, sectionId), listResultsForSchedule(scheduleId)])
      .then(([roster, results]) => {
        if (requestId.current !== id) return;
        const sorted = [...roster].sort((a, b) => {
          if (a.rollNumber && b.rollNumber) {
            return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
          }
          return a.fullName.localeCompare(b.fullName);
        });
        const students: ExamStudent[] = sorted.map((s, i) => ({
          id: s.id,
          name: s.fullName,
          rollNo: s.rollNumber ?? String(i + 1).padStart(2, '0'),
        }));
        const marks: Record<string, string> = {};
        const resultIds: Record<string, string> = {};
        let locked = false;
        results.forEach((r) => {
          marks[r.studentId] = String(r.marksObtained);
          resultIds[r.studentId] = r.id;
          if (r.locked) locked = true;
        });
        setState({ students, marks, resultIds, locked });
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
  }, [scheduleId, classId, sectionId]);

  const setMark = useCallback((studentId: string, value: string) => {
    setState((s) => ({ ...s, marks: { ...s.marks, [studentId]: value } }));
    setDirty(true);
  }, []);

  const { students, marks, locked } = state;

  const hasErrors = useMemo(
    () => students.some((s) => markError(marks[s.id] ?? '', max) !== null),
    [students, marks, max]
  );

  const summary = useMemo<ResultSummary>(() => {
    const vals = students
      .filter((s) => (marks[s.id] ?? '').trim() !== '' && markError(marks[s.id], max) === null)
      .map((s) => Number(marks[s.id]));
    if (vals.length === 0) return { entered: 0, average: 0, passPercent: 0, highest: 0 };
    return {
      entered: vals.length,
      average: vals.reduce((a, b) => a + b, 0) / vals.length,
      passPercent: (vals.filter((v) => v >= passing).length / vals.length) * 100,
      highest: Math.max(...vals),
    };
  }, [students, marks, max, passing]);

  const save = useCallback(async (): Promise<MutationResult> => {
    if (!scheduleId) return { ok: false, message: 'No exam selected.' };
    if (hasErrors) return { ok: false, message: 'Fix the invalid marks first.' };
    const entries = students
      .filter((s) => (marks[s.id] ?? '').trim() !== '')
      .map((s) => ({ studentId: s.id, marksObtained: Number(marks[s.id]) }));
    if (entries.length === 0) return { ok: false, message: 'Enter at least one mark.' };
    try {
      const refreshed = await bulkSubmitResults(scheduleId, entries);
      setState((s) => {
        const nextMarks = { ...s.marks };
        const nextIds = { ...s.resultIds };
        let nextLocked = s.locked;
        refreshed.forEach((r) => {
          nextMarks[r.studentId] = String(r.marksObtained);
          nextIds[r.studentId] = r.id;
          if (r.locked) nextLocked = true;
        });
        return { ...s, marks: nextMarks, resultIds: nextIds, locked: nextLocked };
      });
      setDirty(false);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }, [scheduleId, hasErrors, marks, students]);

  /** Publish — irreversible: locks every live result for the schedule. */
  const publish = useCallback(async (): Promise<MutationResult & { locked?: number }> => {
    if (!scheduleId) return { ok: false, message: 'No exam selected.' };
    try {
      const result = await lockResults(scheduleId);
      setState((s) => ({ ...s, locked: true }));
      return { ok: true, locked: result.locked };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }, [scheduleId]);

  return { students, marks, setMark, save, publish, summary, isLoading, hasErrors, dirty, locked };
}
