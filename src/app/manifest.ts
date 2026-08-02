import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Qiimale",
    short_name: "Qiimale",
    description: "Qiimayn goobo & adeegyo Soomaaliya",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
