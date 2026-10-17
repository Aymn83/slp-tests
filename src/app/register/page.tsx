import { PublicShell } from "@/components/public-shell";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.register, alternates: { canonical: "/register" } };
}

export default async function RegisterPage() {
  const { t } = await getDict();
  return (
    <PublicShell>
      <RegisterForm t={t} />
    </PublicShell>
  );
}
