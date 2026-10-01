export const SCHOOL_INSTANCE = 'greenwood.verdant.edu';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function emailError(email: string): string | null {
  if (email.trim().length === 0) return null;
  return isValidEmail(email) ? null : 'Enter a valid email address';
}

/** Dummy credential check; replaced by the real API later. */
export async function fakeSignIn(email: string, password: string): Promise<boolean> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));
  return email.trim().toLowerCase() === 'admin@verdant.test' && password === 'admin123';
}
