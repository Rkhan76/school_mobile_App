import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../../config';
import { RECIPIENT_TYPE_LABEL, formatDate, type Certificate } from './types';

/** Strips characters that aren't safe in a filename across platforms. */
function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9-_. ]/g, '').trim();
  return cleaned.length > 0 ? cleaned : 'certificate.html';
}

/** Same resource the QR/link on a printed certificate should point at. */
export function verificationUrl(c: Pick<Certificate, 'verificationToken'>): string {
  return `${API_BASE_URL}/certificates/verify/${c.verificationToken}`;
}

/**
 * Renders the certificate as a standalone, print-friendly HTML document.
 * There's no backend PDF generation for this module (MOBILE_API_DOCS.md
 * §20) and no PDF/image-capture library in this project — HTML is the
 * simplest real, shareable artifact we can build from what's installed
 * (expo-file-system + expo-sharing), and it opens/prints fine from any
 * browser or the native share sheet.
 */
export function buildCertificateHtml(c: Certificate): string {
  const who = RECIPIENT_TYPE_LABEL[c.recipientType].toLowerCase();
  const body =
    c.description?.trim() ||
    `has been awarded this certificate in recognition of their standing as a ${who} of the school, and is hereby certified as per the records of the institution.`;
  const verifyUrl = verificationUrl(c);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${c.referenceNo} — ${escapeHtml(c.title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background: #fdfaf2; margin: 0; padding: 32px; color: #1f2d2a; }
  .outer { max-width: 720px; margin: 0 auto; border: 3px solid #b8893b; border-radius: 8px; padding: 8px; }
  .inner { border: 1px solid #b8893b; border-radius: 4px; padding: 40px 32px; text-align: center; }
  .school { font-size: 26px; font-weight: bold; color: #0a3330; margin: 8px 0 2px; }
  .tagline { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #5b6b68; }
  .rule { width: 80px; height: 2px; background: #b8893b; margin: 16px auto; }
  .cert-title { font-size: 22px; margin: 18px 0 6px; }
  .certify { font-size: 13px; color: #5b6b68; margin-top: 14px; }
  .recipient { font-size: 30px; font-weight: bold; color: #0a3330; margin: 6px 0 18px; }
  .text { font-size: 14px; line-height: 1.7; max-width: 560px; margin: 0 auto; }
  .meta { display: flex; justify-content: space-between; margin-top: 36px; font-size: 12px; }
  .meta .label { text-transform: uppercase; color: #8a948f; font-size: 10px; }
  .sign { margin-top: 48px; }
  .sign .line { width: 160px; height: 1px; background: #1f2d2a; margin: 0 0 6px auto; }
  .sign .who { font-size: 12px; text-align: right; }
  .revoked { margin-top: 20px; color: #b91c1c; font-weight: bold; }
  .verify { margin-top: 28px; font-size: 11px; color: #5b6b68; word-break: break-all; }
  .school-contact { margin-top: 6px; font-size: 11px; color: #5b6b68; }
</style>
</head>
<body>
  <div class="outer">
    <div class="inner">
      ${c.schoolLogo ? `<img src="${escapeAttr(c.schoolLogo)}" alt="" style="height:56px;margin-bottom:8px;" />` : ''}
      <div class="school">${escapeHtml(c.schoolName)}</div>
      ${c.schoolAddress ? `<div class="school-contact">${escapeHtml(c.schoolAddress)}</div>` : ''}
      ${
        c.schoolPhone || c.schoolEmail
          ? `<div class="school-contact">${[c.schoolPhone, c.schoolEmail].filter((v): v is string => !!v).map(escapeHtml).join(' &middot; ')}</div>`
          : ''
      }
      <div class="rule"></div>
      <div class="cert-title">${escapeHtml(c.title)}</div>
      <div class="certify">This is to certify that</div>
      <div class="recipient">${escapeHtml(c.recipientName)}</div>
      <div class="text">${escapeHtml(body)}</div>
      <div class="meta">
        <div><div class="label">Reference No.</div><div>${escapeHtml(c.referenceNo)}</div></div>
        <div style="text-align:right"><div class="label">Issue date</div><div>${escapeHtml(formatDate(c.issueDate))}</div></div>
      </div>
      <div class="sign">
        <div class="line"></div>
        <div class="who">${escapeHtml(c.signatoryName || '')}${c.signatoryName && c.signatoryTitle ? ', ' : ''}${escapeHtml(c.signatoryTitle || (c.signatoryName ? '' : 'Principal'))}</div>
      </div>
      ${c.status === 'REVOKED' ? `<div class="revoked">REVOKED${c.revokedAt ? ` on ${escapeHtml(formatDate(c.revokedAt))}` : ''}${c.revokeReason ? `: ${escapeHtml(c.revokeReason)}` : ''}</div>` : ''}
      <div class="verify">Verify this certificate at: ${escapeHtml(verifyUrl)}</div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

/**
 * Writes the certificate out as an HTML file and opens the native
 * share/print/save sheet for it.
 */
export async function shareCertificate(c: Certificate): Promise<void> {
  const html = buildCertificateHtml(c);
  const file = new File(Paths.cache, sanitizeFileName(`${c.referenceNo}.html`));
  file.write(html);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/html',
    UTI: 'public.html',
    dialogTitle: `${c.referenceNo}.html`,
  });
}

/**
 * Saves the certificate file into a folder the user picks on the device (Downloads, Documents, ...).
 * Resolves to the saved file name, or null if the user cancelled the folder picker.
 */
export async function saveCertificateToDevice(c: Certificate): Promise<string | null> {
  const html = buildCertificateHtml(c);

  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync();
  } catch {
    // The picker rejects when the user backs out; nothing was chosen, so there is nothing to report.
    return null;
  }

  const target = directory.createFile(sanitizeFileName(`${c.referenceNo}.html`), 'text/html');
  target.write(html);
  return target.name;
}
