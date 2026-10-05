export interface ClassSection {
  id: string;
  name: string;
  classId: string;
  academicYearId: string;
  maxCapacity: number | null;
  classTeacherId?: string | null;
  classTeacher?: { id: string; fullName: string } | null;
}

export interface AcademicClass {
  id: string;
  name: string;
  gradeOrder: number;
  description: string | null;
  createdAt: string;
  sections: ClassSection[];
}

export interface ClassInput {
  name: string;
  gradeOrder: number;
  description: string;
}

export interface ClassStats {
  totalClasses: number;
  totalSections: number;
}

export interface SectionSubject {
  id: string;
  subjectId: string;
  subject: { id: string; name: string; subjectCode: string | null; description: string | null };
  isOptional: boolean;
  teacher: { id: string; fullName: string } | null;
}
