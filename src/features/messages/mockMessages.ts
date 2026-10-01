import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export const ME_ID = 'u-me';
export const ME_NAME = 'School Admin';

export type Person = { id: string; name: string; role: string };

export type ChatGroup = {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  /** true when the current user belongs to the group ("My Chats") */
  isMember: boolean;
  unread: number;
  lastMessage: string;
  /** ISO timestamp of the last message, null when empty */
  lastAt: string | null;
};

export type ChatMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  deleted: boolean;
};

export type GroupTab = 'mine' | 'all';

export type NewGroupInput = { name: string; description: string; memberIds: string[] };

export const DELETED_TEXT = 'This message was deleted';

export const PEOPLE: Person[] = [
  { id: ME_ID, name: ME_NAME, role: 'Admin' },
  { id: 'u-aarav', name: 'Aarav Sharma', role: 'Teacher' },
  { id: 'u-diya', name: 'Diya Verma', role: 'Teacher' },
  { id: 'u-meera', name: 'Meera Iyer', role: 'Accountant' },
  { id: 'u-rohan', name: 'Rohan Gupta', role: 'Teacher' },
  { id: 'u-sana', name: 'Sana Khan', role: 'Front Office' },
  { id: 'u-vikram', name: 'Vikram Rao', role: 'Librarian' },
  { id: 'u-nisha', name: 'Nisha Patel', role: 'Teacher' },
];

export const personName = (id: string): string => PEOPLE.find((p) => p.id === id)?.name ?? 'Unknown';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Merge two lists by `id`; items in `incoming` replace existing ones, order of first appearance is kept. */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of existing) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

