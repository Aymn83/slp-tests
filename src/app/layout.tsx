import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { getDict } from "@/lib/i18n";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.siteTitle, description: t.siteSubtitle };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { lang } = await getDict();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${cairo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-page font-sans text-ink">{children}</body>
    </html>
  );
}
