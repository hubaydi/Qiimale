"use server";

import { revalidatePath } from "next/cache";
import type { RequiredDataFromCollectionSlug } from "payload";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Place, Service } from "@/payload-types";

const createSchema = z.object({
  name: z.string().min(2, "Service name is required").max(50),
  description: z.string().max(200).optional(),
});

export async function createService(
  name: string,
  description?: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse({ name, description });
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Service name is required",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Please log in first.");
  if (!user._verified) return error("UNVERIFIED", "Verify email first");

  const payload = await getPayloadClient();
  const created = (await payload.create({
    collection: "services",
    data: {
      name: parsed.data.name,
      generateSlug: true,
      description: parsed.data.description,
      status: "pending",
      submittedBy: user.id,
    } as RequiredDataFromCollectionSlug<"services">,
    overrideAccess: true,
    user,
  })) as Service;
  return { ok: true, data: { id: created.id } };
}

const placeCreateSchema = z.object({
  placeId: z.string(),
  name: z.string().min(2, "Service name is required").max(50),
  description: z.string().max(200).optional(),
});

export async function createServiceForPlace(
  input: z.infer<typeof placeCreateSchema> & Record<string, unknown>,
): Promise<ActionResult<{ serviceId: string }>> {
  const parsed = placeCreateSchema.safeParse(input);
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
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Place | null;
  if (!place) return error("NOT_FOUND", "Place not found");

  const created = (await payload.create({
    collection: "services",
    data: {
      name: parsed.data.name,
      generateSlug: true,
      description: parsed.data.description,
      status: "pending",
      submittedBy: user.id,
    } as RequiredDataFromCollectionSlug<"services">,
    overrideAccess: true,
    user,
  })) as Service;

  const current = (place.services ?? []).map((s) =>
    typeof s === "string" ? s : s.id,
  );
  await payload.update({
    collection: "places",
    id: place.id,
    data: { services: [...current, created.id] },
    overrideAccess: true,
    user,
  });

  revalidatePath(`/places/${place.slug}`);
  return { ok: true, data: { serviceId: created.id } };
}

const attachSchema = z.object({
  placeId: z.string(),
  serviceId: z.string(),
});

export async function addServiceToPlace(
  input: z.infer<typeof attachSchema> & Record<string, unknown>,
): Promise<ActionResult<{ placeId: string }>> {
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (user.role !== "admin") return error("FORBIDDEN", "Admin only");

  const payload = await getPayloadClient();
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Place | null;
  const service = (await payload.findByID({
    collection: "services",
    id: parsed.data.serviceId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Service | null;

  if (!place || !service) return error("NOT_FOUND", "Not found");
  if (service.status !== "approved") {
    return error("VALIDATION", "Service is not approved");
  }

  const current = (place.services ?? []).map((s) =>
    typeof s === "string" ? s : s.id,
  );
  if (!current.includes(service.id)) {
    await payload.update({
      collection: "places",
      id: place.id,
      data: { services: [...current, service.id] },
      overrideAccess: true,
      user,
    });
    revalidatePath(`/places/${place.slug}`);
  }
  return { ok: true, data: { placeId: place.id } };
}

export async function removeServiceFromPlace(
  input: z.infer<typeof attachSchema> & Record<string, unknown>,
): Promise<ActionResult<{ placeId: string }>> {
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (user.role !== "admin") return error("FORBIDDEN", "Admin only");

  const payload = await getPayloadClient();
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Place | null;
  if (!place) return error("NOT_FOUND", "Place not found");

  const next = (place.services ?? [])
    .map((s) => (typeof s === "string" ? s : s.id))
    .filter((id) => id !== parsed.data.serviceId);

  await payload.update({
    collection: "places",
    id: place.id,
    data: { services: next },
    overrideAccess: true,
    user,
  });
  revalidatePath(`/places/${place.slug}`);
  return { ok: true, data: { placeId: place.id } };
}
