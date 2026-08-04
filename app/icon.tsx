import { ImageResponse } from "next/og";

// Required under `output: export` — the icon is baked at build time.
export const dynamic = "force-static";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * The app mark: a brass doorway on the palace's near-black. Generated rather
 * than checked in as a binary so it stays in step with the palette tokens.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#121110",
        borderRadius: 14,
      }}
    >
      <svg
        width="38"
        height="38"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#c9a227"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 4h3a2 2 0 0 1 2 2v14" />
        <path d="M2 20h3" />
        <path d="M13 20h9" />
        <path d="M10 12v.01" />
        <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" />
      </svg>
    </div>,
    size,
  );
}
