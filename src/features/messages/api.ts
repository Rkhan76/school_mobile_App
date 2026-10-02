import { apiRequest } from '../../lib/apiClient';
import type {
  ChatGroupMemberRole,
  ChatGroupRow,
  ChatMessageRow,
  GroupMember,
  NewGroupInput,
  PagedResult,
  SchoolUserLookupRow,
} from './types';

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------
export function listMyGroups(params: { before?: string; limit?: number } = {}): Promise<ChatGroupRow[]> {
  return apiRequest<ChatGroupRow[]>(`/chat/groups${qs(params)}`);
}

export function listAllGroups(params: { before?: string; limit?: number } = {}): Promise<ChatGroupRow[]> {
  return apiRequest<ChatGroupRow[]>(`/chat/groups/all${qs(params)}`);
}

export function getGroup(id: string): Promise<ChatGroupRow> {
  return apiRequest<ChatGroupRow>(`/chat/groups/${id}`);
}

export function getGroupMembers(id: string): Promise<GroupMember[]> {
  return apiRequest<GroupMember[]>(`/chat/groups/${id}/members`);
}

export function createGroup(input: NewGroupInput): Promise<ChatGroupRow> {
  return apiRequest<ChatGroupRow>('/chat/groups', { method: 'POST', body: input });
}

export function updateGroup(id: string, patch: { name?: string; description?: string }): Promise<ChatGroupRow> {
  return apiRequest<ChatGroupRow>(`/chat/groups/${id}`, { method: 'PATCH', body: patch });
}

export function deleteGroup(id: string): Promise<void> {
  return apiRequest<void>(`/chat/groups/${id}`, { method: 'DELETE' });
}

export function addMember(groupId: string, schoolUserId: string): Promise<GroupMember> {
  return apiRequest<GroupMember>(`/chat/groups/${groupId}/members`, {
    method: 'POST',
    body: { schoolUserId },
  });
}

/** Also used for "leave group" — pass the current user's own schoolUserId. */
export function removeMember(groupId: string, schoolUserId: string): Promise<void> {
  return apiRequest<void>(`/chat/groups/${groupId}/members/${schoolUserId}`, { method: 'DELETE' });
}

export function changeMemberRole(
  groupId: string,
  schoolUserId: string,
  role: Extract<ChatGroupMemberRole, 'ADMIN' | 'MEMBER'>
): Promise<GroupMember> {
  return apiRequest<GroupMember>(`/chat/groups/${groupId}/members/${schoolUserId}/role`, {
    method: 'PATCH',
    body: { role },
  });
}

export function markGroupRead(groupId: string): Promise<void> {
  return apiRequest<void>(`/chat/groups/${groupId}/read`, { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export function listMessages(
  groupId: string,
  params: { before?: string; limit?: number } = {}
): Promise<ChatMessageRow[]> {
  return apiRequest<ChatMessageRow[]>(`/chat/groups/${groupId}/messages${qs(params)}`);
}

export function sendMessage(groupId: string, content: string): Promise<ChatMessageRow> {
  return apiRequest<ChatMessageRow>(`/chat/groups/${groupId}/messages`, {
    method: 'POST',
    body: { content },
  });
}

export function deleteMessage(groupId: string, messageId: string): Promise<void> {
  return apiRequest<void>(`/chat/groups/${groupId}/messages/${messageId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Member picker lookup — no dedicated lean endpoint exists for this module, so
// this calls the generic "all portal accounts" directory directly
// (`school-user.list.read`, usually ADMIN-only). If the caller lacks that
// permission the request 403s and the member picker should show an inline
// "can't search people" state rather than crash (see NewGroupModal.tsx).
// ---------------------------------------------------------------------------
export function lookupSchoolUsers(
  params: { search?: string; limit?: number; page?: number } = {}
): Promise<PagedResult<SchoolUserLookupRow>> {
  return apiRequest<PagedResult<SchoolUserLookupRow>>(
    `/school-users${qs({ page: params.page ?? 1, limit: params.limit ?? 50, search: params.search })}`
  );
}
