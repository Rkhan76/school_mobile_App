export type AdmissionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'enrolled';

export type AdmissionListItem = {
  id: string;
  /** Can be null for an applicant saved without a name. */
  fullName: string | null;
  email: string | null;
  admissionNumber: string; // this is the application number until enrolled, per the doc
  status: AdmissionStatus;
  className: string | null;
  sectionName: string | null;
  profileImage: string | null;
  appliedOn: string; // ISO datetime
};

export type AdmissionListParams = {
  page?: number;
  limit?: number;
  status?: AdmissionStatus | 'all';
  classId?: string | 'all';
  academicYearId?: string | 'all';
  search?: string;
};

export type AdmissionStats = { totalApplications: number; enrolled: number; pending: number; rejected: number };

export type GuardianBlock = {
  name?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  aadharNumber?: string;
  existingGuardianId?: string | null;
  /** True when this parent/guardian is an existing guardian profile (details come from that live profile). */
  isLinkedGuardian?: boolean;
  photo?: string | null;
  /** Guardian block only. */
  relation?: string;
  mobileNumber?: string;
  address?: string;
};

/** Father/mother as the create/update API accepts them (no email, photo or linked-guardian fields). */
export type ParentPayload = { name?: string; phone?: string; aadharNumber?: string; occupation?: string };

export type AdmissionPayload = {
  academicInfo?: { year?: string; class?: string; rollNumber?: string; admissionNumber?: string };
  personalInfo: {
    fullName?: string;
    gender: 'Male' | 'Female' | 'Other';
    dateOfBirth?: string;
    category?: string;
    subcategory?: string;
    religion?: string;
    phone?: string;
    email?: string;
    aadharNumber?: string;
  };
  parentGuardianInfo?: { father?: ParentPayload; mother?: ParentPayload };
  medicalDetails?: { bloodGroup?: string; height?: string; weight?: string };
  bankDetails?: { accountNumber?: string; bankName?: string; bankBranch?: string; ifscCode?: string };
  previousSchoolDetails?: { schoolName?: string; address?: string };
  address?: { currentAddress?: string; permanentAddress?: string };
  hostelDetails?: { hostelName?: string; roomNumber?: string };
  additionalDetails?: string;
  /** Re-admission of an already enrolled student. */
  studentId?: string;
};

/** What the API returns (read-only fields such as guardian blocks and documents are never sent back). */
export type AdmissionDetail = Omit<AdmissionPayload, 'parentGuardianInfo'> & {
  parentGuardianInfo?: {
    father?: GuardianBlock;
    mother?: GuardianBlock;
    guardian?: GuardianBlock;
    primaryGuardian?: 'father' | 'mother' | 'other';
  };
  guardianId?: string | null;
  documents?: { documentName: string; file?: string | null }[];
  id: string;
  applicationNumber: string;
  admissionNumber: string | null;
  status: AdmissionStatus;
  createdAt: string;
  className: string | null;
  sectionName: string | null;
  yearName: string | null;
  sectionId?: string | null;
  rollNumber?: string | null;
  userId?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  approvedAt?: string | null;
  primaryGuardianSource?: 'father' | 'mother' | 'other' | null;
  profileImage?: string | null;
  aadharImage?: string | null;
  tcImage?: string | null;
  birthCertificateImage?: string | null;
  cancelledAt?: string | null;
  fatherInfo?: (GuardianBlock & { isLinkedGuardian?: boolean }) | null;
  motherInfo?: (GuardianBlock & { isLinkedGuardian?: boolean }) | null;
  guardianInfo?: (GuardianBlock & { isLinkedGuardian?: boolean }) | null;
};

export type BulkApproveResult = { succeeded: AdmissionDetail[]; failed: { id: string; error: string }[] };
