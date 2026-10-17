import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

// تُحدَّث كل ساعة لتشمل الاختصاصيين المعتمدين حديثاً
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const specialists = await prisma.specialist.findMany({
    where: { status: "approved" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const latest = specialists[0]?.updatedAt ?? new Date();
  return [
    { url: `${SITE_URL}/specialists`, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/specialists/join`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    ...specialists.map((s) => ({
      url: `${SITE_URL}/specialists/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
