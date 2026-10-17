import { ImageResponse } from "next/og";

// صورة المعاينة عند مشاركة رابط الموقع (واتساب، فيسبوك، X…).
// النص بالإنجليزية لأن مولّد الصور لا يدعم وصل الحروف العربية؛ العنوان العربي يظهر بجانب الصورة من وسوم الصفحة.
export const alt = "myskills.lt — Speech & Language Disorders Assessments";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 48 48">
          <rect x="4" y="6" width="40" height="30" rx="10" fill="#ffffff" />
          <path d="M14 35 L12 44 L23 35 Z" fill="#ffffff" />
          <g stroke="#0f766e" strokeWidth="3" strokeLinecap="round">
            <line x1="15" y1="18" x2="15" y2="24" />
            <line x1="21" y1="14" x2="21" y2="28" />
            <line x1="27" y1="16" x2="27" y2="26" />
            <line x1="33" y1="19" x2="33" y2="23" />
          </g>
        </svg>
        <div style={{ fontSize: 64, fontWeight: 700 }}>Speech &amp; Language Assessments</div>
        <div style={{ fontSize: 34, opacity: 0.9 }}>Online tests · Reports · Certified specialists</div>
        <div style={{ fontSize: 30, marginTop: 10, padding: "8px 28px", borderRadius: 999, background: "rgba(255,255,255,0.15)" }}>myskills.lt</div>
      </div>
    ),
    size,
  );
}
