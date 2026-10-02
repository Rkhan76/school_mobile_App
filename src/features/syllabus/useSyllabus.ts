import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import {
  copyPlan,
  getExamSyllabus,
  getSyllabus,
  savePlan,
  setExamSyllabusChapters,
} from './api';
import type {
  ChapterInput,
  ExamSyllabusFilters,
  ExamSyllabusItem,
  SectionSyllabus,
} from './types';

/* ----------------------------------------------------------------------- *
 * Local-only "reviewed" tracking.
 *
 * The real API has NO chapter-completion / progress-tracking concept at
 * all (MOBILE_API_DOCS.md §8 says so explicitly) — there is nothing to
 * read this from or write it to on the backend. We keep a tiny in-memory
 * store so the "mark as reviewed" checkbox in SubjectAccordion still does
 * something useful for the person using this device, but it is PURELY
 * client-side UI state: it is never sent to the server, never synced
 * between devices/users, and is lost on app restart. Chapter ids are
 * server-issued UUIDs (globally unique), so a flat Set is enough.
 * ----------------------------------------------------------------------- */
const reviewedStore = new Set<string>();
const reviewedListeners = new Set<() => void>();

function notifyReviewedListeners() {
  reviewedListeners.forEach((fn) => fn());
}

export function useChapterReviewed() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    reviewedListeners.add(listener);
    return () => {
      reviewedListeners.delete(listener);
    };
  }, []);

  const reviewedIds = useMemo<ReadonlySet<string>>(() => new Set(reviewedStore), [reviewedStore.size]);

  const toggleReviewed = useCallback((chapterId: string) => {
    if (reviewedStore.has(chapterId)) reviewedStore.delete(chapterId);
    else reviewedStore.add(chapterId);
    notifyReviewedListeners();
  }, []);

  return { reviewedIds, toggleReviewed };
}

/* ----------------------------------------------------------------------- *
 * Syllabus plan (per section)
 * ----------------------------------------------------------------------- */

export function useSyllabus(sectionId: string | null, academicYearId: string | null) {
  const [data, setData] = useState<SectionSyllabus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(() => {
    if (!sectionId || !academicYearId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    const requestId = (requestRef.current += 1);
    setIsLoading(true);
    setError(null);
    getSyllabus(sectionId, academicYearId)
      .then((result) => {
        if (requestRef.current !== requestId) return;
        setData(result);
      })
      .catch((err) => {
        if (requestRef.current !== requestId) return;
        setError(err instanceof ApiError ? err.message : 'Could not load the syllabus.');
      })
      .finally(() => {
        if (requestRef.current !== requestId) return;
        setIsLoading(false);
      });
  }, [sectionId, academicYearId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateChapters = useCallback(
    async (subjectId: string, chapters: ChapterInput[]) => {
      if (!sectionId) return;
      const result = await savePlan({
        sectionId,
        subjectId,
        academicYearId: academicYearId ?? undefined,
        chapters,
      });
      // The PUT response is already the full updated section syllabus —
      // merge it straight back into state instead of refetching.
      setData(result);
    },
    [sectionId, academicYearId],
  );

  const copyToOtherSections = useCallback(
    async (toSectionIds: string[], opts?: { subjectId?: string; overwrite?: boolean }) => {
      if (!sectionId || toSectionIds.length === 0) {
        return { copied: [], skipped: [] };
      }
      return copyPlan({
        fromSectionId: sectionId,
        toSectionIds,
        subjectId: opts?.subjectId,
        overwrite: opts?.overwrite,
        academicYearId: academicYearId ?? undefined,
      });
    },
    [sectionId, academicYearId],
  );

  return { data, isLoading, error, refetch: load, updateChapters, copyToOtherSections };
}

/* ----------------------------------------------------------------------- *
 * Exam syllabus (per section, filterable)
 * ----------------------------------------------------------------------- */

const PAGE_SIZE = 8;

export function useExamSyllabus(filters: ExamSyllabusFilters) {
  const { sectionId, academicYearId, examTypeId, subjectId, upcoming } = filters;
  const [all, setAll] = useState<ExamSyllabusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const requestRef = useRef(0);

  const filterKey = `${sectionId}|${academicYearId ?? ''}|${examTypeId ?? ''}|${subjectId ?? ''}|${upcoming ?? ''}`;

  const load = useCallback(() => {
    if (!sectionId) {
      setAll([]);
      setIsLoading(false);
      return;
    }
    const requestId = (requestRef.current += 1);
    setIsLoading(true);
    setError(null);
    getExamSyllabus({ sectionId, academicYearId, examTypeId, subjectId, upcoming })
      .then((result) => {
        if (requestRef.current !== requestId) return;
        setAll(result);
      })
      .catch((err) => {
        if (requestRef.current !== requestId) return;
        setError(err instanceof ApiError ? err.message : 'Could not load exam syllabus.');
      })
      .finally(() => {
        if (requestRef.current !== requestId) return;
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterKey]);

  const data = useMemo(() => all.slice(0, visibleCount), [all, visibleCount]);
  const hasMore = visibleCount < all.length;

  const loadMore = useCallback(() => {
    if (hasMore) setVisibleCount((n) => n + PAGE_SIZE);
  }, [hasMore]);

  const updateExam = useCallback(async (examScheduleId: string, chapterIds: string[]) => {
    const updated = await setExamSyllabusChapters(examScheduleId, chapterIds);
    setAll((prev) => prev.map((e) => (e.examScheduleId === examScheduleId ? updated : e)));
  }, []);

  return { data, total: all.length, isLoading, error, refetch: load, loadMore, hasMore, updateExam };
}
