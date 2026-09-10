const ALLOWED_EMAILS = ["jairolopes99@gmail.com", "njt0404@gmail.com"];

export function isWhitelistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
