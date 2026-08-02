import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  callbackURL,
  GOOGLE_AUTH_URL,
  GOOGLE_SCOPES,
  setStateCookie,
  signState,
} from "@/lib/oauth";

export async function GET(): Promise<Response> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return new Response("Google OAuth not configured", { status: 503 });
  }

  const nonce = randomUUID();
  const state = signState(nonce);
  const cookieStore = await cookies();
  setStateCookie(cookieStore, nonce);

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", callbackURL());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  // ponytail: real 302 — OAuth providers reject fetch/RSC navigation.
  // cache-control: no-store, since this is a one-shot state-bearing redirect.
  return NextResponse.redirect(url, {
    status: 302,
    headers: { "cache-control": "no-store" },
  });
}
