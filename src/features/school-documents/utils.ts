export { formatDate } from '../../lib/date';

/** ISO -> "21/08/2026" */
export function isoToInput(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** "21/08/2026" -> ISO, or null when malformed / not a real date. */
export function inputToIso(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function isExpired(expiryDate: string | null): boolean {
  return expiryDate !== null && expiryDate < new Date().toISOString().slice(0, 10);
}

export function fileTypeOf(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return i >= 0 && i < fileName.length - 1 ? fileName.slice(i + 1).toUpperCase() : 'FILE';
}

/** Human-readable size from a byte count, e.g. 1234567 -> "1.2 MB". */
export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