function at(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

let idCounter = 0;
const nextId = (prefix: string): string => `${prefix}${Date.now()}_${idCounter++}`;

function msg(
  id: string, groupId: string, senderId: string, text: string, createdAt: string, deleted = false,
): ChatMessage {
  return { id, groupId, senderId, senderName: personName(senderId), text, createdAt, deleted };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const G1 = 'g-sports';
const G2 = 'g-staff';
const G3 = 'g-admissions';
const G4 = 'g-exam';

const seedMessages: ChatMessage[] = [
  msg('m1', G1, ME_ID, "Kicking off planning for this year's Sports Day — let's use this group to coordinate.", at(1, 0, 24)),
  msg('m2', G1, ME_ID, 'Oops, wrong venue noted.', at(1, 0, 24), true),
  msg('m3', G1, 'u-aarav', 'I can take care of the track events lineup.', at(1, 0, 24)),
  msg('m4', G1, 'u-diya', "I'll handle refreshments and the volunteer roster.", at(1, 0, 24)),
  msg('m5', G1, 'u-rohan', 'Should we book the ground for the full day or just the morning?', at(1, 9, 5)),
  msg('m6', G1, ME_ID, 'Full day please. Heats in the morning, finals after lunch.', at(1, 9, 12)),
  msg('m7', G1, 'u-aarav', 'Noted. I will share the draft schedule by Friday.', at(1, 9, 20)),
  msg('m8', G1, 'u-diya', 'We will need 20 volunteers from classes 9 and 10.', at(0, 8, 40)),
  msg('m9', G1, ME_ID, 'hi', at(0, 8, 50)),
  msg('m10', G1, ME_ID, 'sdkfsad', at(0, 8, 51)),
  msg('m11', G1, 'u-rohan', 'Ordered the medals and certificates, delivery in 3 days.', at(0, 9, 30)),

  msg('m20', G2, 'u-sana', 'Good morning everyone. Staff meeting at 3 PM in the main hall.', at(2, 8, 15)),
  msg('m21', G2, 'u-vikram', 'Library will be closed Saturday for stock verification.', at(2, 10, 2)),
  msg('m22', G2, ME_ID, 'Thanks for the heads up. Please submit pending reports today.', at(1, 11, 0)),
  msg('m23', G2, 'u-meera', 'Fee collection summary for this week is ready.', at(1, 15, 45)),
  msg('m24', G2, 'u-nisha', 'Can someone cover class 8B period 4 tomorrow?', at(0, 7, 55)),
  msg('m25', G2, 'u-diya', 'I am free in period 4, I can cover it.', at(0, 8, 3)),

  msg('m30', G3, 'u-sana', 'We received 12 new applications today.', at(3, 10, 30)),
  msg('m31', G3, ME_ID, 'Great. Please prioritise class 1 and class 6 documents.', at(3, 10, 40)),
  msg('m32', G3, 'u-sana', 'Verified documents for 5 applicants so far.', at(2, 16, 10)),

  msg('m40', G4, 'u-rohan', 'Question paper drafts are due next Monday.', at(4, 12, 0)),
  msg('m41', G4, 'u-nisha', 'Hall allocation sheet is uploaded in the shared folder.', at(3, 9, 15)),
];

function seedGroups(): ChatGroup[] {
  const base: Omit<ChatGroup, 'lastMessage' | 'lastAt'>[] = [
    {
      id: G1, name: 'Sports Day Committee', description: 'Planning for the annual sports day.',
      memberIds: [ME_ID, 'u-aarav', 'u-diya', 'u-rohan'], isMember: true, unread: 2,
    },
    {
      id: G2, name: 'Staff Room', description: 'General announcements and chatter for all staff members.',
      memberIds: PEOPLE.map((p) => p.id), isMember: true, unread: 5,
    },
    {
      id: G3, name: 'New Admissions — Front Office', description: '',
      memberIds: [ME_ID, 'u-sana'], isMember: true, unread: 0,
    },
    {
      id: G4, name: 'Exam Cell', description: 'Question papers, hall allocation and invigilation.',
      memberIds: ['u-rohan', 'u-nisha', 'u-aarav'], isMember: false, unread: 0,
    },
  ];
  return base.map((g) => ({ ...g, ...lastOf(g.id, seedMessages) }));
}

function lastOf(groupId: string, all: ChatMessage[]): { lastMessage: string; lastAt: string | null } {
  const list = all.filter((m) => m.groupId === groupId);
  const last = list[list.length - 1];
  if (!last) return { lastMessage: '', lastAt: null };
  return {
    lastMessage: last.deleted ? DELETED_TEXT : `${last.senderId === ME_ID ? 'You: ' : ''}${last.text}`,
    lastAt: last.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Tiny shared store (so list + chat stay in sync until the API arrives)
// ---------------------------------------------------------------------------
type StoreState = { groups: ChatGroup[]; messages: Record<string, ChatMessage[]> };

function groupBy(all: ChatMessage[]): Record<string, ChatMessage[]> {
  const out: Record<string, ChatMessage[]> = {};
  for (const m of all) (out[m.groupId] ??= []).push(m);
  return out;
}

let state: StoreState = { groups: seedGroups(), messages: groupBy(seedMessages) };
const listeners = new Set<() => void>();
let activeGroupId: string | null = null;

function setState(next: StoreState) {
  state = next;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getState = () => state;

function refreshGroup(s: StoreState, groupId: string, patch?: Partial<ChatGroup>): StoreState {
  const msgs = s.messages[groupId] ?? [];
  return {
    ...s,
    groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...lastOf(groupId, msgs), ...patch } : g)),
  };
}

function appendMessage(m: ChatMessage, incoming: boolean) {
  const merged = mergeById(state.messages[m.groupId] ?? [], [m]);
  const group = state.groups.find((g) => g.id === m.groupId);
  const unread = incoming && activeGroupId !== m.groupId ? (group?.unread ?? 0) + 1 : group?.unread ?? 0;
  setState(refreshGroup({ ...state, messages: { ...state.messages, [m.groupId]: merged } }, m.groupId, { unread }));
}

function markRead(groupId: string) {
  const g = state.groups.find((x) => x.id === groupId);
  if (g && g.unread > 0) setState(refreshGroup(state, groupId, { unread: 0 }));
}

function createGroup(input: NewGroupInput): string {
  const id = nextId('g-');
  const group: ChatGroup = {
    id,
    name: input.name,
    description: input.description,
    memberIds: Array.from(new Set([ME_ID, ...input.memberIds])),
    isMember: true,
    unread: 0,
    lastMessage: '',
    lastAt: null,
  };
  setState({ ...state, groups: [group, ...state.groups], messages: { ...state.messages, [id]: [] } });
  return id;
}

function leaveGroup(groupId: string) {
  setState({
    ...state,
    groups: state.groups.map((g) =>
      g.id === groupId ? { ...g, isMember: false, unread: 0, memberIds: g.memberIds.filter((i) => i !== ME_ID) } : g,
    ),
  });
}

const FAKE_DELAY = 450;

function useFakeLoading(): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), FAKE_DELAY);
    return () => clearTimeout(t);
  }, []);
  return loading;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
