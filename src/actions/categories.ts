"use server";

import type { RequiredDataFromCollectionSlug } from "payload";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Category } from "@/payload-types";

const schema = z.object({
  name: z
    .string()
    .min(5, "Category name is required")
    .max(50, "Category name is too long"),
  description: z.string().max(200).optional(),
});

export async function createCategory(
  name: string,
  description?: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse({ name, description });
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Category name is required",
    );
  }

  const user = await getCurrentUser();

  if (!user) return error("UNAUTHENTICATED", "Please log in first.");

  const payload = await getPayloadClient();

  const created: Category = await payload.create({
    collection: "categories",
    data: {
      name: parsed.data.name,
      generateSlug: true,
      description: parsed.data.description,
    } as RequiredDataFromCollectionSlug<"categories">,
    overrideAccess: true,
    user,
  });
  return { ok: true, data: { id: created.id } };
}
