// Types for the Leave Requests admin-review module.
// Modeled off MOBILE_API_DOCS.md §24 ("Leave requests — admin review (approve/reject)"),
// with the catalog referenced via `leaveTypeId` described in §23 ("Leave Types").

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export const LEAVE_STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

/** Free-text per the doc — these are just the roles this screen offers as quick filters. */
export type ApplicantRoleFilter = 'STUDENT' | 'TEACHER' | 'STAFF';

export const APPLICANT_ROLES: ApplicantRoleFilter[] = ['STUDENT', 'TEACHER', 'STAFF'];

export type LeaveApplication = {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  leaveTypeId: string;
  /** The API sends the type as a nested { id, name }; the name is also copied to leaveTypeName on load. */
  leaveType?: { id: string; name: string } | null;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason?: string;
  status: LeaveStatus;
  reviewedById?: string | null;
  /** Reviewer, as { id, name } (null while pending). */
  approvedBy?: { id: string; name: string } | null;
  reviewedAt?: string | null;
  reviewComments?: string | null;
  createdAt: string;
};

export type LeaveDecision = 'APPROVED' | 'REJECTED';

export type ListLeaveApplicationsParams = {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  applicantRole?: string;
  applicantId?: string;
  leaveTypeId?: string;
  from?: string;
  to?: string;
};
