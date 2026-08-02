import crypto from "node:crypto";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { type CollectionConfig, getFieldsToSign, jwtSign } from "payload";
import { getPayloadClient } from "@/lib/get-payload";
import type { User } from "@/payload-types";

// ponytail: raw PAYLOAD_SECRET reused as the OAuth state HMAC key — no new env
// var. JWT signing uses payload.secret (SHA-256-hashed variant) — separate
// concern, handled in issueSession below.
const STATE_SECRET = process.env.PAYLOAD_SECRET || "";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v3/userinfo";
export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export const CALLBACK_PATH = "/oauth/google/callback";

const STATE_COOKIE = "oauth-state";
const STATE_MAX_AGE = 600; // 10 min

function serverURL(): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL || "").replace(/\/$/, "");
}

export function callbackURL(): string {
  return `${serverURL()}${CALLBACK_PATH}`;
}

// --- CSRF state: signature is HMAC; nonce lives in an httpOnly cookie. ---

export function signState(nonce: string): string {
  const mac = crypto.createHmac("sha256", STATE_SECRET).update(nonce).digest();
  return `${nonce}.${mac.toString("base64url")}`;
}

export function verifyState(
  state: string,
  cookieNonce: string | undefined,
): boolean {
  const lastDot = state.lastIndexOf(".");
  if (lastDot === -1) return false;
  const nonce = state.slice(0, lastDot);
  const mac = state.slice(lastDot + 1);
  if (!cookieNonce) return false;
  const nonceBuf = Buffer.from(nonce);
  const cookieBuf = Buffer.from(cookieNonce);
  if (nonceBuf.length !== cookieBuf.length || nonceBuf.length === 0)
    return false;
  if (!crypto.timingSafeEqual(nonceBuf, cookieBuf)) return false;
  const expected = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(nonce)
    .digest("base64url");
  // ponytail: no mac length check before timingSafeEqual — base64url stddev is
  // tiny and Node throws on mismatched lengths; equalLen guard keeps it safe.
  if (expected.length !== mac.length || expected.length === 0) return false;
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}

export function setStateCookie(cookies: ReadonlyRequestCookies, nonce: string) {
  cookies.set(STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: STATE_MAX_AGE,
    path: "/",
  });
}

export function clearStateCookie(cookies: ReadonlyRequestCookies) {
  cookies.delete(STATE_COOKIE);
}

// --- Google token exchange + userinfo ---

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function exchangeCode(code: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: callbackURL(),
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error(
      `google token exchange failed: ${data.error || res.status}`,
    );
  }
  return data.access_token;
}

export async function fetchUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`google userinfo failed: ${res.status}`);
  return (await res.json()) as GoogleUserInfo;
}

// --- Find-or-create Payload user, then mint the same JWT payload-token uses. ---

const SESSION_TTL = 604800; // ponytail: mirrors lib/types.ts cookie maxAge

export async function findOrCreateGoogleUser(
  info: GoogleUserInfo,
): Promise<User> {
  const payload = await getPayloadClient();
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: info.email } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs.length) {
    const user = existing.docs[0] as User;
    // ponytail: Google confirmed email ownership — upgrade a previously-unverified
    // password account so the real owner can review immediately. No downgrade path
    // (we never touch _verified once true).
    if (!user._verified) {
      await payload.update({
        collection: "users",
        id: user.id,
        data: { _verified: true },
        overrideAccess: true,
      });
    }
    return user;
  }

  // ponytail: random password — local strategy requires one; Google users can't
  // log in by password. If password login is needed later, add a "set password"
  // flow rather than weakening this.
  const password = crypto.randomBytes(32).toString("hex");
  const created = await payload.create({
    collection: "users",
    overrideAccess: true,
    disableVerificationEmail: true,
    data: {
      email: info.email,
      name: info.name || info.email.split("@")[0],
      role: "reviewer",
      password,
      _verified: true,
    },
  });
  return created as User;
}

export async function issueSession(user: User): Promise<string> {
  const payload = await getPayloadClient();
  const collectionConfig = payload.collections.users.config as CollectionConfig;
  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: user.email,
    user,
  });
  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: SESSION_TTL,
  });
  return token;
}
