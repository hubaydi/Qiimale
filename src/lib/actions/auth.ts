"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import {
  type ActionResult,
  clearSessionCookie,
  error,
  setSessionCookie,
} from "@/lib/types";
import type { User } from "@/payload-types";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerUser(
  input: z.infer<typeof registerSchema> & Record<string, unknown>,
): Promise<ActionResult<{ message: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message || "Invalid data",
      },
    };
  }
  const payload = await getPayloadClient();
  try {
    await payload.create({
      collection: "users",
      data: { ...parsed.data, role: "reviewer" },
      draft: false,
    });
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "CONFLICT",
        message: (e as Error)?.message || "Email already in use",
      },
    };
  }
  const cookieStore = await cookies();
  const res = await payload.login({
    collection: "users",
    data: { email: parsed.data.email, password: parsed.data.password },
  });
  if (!res.token || !res.user) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Registered; please verify your email then log in.",
      },
    };
  }
  setSessionCookie(cookieStore, res.token);
  return { ok: true, data: { message: "registered" } };
}

export async function loginUser(
  input: z.infer<typeof loginSchema> & Record<string, unknown>,
): Promise<ActionResult<{ token: string; verified: boolean }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }
  const payload = await getPayloadClient();
  let res: Awaited<ReturnType<typeof payload.login>>;
  try {
    res = await payload.login({ collection: "users", data: parsed.data });
  } catch {
    return error("UNAUTHENTICATED", "Invalid credentials");
  }
  if (!res.token) return error("UNAUTHENTICATED", "Invalid credentials");
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, res.token);
  return {
    ok: true,
    data: {
      token: res.token,
      verified: Boolean((res.user as User)?._verified),
    },
  };
}

export async function logoutUser(): Promise<ActionResult<true>> {
  const cookieStore = await cookies();
  clearSessionCookie(cookieStore);
  return { ok: true, data: true };
}

export async function verifyEmail(token: string): Promise<ActionResult<true>> {
  if (!token) return error("VALIDATION", "Missing token");
  const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/api/users/verify/${token}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) return error("VALIDATION", "Verification failed");
  return { ok: true, data: true };
}
