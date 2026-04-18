import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "TCG All-in-One — Intelligent Collector's Vault";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0d0e14 0%, #1a1b26 40%, #2d1a4e 100%)",
          padding: "80px 100px",
          fontFamily: "sans-serif",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "#a855f7",
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          TCG All-in-One
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 28,
            maxWidth: 900,
            letterSpacing: -1,
          }}
        >
          {"Your intelligent collector's vault"}
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#94a3b8",
            lineHeight: 1.3,
            marginBottom: 48,
            maxWidth: 900,
          }}
        >
          Track, value, build and connect across Pokemon, Yu-Gi-Oh!, Magic, and One Piece.
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["Pokemon", "Yu-Gi-Oh!", "Magic", "One Piece"].map((g) => (
            <div
              key={g}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 10,
                background: "rgba(168, 85, 247, 0.18)",
                border: "1px solid rgba(168, 85, 247, 0.45)",
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              {g}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
