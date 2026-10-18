import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "الاختبارات الخاصة باضطرابات اللغة والكلام",
    short_name: "therapists-slp",
    description: "منصة متخصصة لأخصائيي النطق واللغة: اختبارات إلكترونية وتقارير ودليل للاختصاصيين المعتمدين.",
    start_url: "/specialists",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#f5f7f8",
    theme_color: "#0f766e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
