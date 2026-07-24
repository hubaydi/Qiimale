import path from "node:path";
import { fileURLToPath } from "node:url";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { r2Storage } from "@payloadcms/storage-r2";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Categories } from "./collections/Categories";
import { Cities } from "./collections/Cities";
import { Media } from "./collections/Media";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    importMap: { baseDir: path.resolve(dirname) },
  },
  editor: lexicalEditor(),
  collections: [Users, Categories, Cities, Media],
  localization: {
    locales: ["so", "en"],
    defaultLocale: "so",
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || "",
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  sharp: sharp as unknown as never,
  typescript: {
    outputFile: path.resolve(dirname, "../payload-types.ts"),
  },
  plugins: [
    // ponytail: 3.86 storage-r2 expects a Cloudflare R2Bucket binding, not
    // AWS-style credentials. Wiring the real binding is a deploy-time task;
    // in dev the Media collection falls back to Payload's local-disk storage.
    ...(process.env.R2_BUCKET
      ? [
          r2Storage({
            collections: { media: true },
            bucket: process.env.R2_BUCKET,
          } as unknown as Parameters<typeof r2Storage>[0]),
        ]
      : []),
  ],
});
