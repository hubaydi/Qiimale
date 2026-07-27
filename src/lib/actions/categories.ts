"use server";

import type { RequiredDataFromCollectionSlug } from "payload";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Category } from "@/payload-types";

const schema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().optional(),
});

export async function createCategory(
  name: string,
  icon?: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse({ name, icon });
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Category name is required",
    );
  }
  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Please log in first.");
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {
    name: parsed.data.name,
    generateSlug: true,
  };
  if (parsed.data.icon) {
    data.icon = parsed.data.icon;
  }
  const created = (await payload.create({
    collection: "categories",
    data: data as RequiredDataFromCollectionSlug<"categories">,
    overrideAccess: false,
    user,
  })) as Category;
  return { ok: true, data: { id: created.id } };
}
