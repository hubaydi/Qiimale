import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Categories } from "./collections/Categories";
import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";

export default buildConfig({
  editor: lexicalEditor(),

  collections: [Users, Categories, Posts],

  secret: process.env.PAYLOAD_SECRET || "",
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  sharp,
});
