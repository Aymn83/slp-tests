import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { getDict } from "@/lib/i18n";
import { NO_INDEX } from "@/lib/seo";
import { findValidResetToken } from "@/lib/reset-tokens";
import { ResetForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.resetTitle, robots: NO_INDEX, referrer: "no-referrer" };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { t } = await getDict();
  const token = (await searchParams).token ?? "";
  const valid = !!(await findValidResetToken(token));
  return (
    <PublicShell>
      {valid ? (
        <ResetForm t={t} token={token} />
      ) : (
        <div className="space-y-4 text-center">
          <h2 className="h2">{t.resetTitle}</h2>
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t.resetInvalid}</p>
          <Link href="/forgot-password" className="btn btn-primary">
            {t.requestNewLink}
          </Link>
        </div>
      )}
    </PublicShell>
  );
}
