"use server";

import type { RequiredDataFromCollectionSlug } from "payload";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { City } from "@/payload-types";

const schema = z.object({
  name: z.string().min(1, "City name is required"),
});

export async function createCity(
  name: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse({ name });
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "City name is required",
    );
  }
  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Please log in first.");
  const payload = await getPayloadClient();
  const created = (await payload.create({
    collection: "cities",
    data: {
      name: parsed.data.name,
      generateSlug: true,
    } as RequiredDataFromCollectionSlug<"cities">,
    overrideAccess: false,
    user,
  })) as City;
  return { ok: true, data: { id: created.id } };
}
