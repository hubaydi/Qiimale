"use server";

import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";

export async function uploadMedia(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return error("VALIDATION", "Image is required");
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (!user._verified) return error("UNVERIFIED", "Verify email first");

  const buffer = Buffer.from(await file.arrayBuffer());
  const payload = await getPayloadClient();
  const doc = await payload.create({
    collection: "media",
    data: {},
    file: {
      data: buffer,
      mimetype: file.type,
      name: file.name,
      size: file.size,
    },
    overrideAccess: true,
    user,
  });
  return { ok: true, data: { id: String(doc.id) } };
}
