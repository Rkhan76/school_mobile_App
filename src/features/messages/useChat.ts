import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import { useSession } from '../auth/session';
import * as api from './api';
import { personName } from './people';
import { emitTyping, onChatEvent } from './socket';
import {
  DELETED_TEXT,
  hasPermission,
  type ChatGroupRow,
  type ChatMessageRow,
  type GroupMember,
  type GroupTab,
  type NewGroupInput,
  type UIChatGroup,
  type UIChatMessage,
} from './types';

export type { GroupTab, NewGroupInput } from './types';
export { DELETED_TEXT } from './types';
export { personName } from './people';

const PAGE_SIZE = 30;

type UiError = { kind: 'plan' | 'forbidden' | 'generic'; message: string };

function toUiError(e: unknown): UiError {
  if (e instanceof ApiError) {
    const body = e.body as { code?: string; message?: string } | undefined;
    if (e.statusCode === 403 && body?.code === 'FEATURE_NOT_IN_PLAN') {
      return { kind: 'plan', message: body?.message ?? "Chat isn't included in your school's current plan." };
    }
    if (e.statusCode === 403) {
      return { kind: 'forbidden', message: "You don't have permission to do this." };
    }
    return { kind: 'generic', message: e.message || 'Something went wrong.' };
  }
  return { kind: 'generic', message: 'Something went wrong. Please try again.' };
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of existing) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Tiny cross-hook store for data the group list and chat screen both care
// about but the REST API itself doesn't provide per group: an unread counter
// and a "last message" preview. MOBILE_API_DOCS.md §18 / the backend's
// chat-frontend-integration.md §6.1 are explicit that there's no per-group
// preview/unread field, and fetching messages for every group just to build
// a list preview would be N+1 — so this is populated purely from what this
// client has actually seen (fetched pages + live socket events).
// ---------------------------------------------------------------------------
type GroupMeta = { unread: number; lastMessage: string; lastAt: string | null };
const metaStore = new Map<string, GroupMeta>();
const metaListeners = new Set<() => void>();
let activeGroupId: string | null = null;

function getMeta(id: string): GroupMeta {
  return metaStore.get(id) ?? { unread: 0, lastMessage: '', lastAt: null };
}
function setMeta(id: string, patch: Partial<GroupMeta>): void {
  metaStore.set(id, { ...getMeta(id), ...patch });
  metaListeners.forEach((l) => l());
}
function useMetaVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    metaListeners.add(listener);
    return () => {
      metaListeners.delete(listener);
    };
  }, []);
  return version;
}

function messagePreview(m: Pick<ChatMessageRow, 'content' | 'deletedAt' | 'senderId'>, selfId: string | undefined): string {
  if (m.deletedAt) return DELETED_TEXT;
  return `${m.senderId === selfId ? 'You: ' : ''}${m.content}`;
}

