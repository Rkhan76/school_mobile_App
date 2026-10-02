// Types modeled directly off MOBILE_API_DOCS.md section "3. Students".

export type EnrollmentStatus = 'active' | 'graduated' | 'transferred' | 'withdrawn' | 'inactive';

export interface ClassLite {
  id: string;
  name: string;
}

export interface SectionLite {
  id: string;
  name: string;
}

export interface AcademicYearLite {
  id: string;
  label: string;
}

/** GET /students/list — lean row. */
export interface StudentListItem {
  id: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string | null;
  class: ClassLite | null;
  section: SectionLite | null;
}

/** GET /students/stats */
export interface StudentStats {
  total: number;
  male: number;
  female: number;
  withPortalAccess: number;
}

export interface MedicalDetails {
  bloodGroup?: string | null;
  height?: string | null;
  weight?: string | null;
}

export interface BankDetails {
  accountNumber?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  ifscCode?: string | null;
}

export interface AddressInfo {
  currentAddress?: string | null;
  permanentAddress?: string | null;
}

export interface StudentDocumentEntry {
  documentName: string;
  file: string | null;
}

/**
 * GET /students/:id — full StudentEntity (see "Student entity — key fields")
 * merged with the active enrollment's rollNumber/academicYear/class/section.
 */
export interface StudentDetail {
  id: string;
  schoolId: string;
  schoolUserId: string | null;
  admissionNumber: string;
  fullName: string;
  category: string | null;
  subcategory: string | null;
  gender: string;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  aadharNumber: string | null;
  profileImage: string | null;
  aadharImage: string | null;
  tcImage: string | null;
  birthCertificateImage: string | null;
  medicalDetails: MedicalDetails | null;
  bankDetails: BankDetails | null;
  previousSchoolName: string | null;
  previousSchoolAddress: string | null;
  addressInfo: AddressInfo | null;
  hostelName: string | null;
  roomNumber: string | null;
  documents: StudentDocumentEntry[];
  additionalDetails: string | null;
  enrollmentStatus: EnrollmentStatus;
  // merged active enrollment (all null if no active enrollment)
  rollNumber: string | null;
  academicYearId: string | null;
  academicYear: AcademicYearLite | null;
  classId: string | null;
  class: ClassLite | null;
  sectionId: string | null;
  section: SectionLite | null;
}

/** GET /students/:id/personal */
export interface StudentPersonal {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  aadharNumber: string | null;
  category: string | null;
  subcategory: string | null;
  profileImage: string | null;
  additionalDetails: string | null;
  admissionNumber: string;
  rollNumber: string | null;
  academicYear: AcademicYearLite | null;
  classId: string | null;
  class: ClassLite | null;
  sectionId: string | null;
  section: SectionLite | null;
  schoolUserId: string | null;
  previousSchoolName: string | null;
  previousSchoolAddress: string | null;
  medicalDetails: MedicalDetails | null;
  addressInfo: AddressInfo | null;
  documents: StudentDocumentEntry[];
  aadharImage: string | null;
  tcImage: string | null;
  birthCertificateImage: string | null;
}

/** GET /students/:id/parents */
export interface StudentGuardianLink {
  relation: string;
  isPrimaryContact: boolean;
  canPickup: boolean;
  guardian: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    occupation: string | null;
    address: string | null;
    photo: string | null;
  };
}

export interface StudentParents {
  id: string;
  guardians: StudentGuardianLink[];
}

/** GET /students/:id/bank */
export interface StudentBankResponse {
  id: string;
  bankDetails: BankDetails;
}

/** GET /students/:id/hostel */
export interface StudentHostelResponse {
  id: string;
  hostelName: string | null;
  roomNumber: string | null;
}

/** GET /students/:id/enrollments — newest first. */
export interface StudentEnrollmentRow {
  academicYear: AcademicYearLite;
  class: ClassLite;
  section: SectionLite | null;
  rollNumber: string | null;
  status: 'active' | 'promoted' | 'failed' | 'transferred' | 'withdrawn' | 'graduated';
  promotedAt: string | null;
  promotedBy: string | null;
  promotionType: 'NORMAL' | 'SKIP' | 'DETAINED' | null;
  promotionReason: string | null;
}
