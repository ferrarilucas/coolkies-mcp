export function requireToken(extra: { authInfo?: { token: string } }): string {
  if (!extra.authInfo?.token) throw new Error("Token ausente.");
  return extra.authInfo.token;
}
