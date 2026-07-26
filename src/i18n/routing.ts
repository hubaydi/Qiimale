import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["so", "en"],
  defaultLocale: "so",
  localePrefix: "as-needed",
  localeDetection: false,
});