function sortByRecent(a: ChatGroup, b: ChatGroup): number {
  return (b.lastAt ?? '').localeCompare(a.lastAt ?? '');
}

export function useGroups(tab: GroupTab, search: string) {
  const s = useSyncExternalStore(subscribe, getState);
  const isLoading = useFakeLoading();
  const q = search.trim().toLowerCase();

  const data = useMemo(() => {
    const list = s.groups.filter((g) => {
      if (tab === 'mine' && !g.isMember) return false;
      if (!q) return true;
      return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    });
    // groups without messages (new) stay on top, then most recent first
    return [...list].sort((a, b) => (a.lastAt === null && b.lastAt !== null ? -1 : b.lastAt === null && a.lastAt !== null ? 1 : sortByRecent(a, b)));
  }, [s.groups, tab, q]);

  const create = useCallback((input: NewGroupInput) => createGroup(input), []);
  return { data, isLoading, create };
}

export function useGroup(groupId: string) {
  const s = useSyncExternalStore(subscribe, getState);
  const group = s.groups.find((g) => g.id === groupId) ?? null;
  const leave = useCallback(() => leaveGroup(groupId), [groupId]);
  return { group, leave };
}

const REPLIES = [
  'Sounds good to me.',
  'Got it, thanks for the update.',
  'I will look into it and get back to you.',
  'Can we discuss this in tomorrow\'s meeting?',
  'Done from my side.',
  'Agreed. Let us go ahead with that.',
];

export function useMessages(groupId: string) {
  const s = useSyncExternalStore(subscribe, getState);
  const isLoading = useFakeLoading();
  const [typing, setTyping] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pending = useRef(0);

  useEffect(() => {
    activeGroupId = groupId;
    markRead(groupId);
    const pendingTimers = timers.current;
    return () => {
      if (activeGroupId === groupId) activeGroupId = null;
      pendingTimers.forEach(clearTimeout);
    };
  }, [groupId]);

  const data = s.messages[groupId] ?? [];

  const send = useCallback((text: string) => {
    const body = text.trim();
    if (!body) return;
    appendMessage(
      {
        id: nextId('m'), groupId, senderId: ME_ID, senderName: ME_NAME,
        text: body, createdAt: new Date().toISOString(), deleted: false,
      },
      false,
    );

    const group = state.groups.find((g) => g.id === groupId);
    const others = (group?.memberIds ?? []).filter((id) => id !== ME_ID);
    if (others.length === 0) return;
    const replier = others[Math.floor(Math.random() * others.length)];
    pending.current += 1;
    setTyping(personName(replier));
    timers.current.push(
      setTimeout(() => {
        appendMessage(
          {
            id: nextId('m'), groupId, senderId: replier, senderName: personName(replier),
            text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
            createdAt: new Date().toISOString(), deleted: false,
          },
          true,
        );
        pending.current -= 1;
        if (pending.current <= 0) { pending.current = 0; setTyping(null); }
      }, 1500),
    );
  }, [groupId]);

  const remove = useCallback((messageId: string) => {
    const list = state.messages[groupId] ?? [];
    const updated = list.map((m) => (m.id === messageId ? { ...m, deleted: true } : m));
    setState(refreshGroup({ ...state, messages: { ...state.messages, [groupId]: updated } }, groupId));
  }, [groupId]);

  return { data, isLoading, send, remove, typing };
}
