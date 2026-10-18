import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { getDict } from "@/lib/i18n";
import { NO_INDEX } from "@/lib/seo";
import { ForgotForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.forgotTitle, robots: NO_INDEX };
}

export default async function ForgotPasswordPage() {
  const { t } = await getDict();
  return (
    <PublicShell>
      <ForgotForm t={t} />
    </PublicShell>
  );
}
