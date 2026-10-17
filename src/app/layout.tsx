import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { getDict } from "@/lib/i18n";
import { SEO_KEYWORDS, SITE_URL } from "@/lib/seo";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDict();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.siteTitle, template: `%s | ${t.siteTitle}` },
    description: t.seoDescription,
    keywords: SEO_KEYWORDS,
    applicationName: t.siteTitle,
    formatDetection: { telephone: false, email: false, address: false },
    openGraph: {
      type: "website",
      siteName: t.siteTitle,
      title: t.siteTitle,
      description: t.seoDescription,
      url: SITE_URL,
      locale: lang === "en" ? "en_US" : "ar_AR",
    },
    twitter: { card: "summary_large_image", title: t.siteTitle, description: t.seoDescription },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { lang } = await getDict();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${cairo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-page font-sans text-ink">{children}</body>
    </html>
  );
}
