/**
 * Exact-match permission check. Codes use `<module>.<resource>.<action>`.
 * No wildcard matching, except the single code "*" which grants everything.
 */
export function hasPermission(code: string, codes: readonly string[]): boolean {
  return codes.includes('*') || codes.includes(code);
}
