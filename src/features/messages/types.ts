// Real API shapes for the Chat/Messages module — see
// verdant_backend/MOBILE_API_DOCS.md §18 and
// verdant_backend/docs/chat-frontend-integration.md for the source of truth.
// Responses are NOT wrapped: list endpoints return a raw array, single-resource
// endpoints return the raw object.

export type ChatGroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type ChatGroupRow = {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type GroupMember = {
  id: string;
  schoolId: string;
  groupId: string;
  schoolUserId: string;
  role: ChatGroupMemberRole;
  lastReadAt: string | null;
  addedById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ChatMessageRow = {
  id: string;
  schoolId: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type GroupTab = 'mine' | 'all';

export type NewGroupInput = {
  name: string;
  description?: string;
  memberSchoolUserIds: string[];
};

/** `GET /school-users` row — used only as a member-picker lookup here. */
export type SchoolUserLookupRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  roleName: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
};

export type PagedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Lightweight, UI-facing group shape used by the group list + chat header. */
export type UIChatGroup = {
  id: string;
  name: string;
  description: string;
  /** Client-side only — the API has no per-group unread count; see useChat.ts. */
  unread: number;
  /** Client-side only — the API has no per-group last-message preview. */
  lastMessage: string;
  lastAt: string | null;
};

/** UI-facing message shape — `senderName` is resolved client-side, see people.ts. */
export type UIChatMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  deleted: boolean;
};

export const DELETED_TEXT = 'This message was deleted';

export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes('*') || permissions.includes(code);
}
