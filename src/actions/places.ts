"use server";

import type { RequiredDataFromCollectionSlug } from "payload";
import { z } from "zod";

import { getPayloadClient } from "@/lib/get-payload";
import { canViewOwnPending } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";

import type { Place } from "@/payload-types";

const schema = z.object({
  name: z.string().min(5).max(100),
  categoryId: z.string(),
  cityId: z.string(),
  address: z.string().optional(),
  description: z.string().max(1000).optional(),
  imageId: z.string().optional(),
});

export async function addPlace(
  input: z.infer<typeof schema> & Record<string, unknown>,
): Promise<ActionResult<{ placeId: string }>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (!user._verified) return error("UNVERIFIED", "Verify email first");

  const payload = await getPayloadClient();

  const [city, category] = await Promise.all([
    payload.findByID({
      collection: "cities",
      id: parsed.data.cityId,
      overrideAccess: true,
      depth: 0,
    }),
    payload.findByID({
      collection: "categories",
      id: parsed.data.categoryId,
      overrideAccess: true,
      depth: 0,
    }),
  ]);
  if (!city || !canViewOwnPending(city, user)) {
    return error("VALIDATION", "Selected city is not available");
  }
  if (!category || !canViewOwnPending(category, user)) {
    return error("VALIDATION", "Selected category is not available");
  }

  const created: Place = await payload.create({
    collection: "places",
    // ponytail: slugField auto-generates `slug` from name when generateSlug=true,
    // but the generated Place type marks slug as required, so cast the input.
    data: {
      name: parsed.data.name,
      generateSlug: true,
      category: parsed.data.categoryId,
      city: parsed.data.cityId,
      address: parsed.data.address,
      description: parsed.data.description,
      image: parsed.data.imageId || undefined,
      status: "pending",
      submittedBy: user.id,
    } as RequiredDataFromCollectionSlug<"places">,
    overrideAccess: true,
    user,
  });
  return { ok: true, data: { placeId: created.id } };
}
