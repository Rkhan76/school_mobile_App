const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function emailError(email: string): string | null {
  if (email.trim().length === 0) return null;
  return isValidEmail(email) ? null : 'Enter a valid email address';
}
