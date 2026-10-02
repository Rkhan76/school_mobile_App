import type { AttendanceStatus as RosterStatus } from './mockAttendance';

/**
 * Real backend types for STUDENT attendance (see MOBILE_API_DOCS.md §9).
 * Note the backend status enum has no `'LEAVE'` value — the mock used to
 * conflate "leave application approved" with a `LEAVE` status, but per the
 * docs an approved leave application just auto-marks the day `EXCUSED`.
 * `EXCUSED` is what we use everywhere a student is away with approval.
 */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export const STUDENT_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

/** One saved attendance row, as returned by the attendance endpoints. */
export type AttendanceRow = {
  id: string;
  schoolId: string;
  studentId: string;
  enrollmentId: string | null;
  classId: string;
  date: string;
  status: AttendanceStatus;
  markedById: string | null;
  remarks: string | null;
  correctedById: string | null;
  correctedAt: string | null;
  correctionReason: string | null;
};

/** Subset of the full Student entity (`/students/class/:classId`) that the roster UI needs. */
export type StudentEntity = {
  id: string;
  admissionNumber: string;
  fullName: string;
  rollNumber?: string | number | null;
  enrollmentStatus?: string;
};

/**
 * Row shape the roster UI (StudentTab / RosterCards / SaveBar) consumes.
 * `status` uses the wider mock `AttendanceStatus` (not this file's narrower
 * backend one) purely so this type structurally satisfies the shared
 * `RosterApi<T>`/`Row` constraint in `useRoster.ts` that `StaffMember` also
 * satisfies — real values here are always one of the 4 backend statuses.
 */
export type StudentRecord = {
  id: string;
  rollNo: number;
  name: string;
  admissionNo: string;
  status: RosterStatus | null;
  remarks: string;
  /** id of the saved attendance row for this student+date, if already marked. */
  attendanceId: string | null;
};
