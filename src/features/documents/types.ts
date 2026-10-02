/** Mirrors the backend's entity-document actors (MOBILE_API_DOCS.md §15). Note this
 * module has no separate "Teacher" concept — teaching and non-teaching staff both
 * live under STAFF here. */
export type EntityType = 'STUDENT' | 'STAFF' | 'GUARDIAN';

export const ENTITY_TYPES: EntityType[] = ['STUDENT', 'STAFF', 'GUARDIAN'];

export const ENTITY_LABELS: Record<EntityType, string> = {
  STUDENT: 'Student',
  STAFF: 'Staff',
  GUARDIAN: 'Guardian',
};

/* ----------------------------- document types ----------------------------- */

export interface DocumentType {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  /** Immutable after creation. */
  appliesTo: EntityType;
  isMandatory: boolean;
  hasExpiry: boolean;
  isActive: boolean;
  sortOrder: number;
}

export type DocumentTypeInput = {
  name: string;
  description?: string;
  appliesTo: EntityType;
  isMandatory?: boolean;
  hasExpiry?: boolean;
  sortOrder?: number;
};

export type DocumentTypeUpdateInput = Partial<Omit<DocumentTypeInput, 'appliesTo'>>;

/* ----------------------------- document requests ----------------------------- */

export type DocumentRequestStatus = 'OPEN' | 'SUBMITTED' | 'FULFILLED' | 'CANCELLED';
/** Filter value: a real status or the derived "OVERDUE" (maps to the `overdue` query param). */
export type RequestStatusFilter = '' | DocumentRequestStatus | 'OVERDUE';

export interface DocumentRequest {
  id: string;
  entityType: EntityType;
  entityId: string;
  documentTypeId: string;
  note: string | null;
  dueDate: string | null;
  status: DocumentRequestStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** List rows additionally carry a resolved document type name (and, in practice,
 * a resolved entity display name — not spelled out in the doc excerpt but kept
 * optional/defensive here). */
export interface DocumentRequestRow extends DocumentRequest {
  documentTypeName: string;
  entityName?: string;
}

export type CreateRequestInput = {
  entityType: EntityType;
  entityId: string;
  documentTypeId: string;
  note?: string;
  dueDate?: string;
};

/** Bulk targets either explicit entity ids (any entity type, max 500) or a
 * class/section (students only). */
export type BulkCreateInput = {
  documentTypeId: string;
  note?: string;
  dueDate?: string;
} & (
  | { entityIds: string[]; classId?: never; sectionId?: never }
  | { classId: string; sectionId?: string; entityIds?: never }
);

export type BulkCreateResult = {
  succeeded: string[];
  failed: { entityId: string; error: string }[];
};

export type ListRequestsParams = {
  status?: DocumentRequestStatus;
  entityType?: EntityType;
  entityId?: string;
  documentTypeId?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
};

/* ----------------------------- uploads & review ----------------------------- */

export type EntityDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

export interface EntityDocument {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  documentTypeId: string;
  documentTypeName: string;
  requestId: string | null;
  replacesDocumentId: string | null;
  fileFormat: string;
  fileBytes: number;
  fileName: string;
  status: EntityDocumentStatus;
  expiryDate: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UploadOnBehalfParams = {
  entityType: EntityType;
  entityId: string;
  documentTypeId: string;
  expiryDate?: string;
};

export type UploadFilePart = { uri: string; name: string; type: string };

export type ChecklistItemStatus = 'APPROVED' | 'EXPIRED' | 'PENDING' | 'REJECTED' | 'MISSING';

export type ChecklistItem = {
  documentTypeId: string;
  documentTypeName: string;
  isMandatory: boolean;
  hasExpiry: boolean;
  status: ChecklistItemStatus;
  requested: boolean;
  requestId: string | null;
  documentId: string | null;
  expiryDate: string | null;
  rejectReason: string | null;
};

export type ChecklistResponse = {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  items: ChecklistItem[];
  mandatoryTotal: number;
  mandatoryComplete: number;
  isComplete: boolean;
};

export type DownloadLink = {
  url: string;
  expiresAt: string;
  fileName: string;
};
