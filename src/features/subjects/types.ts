export type AssignmentClass = { id: string; name: string };

export type AssignmentSection = {
  id: string;
  name: string;
  class: AssignmentClass;
};

/** A `class_subjects` row as embedded in a subject's `assignments` array. */
export type SubjectAssignment = {
  id: string;
  subjectId: string;
  sectionId: string;
  academicYearId: string;
  isOptional: boolean;
  section: AssignmentSection;
};

export type Subject = {
  id: string;
  schoolId: string;
  name: string;
  subjectCode: string;
  description: string | null;
};

export type SubjectWithAssignments = Subject & {
  assignments: SubjectAssignment[];
};

export type SubjectInput = {
  name: string;
  subjectCode: string;
  description?: string;
};

/** A `class_subjects` row as returned by the per-section listing, with the nested subject. */
export type SectionSubjectLink = {
  id: string;
  subjectId: string;
  sectionId: string;
  academicYearId: string;
  isOptional: boolean;
  subject: Subject;
};

export type SyncSectionsResult = {
  added: string[];
  removed: string[];
  unchanged: string[];
};

export type SubjectStats = {
  total: number;
  codes: number;
  withDescription: number;
  noDescription: number;
};
