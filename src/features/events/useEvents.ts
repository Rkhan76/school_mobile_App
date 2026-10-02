import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../../lib/apiClient';
import {
  createEvent,
  deleteEvent,
  deleteMedia,
  listEvents,
  listMedia,
  updateEvent,
  uploadEventMedia,
} from './api';
import { monthBounds } from './dateUtils';
import type {
  EventAudience,
  EventMedia,
  EventMediaResourceType,
  EventPayload,
  EventStatus,
  MediaAsset,
  SchoolEvent,
} from './types';

export type EventFilters = {
  search: string;
  status: EventStatus | '';
  targetAudience: EventAudience | '';
  holidaysOnly: boolean;
};

const PAGE_SIZE = 100;

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

/**
 * Fetches every event in the visible calendar month (bounded by `from`/`to`), refetching
 * whenever the month or filters change. `EventsScreen` is a calendar, not a flat feed, so a
 * single generously-sized page realistically covers a month — no infinite-scroll needed here.
 */
export function useEvents(year: number, month: number, filters: EventFilters) {
  const [data, setData] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const { search, status, targetAudience, holidaysOnly } = filters;

  const fetchPage = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    const { from, to } = monthBounds(year, month);
    try {
      const result = await listEvents({
        page: 1,
        limit: PAGE_SIZE,
        from,
        to,
        status: status || undefined,
        targetAudience: targetAudience || undefined,
        isHoliday: holidaysOnly ? true : undefined,
        search: search || undefined,
      });
      if (requestId.current !== id) return;
      setData(result.data);
    } catch (err) {
      if (requestId.current !== id) return;
      Alert.alert('Error', errorMessage(err));
    } finally {
      if (requestId.current === id) setIsLoading(false);
    }
  }, [year, month, search, status, targetAudience, holidaysOnly]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const refetch = useCallback(() => {
    fetchPage();
  }, [fetchPage]);

  const add = useCallback(
    async (input: EventPayload): Promise<boolean> => {
      try {
        await createEvent(input);
        refetch();
        return true;
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
        return false;
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, input: Partial<EventPayload>): Promise<boolean> => {
      try {
        await updateEvent(id, input);
        refetch();
        return true;
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
        return false;
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteEvent(id);
        refetch();
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    [refetch]
  );

  return { data, isLoading, refetch, add, update, remove };
}

/** Media gallery for a single event (direct-to-Cloudinary upload + list/delete). */
export function useEventMedia(eventId: string | null) {
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const requestId = useRef(0);

  const refetch = useCallback(() => {
    if (!eventId) {
      setMedia([]);
      return;
    }
    const id = ++requestId.current;
    setIsLoading(true);
    listMedia(eventId)
      .then((rows) => {
        if (requestId.current !== id) return;
        setMedia(rows);
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        Alert.alert('Error', errorMessage(err));
      })
      .finally(() => {
        if (requestId.current === id) setIsLoading(false);
      });
  }, [eventId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upload = useCallback(
    async (asset: MediaAsset, resourceType: EventMediaResourceType, caption?: string) => {
      if (!eventId) return;
      setIsUploading(true);
      try {
        await uploadEventMedia(eventId, asset, resourceType, caption);
        refetch();
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setIsUploading(false);
      }
    },
    [eventId, refetch]
  );

  const remove = useCallback(
    async (mediaId: string) => {
      if (!eventId) return;
      try {
        await deleteMedia(eventId, mediaId);
        setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      } catch (err) {
        Alert.alert('Error', errorMessage(err));
      }
    },
    [eventId]
  );

  return { media, isLoading, isUploading, upload, remove, refetch };
}
