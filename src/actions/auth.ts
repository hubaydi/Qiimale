"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { CollectionConfig } from "payload";
import {
  type AuthenticationError,
  getFieldsToSign,
  jwtSign,
  UnverifiedEmail,
  ValidationError,
} from "payload";
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

// ponytail: mirrors lib/types.ts cookie maxAge — if one changes, change both
const TOKEN_EXPIRATION = 7200;

async function issueUnverifiedSession(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  user: User,
  email: string,
): Promise<string> {
  const collectionConfig = payload.collections.users.config as CollectionConfig;
  const fieldsToSign = getFieldsToSign({ collectionConfig, email, user });
  const { token } = await jwtSign({
    fieldsToSign,
    secret: process.env.PAYLOAD_SECRET || "",
    tokenExpiration: TOKEN_EXPIRATION,
  });
  return token;
}

export async function registerUser(
  input: z.infer<typeof registerSchema> & Record<string, unknown>,
): Promise<ActionResult<{ message: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success)
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );

  const payload = await getPayloadClient();
  const cookieStore = await cookies();

  // ponytail: the Mongoose unique index on email is the real dup guard, so we
  // let create throw and map the dup-key error to CONFLICT — race-free, no find-then-create.
  try {
    const user = await payload.create({
      collection: "users",
      data: { ...parsed.data, role: "reviewer" },
    });
    // payload.create auto-sends the verification email because auth.verify is on.
    const token = await issueUnverifiedSession(
      payload,
      user,
      parsed.data.email,
    );
    setSessionCookie(cookieStore, token);
    return { ok: true, data: { message: "registered" } };
  } catch (err) {
    // ponytail: Payload throws ValidationError on email-uniqueness BEFORE the DB write
    // (it validates in-app), not a Mongo E11000. Match by path so real validation
    // bugs (e.g. password too short) still surface instead of masquerading as CONFLICT.
    if (
      err instanceof ValidationError &&
      err.data?.errors?.some((e) => e.path === "email")
    ) {
      return error("CONFLICT", "Email already registered.");
    }
    throw err;
  }
}

export async function loginUser(
  input: z.infer<typeof loginSchema> & Record<string, unknown>,
): Promise<ActionResult<{ verified: boolean }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success)
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );

  const payload = await getPayloadClient();
  const cookieStore = await cookies();

  try {
    // ponytail: payload.login validates the password THEN throws UnverifiedEmail,
    // so by the time we catch it the password is already proven correct.
    const result = await payload.login({
      collection: "users",
      data: { email: parsed.data.email, password: parsed.data.password },
    });
    if (!result.token) return error("WRONG_PASSWORD", "Login failed");
    setSessionCookie(cookieStore, result.token);
    return { ok: true, data: { verified: true } };
  } catch (err) {
    // ponytail: instanceof (not a message regex) so i18n rewording can't break the branch.
    if (err instanceof UnverifiedEmail) {
      const users = await payload.find({
        collection: "users",
        where: { email: { equals: parsed.data.email } },
        limit: 1,
        overrideAccess: true,
      });
      if (!users.docs.length)
        return error("WRONG_PASSWORD", "Invalid credentials");
      const token = await issueUnverifiedSession(
        payload,
        users.docs[0],
        parsed.data.email,
      );
      setSessionCookie(cookieStore, token);
      return { ok: true, data: { verified: false } };
    }
    // AuthenticationError (bad password) or any other failure = same opaque message.
    void (err as AuthenticationError);
    return error("WRONG_PASSWORD", "Invalid credentials");
  }
}

export async function verifyEmail(token: string): Promise<ActionResult<true>> {
  if (!token) return error("VALIDATION", "Missing token");
  // ponytail: no JWT re-sign needed — payload.auth does a fresh DB findByID for
  // req.user, so _verified is always live. Verify; the next getCurrentUser() sees truth.
  const payload = await getPayloadClient();
  const ok = await payload.verifyEmail({ collection: "users", token });
  if (!ok) return error("VALIDATION", "Verification failed");
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
  // ponytail: silent success — never leak whether an email is registered.
  if (!users.docs.length) return { ok: true, data: true };
  const user = users.docs[0] as User;
  if (user._verified) return { ok: true, data: true };

  const token = crypto.randomUUID();
  await payload.update({
    collection: "users",
    id: user.id,
    data: { _verificationToken: token },
    overrideAccess: true,
  });
  // ponytail: keep this HTML in sync with Users.ts auth.verify.generateEmailHTML.
  const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/verify?token=${token}`;
  await payload.sendEmail({
    to: email,
    subject: "Xaqiiji iimaylkaaga Qiimale",
    html: `<p>Fadlan xaqiiji iimaylkaaga qiimaynta Qiimale:</p><p><a href="${url}">${url}</a></p>`,
  });
  return { ok: true, data: true };
}

export async function logoutUser(): Promise<ActionResult<true>> {
  clearSessionCookie(await cookies());
  return { ok: true, data: true };
}
