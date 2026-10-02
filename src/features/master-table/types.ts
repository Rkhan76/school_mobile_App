/**
 * Real entity/input shapes for the six Master Data catalogs. Replaces the old
 * mockMaster.ts type definitions now that this screen talks to the real API.
 */

export type TabKey = 'academicYears' | 'examTypes' | 'feeTypes' | 'leaveTypes' | 'periods' | 'documentCategories';

/* ---------------- Academic Years — /academic/years ---------------- */

export interface AcademicYear {
  id: string;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface AcademicYearInput {
  label: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

/* ---------------- Leave Types — /leave-types ---------------- */

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isPaid: boolean;
  defaultDays?: number | null;
  maxDaysPerYear?: number | null;
  isActive: boolean;
}

export interface LeaveTypeInput {
  code: string;
  name: string;
  description?: string;
  isPaid?: boolean;
  defaultDays?: number;
  maxDaysPerYear?: number;
  isActive?: boolean;
}

export interface LeaveTypeListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/* ---------------- Fee Categories — /fees/categories ---------------- */

export interface FeeCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

export interface FeeCategoryInput {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

/* ---------------- Exam Types — /exams/types ---------------- */

export interface ExamTypeM {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  isSubjectScoped: boolean;
}

export interface ExamTypeMInput {
  name: string;
  description?: string;
  isActive?: boolean;
  isSubjectScoped: boolean;
}

/* ---------------- Periods — /timetable/periods ---------------- */

export interface PeriodM {
  id: string;
  name: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  sortOrder: number;
  isBreak: boolean;
  isActive: boolean;
}

export interface PeriodMInput {
  name: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
  isBreak?: boolean;
  isActive?: boolean;
}

/* ---------------- Document Categories — /school-documents/categories ----------------
 * READ ONLY: no create/update/delete endpoint is documented for this catalog. */

export interface DocumentCategoryM {
  id: string;
  name: string;
  description?: string | null;
  documentCount: number;
  isActive?: boolean;
}

/* ---------------- Generic plumbing shared by config.ts / useMasterData.ts ---------------- */

export interface MasterEntityMap {
  academicYears: AcademicYear;
  examTypes: ExamTypeM;
  feeTypes: FeeCategory;
  leaveTypes: LeaveType;
  periods: PeriodM;
  documentCategories: DocumentCategoryM;
}

/** Per-tab create/update payload shape. documentCategories has none (read-only), so it's
 * typed as an inert partial of the entity — toDraft for that tab is never actually sent. */
export interface DraftInputMap {
  academicYears: AcademicYearInput;
  examTypes: ExamTypeMInput;
  feeTypes: FeeCategoryInput;
  leaveTypes: LeaveTypeInput;
  periods: PeriodMInput;
  documentCategories: Partial<DocumentCategoryM>;
}

export type Draft<K extends TabKey> = DraftInputMap[K];

export interface MasterData<K extends TabKey> {
  data: MasterEntityMap[K][];
  isLoading: boolean;
  refetch: () => void;
  add: (draft: Draft<K>) => Promise<void>;
  update: (id: string, patch: Partial<Draft<K>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Academic years only: makes exactly one record active (routed through the dedicated
   * set-active endpoint). No-op for every other tab. */
  setActive: (id: string) => Promise<void>;
}
