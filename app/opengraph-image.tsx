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
    { left: 80, top: 0, w: 190, h: 190, rail: "#c9a227", fill: "#c9a22722" },
    { left: 290, top: 0, w: 130, h: 120, rail: "#7d3b3b", fill: "#7d3b3b22" },
    { left: 290, top: 140, w: 130, h: 50, rail: "#4a6350", fill: "#4a635022" },
    { left: 440, top: 0, w: 160, h: 190, rail: "#48566b", fill: "#48566b22" },
    { left: 620, top: 0, w: 110, h: 90, rail: "#6e4a63", fill: "#6e4a6322" },
    { left: 620, top: 110, w: 110, h: 80, rail: "#8a6a45", fill: "#8a6a4522" },
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "radial-gradient(120% 100% at 50% 0%, #1d1913 0%, #121110 60%)",
        padding: 72,
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 76,
            color: "#e8e3d8",
            letterSpacing: "0.01em",
            lineHeight: 1.05,
          }}
        >
          Memory
        </div>
        <div
          style={{
            fontSize: 76,
            color: "#c9a227",
            letterSpacing: "0.01em",
            lineHeight: 1.05,
          }}
        >
          Palace
        </div>
        <div style={{ fontSize: 30, color: "#9a917f", marginTop: 22 }}>
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
