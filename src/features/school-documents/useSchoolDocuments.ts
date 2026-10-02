import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import {
  deleteDocument,
  getVersions as apiGetVersions,
  listCategories,
  listDocuments,
  updateDocument,
  uploadDocument,
  uploadNewVersion,
} from './api';
import type {
  Confidentiality,
  DocumentCategory,
  DocumentVersion,
  FilePart,
  SchoolDocument,
  UpdateSchoolDocumentPayload,
  UploadDocumentPayload,
  UploadVersionPayload,
} from './types';

export type ConfidentialityFilter = 'all' | Confidentiality;
export type ExpiryFilter = 'any' | 'expired' | 'soon' | 'none';

export const ALL_CATEGORY_ID = '';

export type SchoolDocumentsParams = {
  search: string;
  /** category id or '' for all */
  categoryId: string;
  confidentiality: ConfidentialityFilter;
  expiry: ExpiryFilter;
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // Classified docs 404 (not 403) when the caller lacks classified.read, so a
    // 404 here could mean "truly doesn't exist" OR "exists but you can't see it" —
    // show a neutral message either way, never implying the user did something wrong.
    if (err.statusCode === 404) return 'Not found.';
    return err.message;
  }
  return 'Something went wrong.';
}

function isFeatureLocked(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.statusCode === 403 &&
    (err.body as { code?: string } | null | undefined)?.code === 'FEATURE_NOT_IN_PLAN'
  );
}

function isPaginatedEnvelope(x: SchoolDocument[] | { data: SchoolDocument[] }): x is { data: SchoolDocument[] } {
  return !Array.isArray(x);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Backed by GET /school-documents + GET /school-documents/categories. Neither
 * endpoint documents server-side search/category/confidentiality query params (no
 * "paginated" callout like document-requests gets either), so the full set is
 * fetched once and every filter — including the ones the mock used to apply — is
 * applied client-side over it. Classified docs the caller can't see are already
 * filtered out server-side, so no client-side classified filtering is needed for
 * visibility (only for the user's explicit confidentiality filter chip).
 */
export function useSchoolDocuments(params: SchoolDocumentsParams) {
  const [allDocs, setAllDocs] = useState<SchoolDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planLocked, setPlanLocked] = useState(false);
  const [planMessage, setPlanMessage] = useState<string | null>(null);

  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    (async () => {
      try {
        const [cats, docsResult] = await Promise.all([listCategories(), listDocuments()]);
        if (requestId.current !== id) return;
        const docs = isPaginatedEnvelope(docsResult) ? docsResult.data : docsResult;
        setCategories(cats);
        setAllDocs(docs);
        setPlanLocked(false);
        setPlanMessage(null);
      } catch (err) {
        if (requestId.current !== id) return;
        if (isFeatureLocked(err)) {
          setPlanLocked(true);
          setPlanMessage(err instanceof ApiError ? err.message : "This feature isn't included in your school's plan.");
          setCategories([]);
          setAllDocs([]);
        } else {
          Alert.alert('Error', errorMessage(err));
        }
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = load;

  const categoriesWithAll = useMemo<DocumentCategory[]>(
    () => [{ id: ALL_CATEGORY_ID, name: 'All documents', documentCount: allDocs.length }, ...categories],
    [categories, allDocs.length]
  );

  const data = useMemo(() => {
    const q = params.search.trim().toLowerCase();
    const today = todayIso();
    const soonLimit = addDaysIso(30);
    return allDocs
      .filter((d) => {
        if (params.categoryId && d.categoryId !== params.categoryId) return false;
        if (params.confidentiality !== 'all' && d.confidentiality !== params.confidentiality) return false;
        if (params.expiry === 'expired' && !(d.expiryDate !== null && d.expiryDate < today)) return false;
        if (params.expiry === 'none' && d.expiryDate !== null) return false;
        if (params.expiry === 'soon' && !(d.expiryDate !== null && d.expiryDate >= today && d.expiryDate <= soonLimit)) {
          return false;
        }
        if (!q) return true;
        return d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  }, [allDocs, params.search, params.categoryId, params.confidentiality, params.expiry]);

  const add = useCallback(
    async (payload: UploadDocumentPayload, file: FilePart) => {
      await uploadDocument(payload, file);
      refetch();
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, payload: UpdateSchoolDocumentPayload) => {
      await updateDocument(id, payload);
      refetch();
    },
    [refetch]
  );

  /** Uploads a new version onto an existing document — title/category/confidentiality carry over. */
  const addVersion = useCallback(
    async (id: string, payload: UploadVersionPayload, file: FilePart) => {
      await uploadNewVersion(id, payload, file);
      refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(id);
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  const getVersions = useCallback(async (id: string): Promise<DocumentVersion[]> => {
    try {
      return await apiGetVersions(id);
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
      return [];
    }
  }, []);

  return {
    data,
    total: data.length,
    categories: categoriesWithAll,
    isLoading,
    planLocked,
    planMessage,
    refetch,
    add,
    update,
    addVersion,
    remove,
    getVersions,
  };
}

export { errorMessage as schoolDocumentsErrorMessage };
export type { SchoolDocument, DocumentCategory, DocumentVersion, Confidentiality };
