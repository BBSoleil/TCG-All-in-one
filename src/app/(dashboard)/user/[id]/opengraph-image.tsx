import { ImageResponse } from "next/og";
import { getUserOgData } from "@/features/social/services/profiles";

export const runtime = "nodejs";
export const alt = "User profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getUserOgData(id);

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
          User not found
        </div>
      ),
      { ...size },
    );
  }

  const user = result.data;
  const name = user.name ?? "Collector";
  const initial = name[0]?.toUpperCase() ?? "?";

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
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: "50%",
            overflow: "hidden",
            marginRight: 60,
            background: "#a855f7",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 40px rgba(168, 85, 247, 0.3)",
          }}
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={name}
              width={160}
              height={160}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "#fff",
                display: "flex",
              }}
            >
              {initial}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
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
              marginBottom: 16,
            }}
          >
            {name}
          </div>
          {user.bio && (
            <div
              style={{
                fontSize: 20,
                color: "#94a3b8",
                marginBottom: 24,
                maxWidth: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
              }}
            >
              {user.bio.length > 100 ? `${user.bio.slice(0, 100)}...` : user.bio}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 40,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#facc15", display: "flex" }}>
                {user.collectionCount}
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", display: "flex" }}>Collections</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#facc15", display: "flex" }}>
                {user.followerCount}
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", display: "flex" }}>Followers</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#facc15", display: "flex" }}>
                {user.achievementCount}
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", display: "flex" }}>Achievements</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
