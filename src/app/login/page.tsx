import { PublicShell } from "@/components/public-shell";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.login, alternates: { canonical: "/login" } };
}

export default async function LoginPage() {
  const { t } = await getDict();
  return (
    <PublicShell>
      <LoginForm t={t} />
    </PublicShell>
  );
}
