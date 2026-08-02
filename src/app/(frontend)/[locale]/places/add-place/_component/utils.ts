export function getLocalizedName(
  name: string | { so?: string; en?: string },
  locale: string,
): string {
  if (typeof name === "string") return name;
  if (!name) return "";
  return (locale === "en" ? name.en : name.so) || name.so || name.en || "";
}
