import { Mail } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResendButton } from "../components/ResendButton";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const t = await getTranslations("Auth");
  const { email } = await searchParams;
  const decodedEmail = email ? decodeURIComponent(email) : "";

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-border bg-white text-center space-y-4">
      <Mail className="mx-auto text-primary" size={48} />
      <h1 className="text-xl font-bold">{t("verifyEmailTitle")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("verifyEmailHint", { email: decodedEmail })}
      </p>
      {decodedEmail && <ResendButton email={decodedEmail} />}
      <p className="text-xs text-muted-foreground">{t("checkSpam")}</p>
      <Link
        href="/login"
        className="inline-block text-sm text-primary hover:underline font-semibold"
      >
        {t("login")}
      </Link>
    </div>
  );
}
