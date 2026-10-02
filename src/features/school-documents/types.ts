// Types for the School Documents module — org-level policies/circulars with a
// normal/classified visibility split. Modeled off MOBILE_API_DOCS.md section 15,
// "School-level documents" subsection.
//
// The doc gives an exact response shape for `/entity-documents` rows but NOT for
// `/school-documents` rows — the SchoolDocument/DocumentCategory/DocumentVersion
// shapes below are modeled by analogy to that sibling endpoint's response and to
// the fields the doc explicitly calls out (documentCount, confidentiality,
// expiryDate, version). Treat unknown/extra server fields as harmless — don't
// assume this is exhaustive.

export type Confidentiality = 'NORMAL' | 'CLASSIFIED';

export type DocumentCategory = {
  id: string;
  name: string;
  /** Count of documents in this category — included per the doc. */
  documentCount: number;
};

export type SchoolDocument = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  confidentiality: Confidentiality;
  fileName: string;
  fileFormat?: string;
  fileBytes?: number;
  /** Current version number. */
  version: number;
  /** ISO yyyy-mm-dd, or null = no expiry. */
  expiryDate: string | null;
  uploadedById?: string;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentVersion = {
  version: number;
  fileName: string;
  fileFormat?: string;
  fileBytes?: number;
  description?: string | null;
  expiryDate?: string | null;
  uploadedById?: string;
  uploadedByName?: string;
  createdAt: string;
};

export type FilePart = { uri: string; name: string; type: string };

export type UploadDocumentPayload = {
  categoryId: string;
  title: string;
  description?: string;
  /** Omit unless the uploader holds `school-document.classified.read` — only
   * holders of that permission may mark a document CLASSIFIED (per the doc). */
  confidentiality?: Confidentiality;
  /** ISO yyyy-mm-dd. */
  expiryDate?: string | null;
};

export type UploadVersionPayload = {
  description?: string;
  /** ISO yyyy-mm-dd. */
  expiryDate?: string | null;
};

export type UpdateSchoolDocumentPayload = Partial<{
  title: string;
  description: string;
  categoryId: string;
  confidentiality: Confidentiality;
  expiryDate: string | null;
}>;

export type DownloadLink = { url: string; expiresAt: string; fileName: string };

// Permission strings. The doc states the two families (`school-document-category.*`,
// `school-document.*`) and spells out `school-document.classified.read` verbatim;
// the exact per-action suffixes below aren't given letter-for-letter in this section
// but follow the `<resource>.<action>.<verb>` convention used everywhere else in the
// doc (e.g. document-type.list.read / .record.create / .update / .delete).
export const SCHOOL_DOC_PERMISSIONS = {
  categoryList: 'school-document-category.list.read',
  list: 'school-document.list.read',
  create: 'school-document.record.create',
  update: 'school-document.record.update',
  delete: 'school-document.record.delete',
  classifiedRead: 'school-document.classified.read',
} as const;
