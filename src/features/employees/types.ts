// Types for the Employees module (Teachers + Non-teaching staff).
// Modeled off MOBILE_API_DOCS.md sections 4 (Teachers) and 5 (Non-teaching staff).

export type Gender = 'Male' | 'Female' | 'Other';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
export type ContractType = 'Permanent' | 'Contract';

export type DocumentBlock = { documentName: string; file?: string | null };
export type SocialLinks = { facebook?: string; linkedin?: string; instagram?: string; youtube?: string };
export type AddressBlock = { currentAddress?: string; permanentAddress?: string };
export type MedicalDetails = { bloodGroup?: string; [key: string]: unknown };
export type BankDetails = { accountNumber?: string; bankName?: string; ifscCode?: string; [key: string]: unknown };

// ---------- Teachers ----------

export type TeacherLoginDetails = { firstName: string; lastName: string; email: string };

export type TeacherPersonalInfo = {
  fullName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  qualification?: string;
  experience?: string;
  /** Stored as the teacher's "designation" at creation time — no separate designation field on create. */
  workLocation?: string;
  joiningDate?: string;
  contractType?: ContractType;
  shift?: string;
};

export type CreateTeacherPayload = {
  loginDetails: TeacherLoginDetails;
  personalInfo?: TeacherPersonalInfo;
  medicalDetails?: MedicalDetails;
  bankDetails?: BankDetails;
  previousSchoolDetails?: { schoolName?: string; address?: string };
  address?: AddressBlock;
  documents?: DocumentBlock[];
  socialLinks?: SocialLinks;
  additionalDetails?: string;
};

export type UpdateTeacherPayload = Partial<Omit<CreateTeacherPayload, 'loginDetails'>>;

/** What a teacher teaches (subject/class) is NOT part of this entity — it's derived
 * read-only elsewhere via `/teachers/:id/personal` → currentAssignments. Not available on list/create. */
export type TeacherEntity = {
  id: string;
  staffId?: string;
  employeeCode?: string;
  fullName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  qualification?: string | null;
  experience?: string | null;
  workLocation?: string | null;
  designation?: string | null;
  department?: string | null;
  shift?: string | null;
  joiningDate?: string | null;
  contractType?: string | null;
  profileImage?: string | null;
  status?: EmployeeStatus;
};

export type TeacherStats = { total: number; male: number; female: number; assignedToClass: number };

export type TeacherListParams = { page?: number; limit?: number; search?: string };

// ---------- Non-teaching staff ----------

export type NTSLoginDetails = { firstName: string; lastName: string; email: string };

export type NTSStaffInfo = {
  designation?: string;
  department?: string;
  joiningDate?: string;
  contractType?: ContractType;
};

export type NTSPersonalInfo = {
  fullName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  qualification?: string;
  experience?: string;
};

export type CreateNTSPayload = {
  /** Omit entirely for no portal login (unlike teachers, this is fully optional). */
  loginDetails?: NTSLoginDetails;
  staffInfo?: NTSStaffInfo;
  personalInfo?: NTSPersonalInfo;
  medicalDetails?: MedicalDetails;
  bankDetails?: BankDetails;
  address?: AddressBlock;
  documents?: DocumentBlock[];
  socialLinks?: SocialLinks;
  additionalDetails?: string;
};

/** PATCH /non-teaching-staff/:id handles profile + employment + status all in one. loginDetails can't be changed via this route. */
export type UpdateNonTeachingStaffPayload = {
  staffInfo?: Partial<NTSStaffInfo>;
  personalInfo?: Partial<NTSPersonalInfo>;
  status?: EmployeeStatus;
  medicalDetails?: MedicalDetails;
  bankDetails?: BankDetails;
  address?: AddressBlock;
  documents?: DocumentBlock[];
  socialLinks?: SocialLinks;
  additionalDetails?: string;
};

/** Lean projection returned by GET /non-teaching-staff — bank/medical/documents/social excluded. */
export type NTSListItem = {
  id: string;
  staffId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: Gender | null;
  profileImage: string | null;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  status: EmployeeStatus;
};

export type NTSEntity = NTSListItem;

export type NTSListParams = { page?: number; limit?: number; search?: string };
