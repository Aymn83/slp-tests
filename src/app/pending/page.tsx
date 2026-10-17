import { redirect } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { canUseSite, getCurrentUser, isExpired } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { getDict } from "@/lib/i18n";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/session-reset"); // لا جلسة، أو جلسة لمستخدم لم يعد موجوداً
  if (canUseSite(user)) redirect("/dashboard");
  const { t } = await getDict();
  const body =
    user.status === "rejected"
      ? t.rejectedBody
      : user.status === "suspended"
        ? t.suspendedBody
        : user.status === "active" && isExpired(user)
          ? t.expiredBody
          : t.pendingBody;
  return (
    <PublicShell>
      <div className="space-y-4 text-center">
        <h2 className="h2">{t.pendingTitle}</h2>
        <p className="text-ink-soft">{body}</p>
        <form action={logoutAction}>
          <button className="btn">{t.logout}</button>
        </form>
      </div>
    </PublicShell>
  );
}
