import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import type { User } from "@/payload-types";
import { getPayloadClient } from "./get-payload";

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
  const me = await payload.auth({
    headers: new Headers({ Cookie: `payload-token=${token}` }),
  });
  return me.user;
}
