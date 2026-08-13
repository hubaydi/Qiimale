import { Search, ShieldCheck, Star, Store, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion";
import { SectionHeader } from "@/components/SectionHeader";

const steps = [
  { icon: Search, titleKey: "howAddTitle", bodyKey: "howAdd" },
  { icon: Star, titleKey: "howReviewTitle", bodyKey: "howReview" },
  { icon: ShieldCheck, titleKey: "howTrustTitle", bodyKey: "howTrust" },
] as const;

export async function AboutQiimale({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("About");

  return (
    <section
      aria-labelledby="about-title"
      className={compact ? "space-y-6" : "space-y-8"}
    >
      <SectionHeader title={t("title")} />
      <Reveal as="div" className="space-y-8">
        <p
          className={`max-w-3xl leading-relaxed text-muted-foreground ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {t("intro")}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store size={18} />
              </div>
              <h3 className="font-semibold text-foreground">{t("whyTitle")}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("why")}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users size={18} />
              </div>
              <h3 className="font-semibold text-foreground">{t("howTitle")}</h3>
            </div>
            <ul className="mt-4 space-y-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.titleKey} className="flex gap-3">
                    <Icon
                      size={18}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t(step.titleKey)}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t(step.bodyKey)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
