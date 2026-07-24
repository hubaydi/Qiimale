import path from "node:path";
import { fileURLToPath } from "node:url";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Categories } from "./collections/Categories";
import { Cities } from "./collections/Cities";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    importMap: { baseDir: path.resolve(dirname) },
  },
  editor: lexicalEditor(),
  collections: [Users, Categories, Cities],
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
});
