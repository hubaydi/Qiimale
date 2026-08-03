import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, oklch(0.45 0.24 262) 0%, oklch(0.546 0.222 258) 45%, oklch(0.48 0.2 270) 100%)",
        fontFamily: "system-ui, sans-serif",
        color: "white",
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          marginBottom: 16,
        }}
      >
        Qiimale
      </div>
      <div
        style={{
          fontSize: 36,
          opacity: 0.8,
        }}
      >
        Review Somali places & services
      </div>
    </div>,
    { ...size },
  );
}
