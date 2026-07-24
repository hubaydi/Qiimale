import { NextResponse } from "next/server";

const SCOPES = ["openid", "email", "profile"];

export async function GET() {
  const redirectUri = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "online",
    prompt: "select_account",
  });
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  );
}