// ---------------------------------------------------------------------------
// useGroups — "My Chats" / "All Groups" list
// ---------------------------------------------------------------------------
export function useGroups(tab: GroupTab, search: string) {
  const permissions = useSession((s) => s.permissions);
  const user = useSession((s) => s.user);
  const metaVersion = useMetaVersion();

  const canList = hasPermission(permissions, 'chat.list.read');
  const canOversight = hasPermission(permissions, 'chat.oversight.read');
  const canCreate = hasPermission(permissions, 'chat.group.create');
  const allowed = tab === 'mine' ? canList : canOversight;

  const [rows, setRows] = useState<ChatGroupRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<UiError | null>(null);
  const rowsRef = useRef<ChatGroupRow[]>([]);
  rowsRef.current = rows;

  const fetchPage = useCallback(
    async (before: string | undefined, replace: boolean) => {
      if (!allowed) {
        setIsLoading(false);
        return;
      }
      try {
        const fn = tab === 'mine' ? api.listMyGroups : api.listAllGroups;
        const page = await fn({ before, limit: PAGE_SIZE });
        setRows((prev) => (replace ? page : mergeById(prev, page)));
        setHasMore(page.length === PAGE_SIZE);
        setError(null);
      } catch (e) {
        setError(toUiError(e));
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [tab, allowed]
  );

  useEffect(() => {
    setIsLoading(true);
    setRows([]);
    setHasMore(true);
    void fetchPage(undefined, true);
  }, [fetchPage]);

  // Live updates: bump "last message" / unread badge for groups in this list.
  useEffect(() => {
    if (!allowed) return undefined;
    const offNew = onChatEvent<ChatMessageRow>('message:new', (message) => {
      setMeta(message.groupId, {
        lastMessage: messagePreview(message, user?.id),
        lastAt: message.createdAt,
      });
      if (activeGroupId !== message.groupId && message.senderId !== user?.id) {
        setMeta(message.groupId, { unread: getMeta(message.groupId).unread + 1 });
      }
    });
    const offRead = onChatEvent<{ groupId: string; schoolUserId: string; lastReadAt: string }>(
      'read:updated',
      (payload) => {
        if (payload.schoolUserId === user?.id) setMeta(payload.groupId, { unread: 0 });
      }
    );
    return () => {
      offNew();
      offRead();
    };
  }, [allowed, user?.id]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const last = rowsRef.current[rowsRef.current.length - 1];
    if (!last) return;
    setLoadingMore(true);
    void fetchPage(last.id, false);
  }, [fetchPage, loadingMore, hasMore]);

  const q = search.trim().toLowerCase();
  const data: UIChatGroup[] = useMemo(() => {
    const list = rows
      .filter((g) => !q || g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q))
      .map((g) => {
        const meta = getMeta(g.id);
        return {
          id: g.id,
          name: g.name,
          description: g.description ?? '',
          unread: meta.unread,
          lastMessage: meta.lastMessage,
          lastAt: meta.lastAt,
        };
      });
    return [...list].sort((a, b) => {
      if (a.lastAt === null && b.lastAt !== null) return -1;
      if (b.lastAt === null && a.lastAt !== null) return 1;
      return (b.lastAt ?? '').localeCompare(a.lastAt ?? '');
    });
    // metaVersion is read only to force a recompute when the shared meta store changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, metaVersion]);

  const create = useCallback(async (input: NewGroupInput): Promise<ChatGroupRow> => {
    const group = await api.createGroup(input);
    setRows((prev) => [group, ...prev]);
    return group;
  }, []);

  return {
    data,
    isLoading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    canCreate,
    showAllGroupsTab: canOversight,
    create,
  };
}

// ---------------------------------------------------------------------------
// useGroup — one group's header info + membership
// ---------------------------------------------------------------------------
export function useGroup(groupId: string) {
  const user = useSession((s) => s.user);
  const [group, setGroup] = useState<ChatGroupRow | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<UiError | null>(null);

  const refreshMembers = useCallback(async () => {
    try {
      setMembers(await api.getGroupMembers(groupId));
    } catch {
      // keep whatever we already had — the header still works without a fresh roster
    }
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const [g, m] = await Promise.all([api.getGroup(groupId), api.getGroupMembers(groupId)]);
        if (cancelled) return;
        setGroup(g);
        setMembers(m);
      } catch (e) {
        if (!cancelled) setError(toUiError(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  useEffect(() => {
    const offAdded = onChatEvent<{ groupId: string; schoolUserId: string }>('member:added', (p) => {
      if (p.groupId === groupId) void refreshMembers();
    });
    const offRemoved = onChatEvent<{ groupId: string; schoolUserId: string }>('member:removed', (p) => {
      if (p.groupId === groupId) void refreshMembers();
    });
    return () => {
      offAdded();
      offRemoved();
    };
  }, [groupId, refreshMembers]);

  const myMembership = useMemo(() => members.find((m) => m.schoolUserId === user?.id) ?? null, [members, user?.id]);
  const isOwnerOrAdmin = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';
  // A groups/:id fetch that succeeds without a membership row for the current
  // user means access came via oversight (see chat-frontend-integration.md §6.5).
  const isOversightOnly = !isLoading && !error && !myMembership;

  const leave = useCallback(async () => {
    if (!user?.id) return;
    await api.removeMember(groupId, user.id);
  }, [groupId, user?.id]);

  const addMember = useCallback(
    async (schoolUserId: string) => {
      await api.addMember(groupId, schoolUserId);
      await refreshMembers();
    },
    [groupId, refreshMembers]
  );

  const removeMember = useCallback(
    async (schoolUserId: string) => {
      await api.removeMember(groupId, schoolUserId);
      await refreshMembers();
    },
    [groupId, refreshMembers]
  );

  const changeMemberRole = useCallback(
    async (schoolUserId: string, role: 'ADMIN' | 'MEMBER') => {
      await api.changeMemberRole(groupId, schoolUserId, role);
      await refreshMembers();
    },
    [groupId, refreshMembers]
  );

  const uiGroup = useMemo(() => {
    if (!group) return null;
    const meta = getMeta(group.id);
    return {
      id: group.id,
      name: group.name,
      description: group.description ?? '',
      unread: meta.unread,
      lastMessage: meta.lastMessage,
      lastAt: meta.lastAt,
      memberIds: members.map((m) => m.schoolUserId),
    };
  }, [group, members]);

  return {
    group: uiGroup,
    members,
    myMembership,
    isOwnerOrAdmin,
    isOversightOnly,
    isLoading,
    error,
    leave,
    addMember,
    removeMember,
    changeMemberRole,
  };
}

// ---------------------------------------------------------------------------
// useMessages — one group's message history + composer + typing/read state
// ---------------------------------------------------------------------------
export function useMessages(groupId: string) {
  const user = useSession((s) => s.user);
  const permissions = useSession((s) => s.permissions);
  const [rows, setRows] = useState<ChatMessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<UiError | null>(null);
  const [typingName, setTypingName] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowsRef = useRef<ChatMessageRow[]>([]);
  rowsRef.current = rows;

  const canSend = hasPermission(permissions, 'chat.message.create');
  const canDelete = hasPermission(permissions, 'chat.message.delete');

  useEffect(() => {
    activeGroupId = groupId;
    let cancelled = false;
    setIsLoading(true);
    setRows([]);
    setHasMore(true);
    setError(null);

    (async () => {
      try {
        const page = await api.listMessages(groupId, { limit: PAGE_SIZE });
        if (cancelled) return;
        setRows(page);
        setHasMore(page.length === PAGE_SIZE);
        const newest = page[0];
        if (newest) setMeta(groupId, { lastMessage: messagePreview(newest, user?.id), lastAt: newest.createdAt });
      } catch (e) {
        if (!cancelled) setError(toUiError(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
      try {
        await api.markGroupRead(groupId);
        setMeta(groupId, { unread: 0 });
      } catch {
        // best-effort — a failed read receipt isn't worth surfacing as an error
      }
    })();

    return () => {
      cancelled = true;
      if (activeGroupId === groupId) activeGroupId = null;
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [groupId, user?.id]);

  useEffect(() => {
    const offNew = onChatEvent<ChatMessageRow>('message:new', (message) => {
      if (message.groupId !== groupId || message.senderId === user?.id) return; // own sends are appended from the REST response
      setRows((prev) => mergeById(prev, [message]));
      setMeta(groupId, { lastMessage: messagePreview(message, user?.id), lastAt: message.createdAt });
      void api
        .markGroupRead(groupId)
        .then(() => setMeta(groupId, { unread: 0 }))
        .catch(() => {});
    });
    const offDeleted = onChatEvent<{ messageId: string }>('message:deleted', (payload) => {
      setRows((prev) => prev.map((m) => (m.id === payload.messageId ? { ...m, deletedAt: new Date().toISOString() } : m)));
    });
    const offTyping = onChatEvent<{ groupId: string; schoolUserId: string }>('typing', (payload) => {
      if (payload.groupId !== groupId || payload.schoolUserId === user?.id) return;
      setTypingName(personName(payload.schoolUserId));
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(null), 3000);
    });
    return () => {
      offNew();
      offDeleted();
      offTyping();
    };
  }, [groupId, user?.id]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const oldest = rowsRef.current[rowsRef.current.length - 1];
    if (!oldest) return;
    setLoadingMore(true);
    void api
      .listMessages(groupId, { before: oldest.id, limit: PAGE_SIZE })
      .then((page) => {
        setRows((prev) => mergeById(prev, page));
        setHasMore(page.length === PAGE_SIZE);
      })
      .catch((e) => setError(toUiError(e)))
      .finally(() => setLoadingMore(false));
  }, [groupId, loadingMore, hasMore]);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content) return;
      void api
        .sendMessage(groupId, content)
        .then((message) => {
          setRows((prev) => mergeById(prev, [message]));
          setMeta(groupId, { lastMessage: messagePreview(message, user?.id), lastAt: message.createdAt });
        })
        .catch((e) => setError(toUiError(e)));
    },
    [groupId, user?.id]
  );

  const remove = useCallback(
    (messageId: string) => {
      const previous = rowsRef.current;
      setRows((prev) => prev.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m)));
      void api.deleteMessage(groupId, messageId).catch((e) => {
        setRows(previous);
        setError(toUiError(e));
      });
    },
    [groupId]
  );

  const notifyTyping = useCallback(() => emitTyping(groupId), [groupId]);

  const data: UIChatMessage[] = useMemo(
    () =>
      rows.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        senderId: m.senderId,
        senderName: m.senderId === user?.id ? 'You' : personName(m.senderId),
        text: m.content,
        createdAt: m.createdAt,
        deleted: !!m.deletedAt,
      })),
    [rows, user?.id]
  );

  return {
    data,
    isLoading,
    loadingMore,
    hasMore,
    loadMore,
    send,
    remove,
    typing: typingName,
    notifyTyping,
    error,
    canSend,
    canDelete,
  };
}
