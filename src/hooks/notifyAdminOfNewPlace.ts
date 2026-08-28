import type { CollectionAfterChangeHook } from "payload";
import { render } from "react-email";
import NewPlaceAdminEmail from "@/emails/NewPlaceAdminEmail";
import type { Place } from "@/payload-types";

export const notifyAdminOfNewPlace: CollectionAfterChangeHook<Place> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== "create") return;

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    const cityDoc =
      typeof doc.city === "string"
        ? await req.payload.findByID({
            collection: "cities",
            id: doc.city,
            depth: 0,
            overrideAccess: true,
          })
        : doc.city;

    const categoryDoc =
      typeof doc.category === "string"
        ? await req.payload.findByID({
            collection: "categories",
            id: doc.category,
            depth: 0,
            overrideAccess: true,
          })
        : doc.category;

    const submitterDoc =
      typeof doc.submittedBy === "string"
        ? await req.payload.findByID({
            collection: "users",
            id: doc.submittedBy,
            depth: 0,
            overrideAccess: true,
          })
        : doc.submittedBy;

    const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/admin/collections/places/${doc.id}`;

    await req.payload.sendEmail({
      to: adminEmail,
      subject: `Goob cusub: ${doc.name} — Qiimale`,
      html: await render(
        NewPlaceAdminEmail({
          placeName: doc.name,
          cityName: cityDoc?.name,
          categoryName: categoryDoc?.name,
          submitterEmail: submitterDoc?.email,
          url,
        }),
      ),
    });
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `Failed to send new-place notification email for place ${doc.id}`,
    });
  }
};
