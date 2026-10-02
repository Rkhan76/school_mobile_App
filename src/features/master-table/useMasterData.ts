import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import * as api from './api';
import type { Draft, MasterData, MasterEntityMap, TabKey } from './types';

const READ_ONLY_TITLE = 'Not editable here';
const READ_ONLY_MESSAGE = "Categories are managed automatically and can't be edited here yet.";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}

/** Fetches the full row set for one tab. Leave Types is the only paginated endpoint of the
 * six — this screen has no pager UI, so it requests a large page to approximate "all rows"
 * (these are small settings catalogs; this is expected to comfortably cover real usage). */
async function fetchTabData(tab: TabKey): Promise<unknown[]> {
  switch (tab) {
    case 'academicYears':
      return api.listAcademicYears();
    case 'leaveTypes':
      return (await api.listLeaveTypes({ limit: 200 })).data;
    case 'feeTypes':
      return api.listFeeCategories();
    case 'examTypes':
      return api.listExamTypesM();
    case 'periods':
      return api.listPeriodsM();
    case 'documentCategories':
      return api.listDocumentCategoriesM();
    default:
      return [];
  }
}

async function createTabRecord(tab: TabKey, draft: unknown): Promise<unknown> {
  switch (tab) {
    case 'academicYears':
      return api.createAcademicYear(draft as Parameters<typeof api.createAcademicYear>[0]);
    case 'leaveTypes':
      return api.createLeaveType(draft as Parameters<typeof api.createLeaveType>[0]);
    case 'feeTypes':
      return api.createFeeCategory(draft as Parameters<typeof api.createFeeCategory>[0]);
    case 'examTypes':
      return api.createExamTypeM(draft as Parameters<typeof api.createExamTypeM>[0]);
    case 'periods':
      return api.createPeriodM(draft as Parameters<typeof api.createPeriodM>[0]);
    case 'documentCategories':
    default:
      throw new Error('This catalog cannot be created from this screen.');
  }
}

async function updateTabRecord(tab: TabKey, id: string, patch: unknown): Promise<unknown> {
  switch (tab) {
    case 'academicYears':
      return api.updateAcademicYear(id, patch as Partial<Parameters<typeof api.createAcademicYear>[0]>);
    case 'leaveTypes':
      return api.updateLeaveType(id, patch as Partial<Parameters<typeof api.createLeaveType>[0]>);
    case 'feeTypes':
      return api.updateFeeCategory(id, patch as Partial<Parameters<typeof api.createFeeCategory>[0]>);
    case 'examTypes':
      return api.updateExamTypeM(id, patch as Partial<Parameters<typeof api.createExamTypeM>[0]>);
    case 'periods':
      return api.updatePeriodM(id, patch as Partial<Parameters<typeof api.createPeriodM>[0]>);
    case 'documentCategories':
    default:
      throw new Error('This catalog cannot be edited from this screen.');
  }
}

async function removeTabRecord(tab: TabKey, id: string): Promise<void> {
  switch (tab) {
    case 'academicYears':
      return api.deleteAcademicYear(id);
    case 'leaveTypes':
      return api.deleteLeaveType(id);
    case 'feeTypes':
      return api.deleteFeeCategory(id);
    case 'examTypes':
      return api.deleteExamTypeM(id);
    case 'periods':
      return api.deletePeriodM(id);
    case 'documentCategories':
    default:
      throw new Error('This catalog cannot be deleted from this screen.');
  }
}

/** Real API-backed CRUD for one master tab. Keeps the same consumption shape the mock store
 * had ({data,isLoading,refetch,add,update,remove,setActive}) so MasterTab/MasterCard/FormModal
 * don't need to change — only this file and config.ts were rewritten to talk to the backend. */
export function useMasterData<K extends TabKey>(tab: K): MasterData<K> {
  const [rows, setRows] = useState<MasterEntityMap[K][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const data = await fetchTabData(tab);
        if (mountedRef.current) setRows(data as MasterEntityMap[K][]);
      } catch (err) {
        if (mountedRef.current) {
          Alert.alert('Could not load data', errorMessage(err, 'Please check your connection and try again.'));
        }
      } finally {
        if (mountedRef.current && !silent) setIsLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    setRows([]);
    void load();
    // Reload whenever the tab changes; `load` itself is stable per-tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (draft: Draft<K>) => {
      if (tab === 'documentCategories') {
        Alert.alert(READ_ONLY_TITLE, READ_ONLY_MESSAGE);
        return;
      }
      try {
        await createTabRecord(tab, draft);
        await load(true);
      } catch (err) {
        Alert.alert('Could not create', errorMessage(err, 'Something went wrong. Please try again.'));
      }
    },
    [tab, load]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Draft<K>>) => {
      if (tab === 'documentCategories') {
        Alert.alert(READ_ONLY_TITLE, READ_ONLY_MESSAGE);
        return;
      }
      try {
        await updateTabRecord(tab, id, patch);
        await load(true);
      } catch (err) {
        Alert.alert('Could not save changes', errorMessage(err, 'Something went wrong. Please try again.'));
      }
    },
    [tab, load]
  );

  const remove = useCallback(
    async (id: string) => {
      if (tab === 'documentCategories') {
        Alert.alert(READ_ONLY_TITLE, READ_ONLY_MESSAGE);
        return;
      }
      try {
        await removeTabRecord(tab, id);
        await load(true);
      } catch (err) {
        Alert.alert('Could not delete', errorMessage(err, 'Something went wrong. Please try again.'));
      }
    },
    [tab, load]
  );

  const setActive = useCallback(
    async (id: string) => {
      if (tab !== 'academicYears') return;
      try {
        await api.setActiveAcademicYear(id);
        await load(true);
      } catch (err) {
        Alert.alert('Could not set active year', errorMessage(err, 'Something went wrong. Please try again.'));
      }
    },
    [tab, load]
  );

  return { data: rows, isLoading, refetch, add, update, remove, setActive };
}
