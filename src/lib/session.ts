import { jwtVerify } from "jose";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import type { User } from "@/payload-types";
import { getPayloadClient } from "./get-payload";

// ponytail: bypasses payload.auth's verify-gate (jwt strategy returns user: null
// when auth.verify is on and _verified is false). Unverified users ARE authenticated
// — they hold a valid signed JWT. We verify the signature ourselves and fetch the
// user; _verified stays a per-action check (see actions/* _verified gates).
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  return resolveUser(cookieStore);
}

export async function resolveUser(
  cookieStore: ReadonlyRequestCookies,
): Promise<User | null> {
  const token = cookieStore.get("payload-token")?.value;
  if (!token) return null;
  const payload = await getPayloadClient();
  // ponytail: Payload hashes PAYLOAD_SECRET with SHA-256 before signing JWTs
  // (payload/dist/index.js: this.secret = sha256(config.secret).slice(0,32)).
  // Use payload.secret — NOT process.env.PAYLOAD_SECRET — or signature verification fails.
  const secret = new TextEncoder().encode(payload.secret);
  try {
    const { payload: decoded } = await jwtVerify(token, secret);
    if (decoded.collection !== "users") return null;
    const user = await payload.findByID({
      collection: "users",
      id: String(decoded.id),
      overrideAccess: true,
      depth: 0,
    });
    return (user as User) ?? null;
  } catch {
    return null;
  }
}
