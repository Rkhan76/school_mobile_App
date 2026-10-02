import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getNoticePdf } from './api';

/** Strips characters that aren't safe in a filename across platforms. */
function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9-_. ]/g, '').trim();
  return cleaned.length > 0 ? cleaned : 'notice.pdf';
}

/**
 * Downloads the notice's PDF (generated live by the backend) to a cache file
 * and opens the native share/print sheet. Caller is responsible for
 * permission gating (notice.pdf.read) and surfacing errors.
 */
export async function downloadAndShareNoticePdf(id: string): Promise<void> {
  const { blob, fileName } = await getNoticePdf(id);
  const bytes = new Uint8Array(blob);

  const file = new File(Paths.cache, sanitizeFileName(fileName));
  file.write(bytes);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  // Note: the cache file is intentionally left in place rather than deleted
  // right after — some target apps on Android read it asynchronously after
  // shareAsync's promise resolves, so an immediate delete can race them.
  // It's in the OS-managed cache directory, so it'll be reclaimed naturally.
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: fileName,
  });
}
