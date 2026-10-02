// schoolUserId -> display name cache.
//
// Chat API payloads never embed names (see MOBILE_API_DOCS.md §18 / the
// backend's chat-frontend-integration.md §3.1) — only raw `schoolUserId`s.
// There's no batch user-lookup-by-id endpoint exposed to every role, so we
// opportunistically cache whoever we see via the school-users picker (and the
// current session user) and fall back to a generic placeholder for anyone
// else, rather than blocking the UI on a lookup.
import type { SchoolUserLookupRow } from './types';

const cache = new Map<string, string>();

function fullName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

export function cachePerson(id: string, name: string): void {
  if (name.trim()) cache.set(id, name.trim());
}

export function cacheSchoolUsers(rows: SchoolUserLookupRow[]): void {
  for (const row of rows) cachePerson(row.id, fullName(row.firstName, row.lastName));
}

export function personName(id: string | null | undefined): string {
  if (!id) return 'Unknown';
  return cache.get(id) ?? 'Member';
}
