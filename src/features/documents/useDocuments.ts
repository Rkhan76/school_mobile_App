import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import {
  approveDocument,
  bulkCreateRequests,
  cancelRequest,
  createDocumentType,
  createRequest,
  deleteDocumentType,
  listDocumentTypes,
  listExpiring,
  listRequests,
  listReviewQueue,
  rejectDocument,
  remindRequest,
  updateDocumentType,
} from './api';
import type {
  BulkCreateInput,
  BulkCreateResult,
  DocumentRequestRow,
  DocumentType,
  DocumentTypeInput,
  DocumentTypeUpdateInput,
  EntityDocument,
  EntityType,
  RequestStatusFilter,
} from './types';

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

/* ----------------------------- document types ----------------------------- */

export function useDocumentTypes() {
  const [data, setData] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    (async () => {
      try {
        const list = await listDocumentTypes();
        if (requestId.current !== id) return;
        setData(list);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(
    async (input: DocumentTypeInput) => {
      try {
        await createDocumentType(input);
        load();
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    [load]
  );

  const update = useCallback(
    async (id: string, input: DocumentTypeUpdateInput) => {
      try {
        await updateDocumentType(id, input);
        load();
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    [load]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDocumentType(id);
        load();
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    [load]
  );

  return { data, isLoading, refetch: load, add, update, remove };
}

/* ----------------------------- document requests ----------------------------- */

export type RequestsParams = {
  status: RequestStatusFilter;
  entityType: EntityType | '';
  documentTypeId: string;
  overdueOnly: boolean;
  pageSize: number;
};

export function useRequests(params: RequestsParams) {
  const [data, setData] = useState<DocumentRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);

  const effectiveStatus = params.status === 'OVERDUE' ? undefined : params.status || undefined;
  const effectiveOverdue = params.overdueOnly || params.status === 'OVERDUE' ? true : undefined;

  const fetchPage = useCallback(
    (pageToLoad: number) =>
      listRequests({
        page: pageToLoad,
        limit: params.pageSize,
        status: effectiveStatus,
        entityType: params.entityType || undefined,
        documentTypeId: params.documentTypeId || undefined,
        overdue: effectiveOverdue,
      }),
    [params.pageSize, effectiveStatus, params.entityType, params.documentTypeId, effectiveOverdue]
  );

  const load = useCallback(
    (pageToLoad: number) => {
      const id = ++requestId.current;
      (async () => {
        try {
          const list = await fetchPage(pageToLoad);
          if (requestId.current !== id) return;
          setData((prev) => (pageToLoad === 1 ? list.data : [...prev, ...list.data]));
          setPage(list.page);
          setHasMore(list.page < list.totalPages);
        } catch (err) {
          if (requestId.current !== id) return;
          Alert.alert('Error', errorMessage(err));
        } finally {
          if (requestId.current === id) {
            if (pageToLoad === 1) setIsLoading(false);
            else setIsLoadingMore(false);
          }
        }
      })();
    },
    [fetchPage]
  );

  useEffect(() => {
    setIsLoading(true);
    setHasMore(false);
    load(1);
  }, [load]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    load(page + 1);
  }, [isLoading, isLoadingMore, hasMore, page, load]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    load(1);
  }, [load]);

  const remind = useCallback(async (id: string) => {
    try {
      await remindRequest(id);
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    }
  }, []);

  const cancel = useCallback(
    async (id: string) => {
      try {
        await cancelRequest(id);
        refetch();
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    [refetch]
  );

  /** Surfaces `failed[]` even though the bulk endpoint itself answers 200 —
   * same pattern as admissions' bulk-approve (see useAdmissions.ts). */
  const bulkCreate = useCallback(
    async (input: BulkCreateInput): Promise<BulkCreateResult | null> => {
      try {
        const result = await bulkCreateRequests(input);
        refetch();
        return result;
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
        return null;
      }
    },
    [refetch]
  );

  return { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, remind, cancel, bulkCreate };
}

/* ----------------------------- review queue ----------------------------- */

export function useReviewQueue() {
  const [data, setData] = useState<EntityDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    (async () => {
      try {
        const result = await listReviewQueue({ status: 'PENDING' });
        if (requestId.current !== id) return;
        setData(Array.isArray(result) ? result : result.data);
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = useCallback(async (id: string) => {
    try {
      await approveDocument(id);
      setData((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    }
  }, []);

  const reject = useCallback(async (id: string, reason: string) => {
    try {
      await rejectDocument(id, reason);
      setData((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    }
  }, []);

  return { data, isLoading, refetch: load, approve, reject };
}

/* ----------------------------- expiring ----------------------------- */

export function useExpiring(days: number) {
  const [data, setData] = useState<EntityDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [renewed, setRenewed] = useState<Set<string>>(new Set());
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    (async () => {
      try {
        const list = await listExpiring(days);
        if (requestId.current !== id) return;
        setData(list);
        setRenewed(new Set());
      } catch (err) {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    })();
  }, [days]);

  useEffect(() => { load(); }, [load]);

  /** There's no `requestRenewal`/expiry-specific endpoint (MOBILE_API_DOCS.md
   * §15) — this just opens a fresh request for the same document type + entity. */
  const requestRenewal = useCallback(async (doc: EntityDocument) => {
    try {
      await createRequest({ entityType: doc.entityType, entityId: doc.entityId, documentTypeId: doc.documentTypeId });
      setRenewed((prev) => new Set(prev).add(doc.id));
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    }
  }, []);

  const isRenewed = useCallback((id: string) => renewed.has(id), [renewed]);

  return { data, isLoading, refetch: load, requestRenewal, isRenewed };
}
