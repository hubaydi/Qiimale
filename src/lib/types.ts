export type ErrorCode =
  | "UNAUTHENTICATED"
  | "UNVERIFIED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "ALREADY_FLAGGED"
  | "SELF_UPVOTE"
  | "VALIDATION"
  | "CONFLICT";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string } };

export const SESSION_COOKIE = "payload-token";

type CookieStore = Awaited<
  ReturnType<typeof import("next/headers")["cookies"]>
>;

export function setSessionCookie(cookies: CookieStore, token: string) {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7200,
  });
}

export function clearSessionCookie(cookies: CookieStore) {
  cookies.delete(SESSION_COOKIE);
}

export function error(code: ErrorCode, message: string): ActionResult<never> {
  return { ok: false, error: { code, message } };
}
