import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
};

export default withPayload(nextConfig);
