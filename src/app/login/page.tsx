import { PublicShell } from "@/components/public-shell";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.login, alternates: { canonical: "/login" } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ as?: string; reset?: string }> }) {
  const { t } = await getDict();
  const sp = await searchParams;
  const as = sp.as === "student" ? "student" : "specialist";
  return (
    <PublicShell>
      <LoginForm t={t} initialAs={as} resetDone={sp.reset === "1"} />
    </PublicShell>
  );
}
