import path from "node:path";
import { fileURLToPath } from "node:url";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Categories } from "./collections/Categories";
import { Cities } from "./collections/Cities";
import { Flags } from "./collections/Flags";
import { Media } from "./collections/Media";
import { Places } from "./collections/Places";
import { Reviews } from "./collections/Reviews";
import { ReviewUpvotes } from "./collections/ReviewUpvotes";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    importMap: { baseDir: path.resolve(dirname) },
  },
  editor: lexicalEditor(),
  collections: [
    Users,
    Categories,
    Cities,
    Media,
    Places,
    Reviews,
    ReviewUpvotes,
    Flags,
  ],
  localization: {
    locales: ["so", "en"],
    defaultLocale: "so",
    fallback: true,
  },
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || "",
    defaultFromName: "Qiimale",
    apiKey: process.env.RESEND_API_KEY || "",
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  sharp: sharp as unknown as never,
  typescript: {
    outputFile: path.resolve(dirname, "../payload-types.ts"),
  },
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: "uploads",
          generateFileURL: ({ filename, prefix }) => {
            return `${process.env.S3_CUSTOM_DOMAIN}/${prefix}/${filename}`;
          },
        },
      },
      bucket: process.env.S3_BUCKET || "",
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET || "",
        },
        region: "auto",
        endpoint: process.env.S3_ENDPOINT || "",
      },
    }),
  ],
});
