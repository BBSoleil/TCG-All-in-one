import { ImageResponse } from "next/og";
import { getCardById } from "@/features/cards/services";

export const runtime = "nodejs";
export const alt = "Card details";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCardById(id);

  if (!result.success) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #0d0e14, #1a1b26)",
            color: "#fff",
            fontSize: 48,
          }}
        >
          Card not found
        </div>
      ),
      { ...size },
    );
  }

  const card = result.data;
  const price = card.marketPrice ? `$${Number(card.marketPrice).toFixed(2)}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0d0e14 0%, #1a1b26 50%, #2d1a4e 100%)",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        {card.imageUrl && (
          <div
            style={{
              display: "flex",
              width: 300,
              height: 420,
              borderRadius: 16,
              overflow: "hidden",
              marginRight: 60,
              boxShadow: "0 0 40px rgba(168, 85, 247, 0.3)",
              flexShrink: 0,
            }}
          >
            <img
              src={card.imageUrl}
              alt={card.name}
              width={300}
              height={420}
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: "#a855f7",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            TCG All-in-One
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {card.name}
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                background: "#a855f7",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {card.gameType}
            </div>
            {card.rarity && (
              <div
                style={{
                  display: "flex",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 16,
                }}
              >
                {card.rarity}
              </div>
            )}
          </div>
          {card.setName && (
            <div
              style={{
                fontSize: 20,
                color: "#94a3b8",
                marginBottom: 16,
              }}
            >
              {card.setName}
            </div>
          )}
          {price && (
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: "#facc15",
              }}
            >
              {price}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
