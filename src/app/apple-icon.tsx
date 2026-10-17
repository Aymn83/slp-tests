import { ImageResponse } from "next/og";

// أيقونة الشاشة الرئيسية لأجهزة Apple
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f766e" }}>
        <svg width="120" height="120" viewBox="0 0 48 48">
          <rect x="4" y="6" width="40" height="30" rx="10" fill="#ffffff" />
          <path d="M14 35 L12 44 L23 35 Z" fill="#ffffff" />
          <g stroke="#0f766e" strokeWidth="3" strokeLinecap="round">
            <line x1="15" y1="18" x2="15" y2="24" />
            <line x1="21" y1="14" x2="21" y2="28" />
            <line x1="27" y1="16" x2="27" y2="26" />
            <line x1="33" y1="19" x2="33" y2="23" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
