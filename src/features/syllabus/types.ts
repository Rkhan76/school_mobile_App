/** A single syllabus chapter as stored on the backend. */
export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  topics: string[];
}

/** Payload shape for `PUT /syllabus/plans` — `id` omitted means "new chapter". */
export interface ChapterInput {
  id?: string;
  title: string;
  topics: string[];
}

export interface SubjectLean {
  id: string;
  name: string;
  subjectCode?: string;
}

export interface SubjectEntry {
  subject: SubjectLean;
  chapters: Chapter[];
}

export interface SectionSyllabus {
  academicYear: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  subjects: SubjectEntry[];
}

export interface CopyPlanResult {
  copied: { section: { id: string; name: string }; subject: { id: string; name: string }; chapters: number }[];
  skipped: { section: { id: string; name: string }; subject: { id: string; name: string }; reason: string }[];
}

export interface ExamSyllabusItem {
  examScheduleId: string;
  title: string;
  examType: { id: string; name: string };
  subject: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string } | null;
  examDate: string;
  maxMarks: number;
  /** negative = already held */
  daysRemaining: number;
  chapters: Chapter[];
}

export interface ExamSyllabusFilters {
  sectionId: string;
  academicYearId?: string;
  examTypeId?: string;
  subjectId?: string;
  upcoming?: boolean;
}

/** Local lookup — `GET /academic/subjects/lookup`, not shared with other feature folders. */
export interface SubjectLookupItem {
  id: string;
  name: string;
}

/** Local lookup — `GET /exams/types`, not shared with other feature folders. */
export interface ExamTypeLookupItem {
  id: string;
  name: string;
  isSubjectScoped: boolean;
}

export interface Option {
  value: string;
  label: string;
}
