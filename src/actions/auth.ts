"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getFieldsToSign, jwtSign } from "payload";
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
  name: z.string().min(5).max(50),
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
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

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: parsed.data.email } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs.length) {
    return {
      ok: false,
      error: {
        code: "CONFLICT" as const,
        message: "Email already registered.",
      },
    };
  }

  const user = await payload.create({
    collection: "users",
    data: { ...parsed.data, role: "reviewer" },
    draft: false,
  });

  const collectionConfig = payload.collections.users.config;
  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: parsed.data.email,
    user,
  });
  const { token } = await jwtSign({
    fieldsToSign,
    secret: process.env.PAYLOAD_SECRET || "",
    tokenExpiration: collectionConfig.auth.tokenExpiration ?? 7200,
  });
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, token);
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
  const cookieStore = await cookies();

  try {
    const result = await payload.login({
      collection: "users",
      data: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    if (!result.token) {
      return error("UNAUTHENTICATED", "Login failed");
    }
    setSessionCookie(cookieStore, result.token);
    return { ok: true, data: { token: result.token, verified: true } };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "";
    if (/verify|verification|verified/i.test(errMsg)) {
      const users = await payload.find({
        collection: "users",
        where: { email: { equals: parsed.data.email } },
        limit: 1,
        overrideAccess: true,
      });
      if (users.docs.length) {
        const userDoc = users.docs[0] as User;
        const collectionConfig = payload.collections.users.config;
        const fieldsToSign = getFieldsToSign({
          collectionConfig,
          email: parsed.data.email,
          user: userDoc,
        });
        const { token } = await jwtSign({
          fieldsToSign,
          secret: process.env.PAYLOAD_SECRET || "",
          tokenExpiration: collectionConfig.auth.tokenExpiration ?? 7200,
        });
        setSessionCookie(cookieStore, token);
        return { ok: true, data: { token, verified: false } };
      }
    }
    return error("UNAUTHENTICATED", "Invalid credentials");
  }
}

export async function setSessionFromToken(
  token: string,
): Promise<ActionResult<true>> {
  if (!token) return error("VALIDATION", "Missing token");
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, token);
  return { ok: true, data: true };
}

export async function resendVerificationEmail(
  email: string,
): Promise<ActionResult<true>> {
  if (!email) return error("VALIDATION", "Missing email");

  const payload = await getPayloadClient();
  const users = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (!users.docs.length) return { ok: true, data: true };

  const user = users.docs[0] as User;
  if (user._verified) return { ok: true, data: true };

  const verificationToken = crypto.randomUUID();
  await payload.update({
    collection: "users",
    id: user.id,
    data: { _verificationToken: verificationToken },
    overrideAccess: true,
  });

  const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/verify?token=${verificationToken}`;
  await payload.sendEmail({
    to: email,
    subject: "Xaqiiji iimaylkaaga Qiimale",
    html: `<p>Fadlan xaqiiji iimaylkaaga qiimaynta Qiimale:</p><p><a href="${url}">${url}</a></p>`,
  });
  return { ok: true, data: true };
}

export async function logoutUser(): Promise<ActionResult<true>> {
  const cookieStore = await cookies();
  clearSessionCookie(cookieStore);
  return { ok: true, data: true };
}

export async function verifyEmail(token: string): Promise<ActionResult<true>> {
  if (!token) return error("VALIDATION", "Missing token");
  const payload = await getPayloadClient();
  const ok = await payload.verifyEmail({ collection: "users", token });
  if (!ok) return error("VALIDATION", "Verification failed");
  return { ok: true, data: true };
}
