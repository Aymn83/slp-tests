import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// يُسمح بفهرسة الصفحات العامة فقط؛ صفحات المنصة الداخلية خاصة
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/specialists", "/login", "/register"],
      disallow: ["/dashboard", "/cases", "/assessments", "/tests", "/profile", "/admin", "/pending", "/session-reset"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
