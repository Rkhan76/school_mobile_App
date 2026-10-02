import { apiRequest } from '../../lib/apiClient';
import type { AttendanceRow, AttendanceStatus, StudentEntity } from './types';

/**
 * `GET /students/class/:classId` — roster for a class(/section).
 * Local helper (not the Students module's own code) — just enough of the
 * Student entity to build an attendance roster row.
 */
export async function getClassRoster(classId: string, sectionId?: string): Promise<StudentEntity[]> {
  const qs = sectionId ? `?sectionId=${encodeURIComponent(sectionId)}` : '';
  return apiRequest<StudentEntity[]>(`/students/class/${classId}${qs}`);
}

/** `GET /attendance/class/:classId?date=YYYY-MM-DD` — one class's attendance for a date. */
export async function getClassAttendance(classId: string, date: string): Promise<AttendanceRow[]> {
  return apiRequest<AttendanceRow[]>(`/attendance/class/${classId}?date=${encodeURIComponent(date)}`);
}

/** `POST /attendance` — mark (or upsert) one student. */
export async function markOne(payload: {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}): Promise<AttendanceRow> {
  return apiRequest<AttendanceRow>('/attendance', { method: 'POST', body: payload });
}

/**
 * `POST /attendance/bulk` — mark a whole section at once. THIS IS THE ONE
 * to use for the "mark attendance" screen. Response is just a saved count —
 * refetch via `getClassAttendance` right after to show the confirmed state.
 */
export async function markBulk(payload: {
  date: string;
  records: { studentId: string; status: AttendanceStatus; remarks?: string }[];
}): Promise<{ saved: number }> {
  return apiRequest<{ saved: number }>('/attendance/bulk', { method: 'POST', body: payload });
}

/** `GET /attendance/student/:studentId` — one student's raw history, newest first. */
export async function getStudentAttendanceHistory(studentId: string): Promise<AttendanceRow[]> {
  return apiRequest<AttendanceRow[]>(`/attendance/student/${studentId}`);
}

/**
 * `PATCH /attendance/:id` — correct an existing entry. `reason` is mandatory
 * (min 3 chars). Only works while the record's date is still today — the
 * backend returns 400 otherwise, regardless of who's editing.
 */
export async function correctAttendance(
  id: string,
  payload: { status?: AttendanceStatus; remarks?: string; reason: string },
): Promise<AttendanceRow> {
  return apiRequest<AttendanceRow>(`/attendance/${id}`, { method: 'PATCH', body: payload });
}

/** `DELETE /attendance/:id` */
export async function deleteAttendance(id: string): Promise<void> {
  await apiRequest<void>(`/attendance/${id}`, { method: 'DELETE' });
}
