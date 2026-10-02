export type PaginatedResult<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number };
export type SectionLite = { id: string; name: string };
export type ClassWithSections = { id: string; name: string; sections: SectionLite[] };
export type AcademicYearLean = { id: string; label: string; isActive: boolean };
export type GuardianLookupItem = { id: string; name: string };
