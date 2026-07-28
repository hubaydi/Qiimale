import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getFieldsToSign, jwtSign } from "payload";
import { getPayloadClient } from "@/lib/get-payload";
import type { User } from "@/payload-types";

async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id_token?: string };
  return data.id_token ?? null;
}

function decodeIdToken(idToken: string): { email?: string; name?: string } {
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { email?: string; name?: string };
    return { email: json.email, name: json.name };
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
  const fail = () => NextResponse.redirect(`${serverUrl}/login?error=1`);
  if (!code) return fail();

  const redirectUri = `${serverUrl}/api/auth/google/callback`;
  const idToken = await exchangeCode(code, redirectUri);
  if (!idToken) return fail();

  const { email, name } = decodeIdToken(idToken);
  if (!email) return fail();

  const payload = await getPayloadClient();
  const users = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  let userDoc: User;
  if (users.docs.length) {
    const existing = users.docs[0] as User;
    if (existing._verified) {
      userDoc = existing;
    } else {
      userDoc = (await payload.update({
        collection: "users",
        id: existing.id,
        data: { _verified: true },
        overrideAccess: true,
      })) as User;
    }
  } else {
    userDoc = (await payload.create({
      collection: "users",
      data: {
        email,
        name: name || email.split("@")[0],
        password: randomBytes(32).toString("hex"),
        role: "reviewer",
        _verified: true,
      },
      overrideAccess: true,
    })) as User;
  }

  const collectionConfig = payload.collections.users.config;
  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email,
    user: userDoc,
  });
  const { token } = await jwtSign({
    fieldsToSign,
    secret: process.env.PAYLOAD_SECRET || "",
    tokenExpiration: collectionConfig.auth.tokenExpiration ?? 7200,
  });

  return NextResponse.redirect(`${serverUrl}/auth/callback?token=${token}`);
}
