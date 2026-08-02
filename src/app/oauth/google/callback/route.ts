import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearStateCookie,
  exchangeCode,
  fetchUserInfo,
  findOrCreateGoogleUser,
  issueSession,
  verifyState,
} from "@/lib/oauth";
import { setSessionCookie } from "@/lib/types";

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const providerError = params.get("error");

  if (providerError) redirect(failureURL(providerError));
  if (!code || !state) redirect(failureURL());

  const cookieStore = await cookies();
  const nonce = cookieStore.get("oauth-state")?.value;
  if (!verifyState(state, nonce)) {
    clearStateCookie(cookieStore);
    redirect(failureURL("state_mismatch"));
  }
  clearStateCookie(cookieStore);

  // ponytail: result-type over throw/catch — redirect() throws NEXT_REDIRECT
  // and would be swallowed by the catch, so we collect the outcome and
  // redirect exactly once after the try block.
  type Result = { ok: true; token: string } | { ok: false; reason?: string };
  let result: Result;
  try {
    const accessToken = await exchangeCode(code);
    const info = await fetchUserInfo(accessToken);
    if (!info.email || info.email_verified !== true) {
      result = { ok: false, reason: "unverified_email" };
    } else {
      const user = await findOrCreateGoogleUser(info);
      result = { ok: true, token: await issueSession(user) };
    }
  } catch (err) {
    console.error("oauth callback failed", err);
    result = { ok: false };
  }

  if (!result.ok) redirect(failureURL(result.reason));
  setSessionCookie(cookieStore, result.token);
  redirect("/account");
}

function failureURL(reason?: string): string {
  // ponytail: default-locale route (so) — no locale prefix needed.
  return `/login?error=oauth${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`;
}
