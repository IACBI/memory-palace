import { ImageResponse } from "next/og";

// Required under `output: export` — the image is baked at build time.
export const dynamic = "force-static";

export const alt = "Memory Palace — a spatial home for everything you know";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card. Uses the palace's own palette so a link preview looks like
 * the app rather than a generic screenshot.
 */
export default function OpengraphImage() {
  // Literal 8-digit hex rather than a runtime suffix: these are baked into a
  // PNG at build time and never go through the palette tokens.
  const rooms = [
    { left: 80, top: 0, w: 190, h: 190, rail: "#d9b25f", fill: "#d9b25f1f" },
    { left: 290, top: 0, w: 130, h: 120, rail: "#e58f89", fill: "#e58f891f" },
    { left: 290, top: 140, w: 130, h: 50, rail: "#79c9a2", fill: "#79c9a21f" },
    { left: 440, top: 0, w: 160, h: 190, rail: "#8fb3e8", fill: "#8fb3e81f" },
    { left: 620, top: 0, w: 110, h: 90, rail: "#c99ae0", fill: "#c99ae01f" },
    { left: 620, top: 110, w: 110, h: 80, rail: "#d7a37e", fill: "#d7a37e1f" },
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // The one warm light at the top of the room, same as the app shell.
        background:
          "radial-gradient(120% 100% at 50% 0%, #2a231a 0%, #0f0f11 60%)",
        padding: 72,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#eeeae4",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Memory
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#f0b775",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Palace
        </div>
        <div style={{ fontSize: 30, color: "#a29b92", marginTop: 22 }}>
          A spatial home for everything you know.
        </div>
      </div>

      {/* A miniature floor plan, echoing the app's own palette */}
      <div style={{ display: "flex", position: "relative", height: 200 }}>
        {rooms.map((room, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: room.left,
              top: room.top,
              width: room.w,
              height: room.h,
              borderRadius: 14,
              background: room.fill,
              borderLeft: `4px solid ${room.rail}`,
            }}
          />
        ))}
      </div>
    </div>,
    size,
  );
}
