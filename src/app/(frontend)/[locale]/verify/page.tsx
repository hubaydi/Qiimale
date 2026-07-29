import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { verifyEmail } from "@/actions/auth";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getTranslations("Auth");
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-border bg-white text-center space-y-4">
        <XCircle className="mx-auto text-destructive" size={48} />
        <h1 className="text-xl font-bold">{t("verifyFail")}</h1>
      </div>
    );
  }

  const res = await verifyEmail(String(token));

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-border bg-white text-center space-y-4">
      {res.ok ? (
        <>
          <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
          <h1 className="text-xl font-bold">{t("verifySuccess")}</h1>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-xs"
          >
            {t("login")}
          </Link>
        </>
      ) : (
        <>
          <XCircle className="mx-auto text-destructive" size={48} />
          <h1 className="text-xl font-bold">{t("verifyFail")}</h1>
        </>
      )}
    </div>
  );
}
